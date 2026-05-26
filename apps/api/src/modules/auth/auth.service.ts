import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  readTokenVersion,
  sessionRevocationUpdate,
} from '../../common/utils/token-version';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { getLoginRateLimiter } from '../../common/security/login-rate-limit';
import { EmailService } from '../queues/email/email.service';
import { AuditService } from '../audit/audit.service';

export type AuthTokenResponse = {
  access_token: string;
  refresh_token: string;
};

export type AuthAccessTokenResponse = Pick<AuthTokenResponse, 'access_token'>;

export type AuthLogoutResponse = {
  message: string;
};

export type GoogleProfileInput = {
  googleId: string;
  email: string;
  name?: string;
};

export type GoogleAuthResult = {
  user: User;
  tokens: AuthTokenResponse;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  // ================================
  // Register
  // ================================
  async register(registerDto: RegisterDto): Promise<AuthTokenResponse> {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.client.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        name: registerDto.name,
      },
    });
    await this.emailService.sendWelcomeEmail(user.email, user.name ?? '');
    const tokens = await this.generateToken(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  // ================================
  // Login
  // ================================
  async login(loginDto: LoginDto): Promise<AuthTokenResponse> {
    try {
      await getLoginRateLimiter().consume(loginDto.email);
    } catch {
      throw new UnauthorizedException('Too many login attempts');
    }
    const user = await this.prisma.client.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.password) {
      await this.auditService.log({
        action: 'LOGIN_FAILED',
        resource: 'AUTH',
        metadata: { email: loginDto.email },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateToken(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refresh_token);
    await this.auditService.log({
      userId: user.id,

      action: 'LOGIN_SUCCESS',

      resource: 'AUTH',

      metadata: {
        email: user.email,
      },
    });

    return tokens;
  }

  // ================================
  // Logout
  // ================================
  async logout(userId: string): Promise<AuthLogoutResponse> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    await this.prisma.client.user.update({
      where: { id: userId },
      data: sessionRevocationUpdate(user),
    });

    return { message: 'Logged out successfully' };
  }

  // ================================
  // Refresh Token
  // ================================
  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<AuthTokenResponse> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const hashedRefreshToken = this.getStoredRefreshToken(
      user.hashedRefreshToken,
    );

    const refreshTokenMatches = await bcrypt.compare(
      refreshToken,
      hashedRefreshToken,
    );

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateToken(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async refreshFromCookie(
    refreshToken: string | undefined,
  ): Promise<AuthTokenResponse> {
    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.refreshTokens(payload.sub, refreshToken);
  }

  async logoutFromCookie(
    refreshToken: string | undefined,
    accessToken: string | undefined,
  ): Promise<AuthLogoutResponse> {
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(
          refreshToken,
          {
            secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
          },
        );
        return this.logout(payload.sub);
      } catch {
        // Invalid or expired cookie — try access token below
      }
    }

    const userId = await this.getUserIdFromAccessToken(accessToken);
    if (userId) {
      return this.logout(userId);
    }

    return { message: 'Logged out successfully' };
  }

  async getUserIdFromAccessToken(
    accessToken: string | undefined,
  ): Promise<string | undefined> {
    if (!accessToken) {
      return undefined;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        accessToken,
        {
          secret: process.env.JWT_SECRET || 'dev_secret',
        },
      );
      return payload.sub;
    } catch {
      return undefined;
    }
  }

  // ================================
  // Google OAuth
  // ================================
  async validateGoogleUser(
    profile: GoogleProfileInput,
  ): Promise<GoogleAuthResult> {
    let user = await this.prisma.client.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      const byEmail = await this.prisma.client.user.findUnique({
        where: { email: profile.email },
      });
      if (byEmail) {
        user = await this.prisma.client.user.update({
          where: { id: byEmail.id },
          data: { googleId: profile.googleId },
        });
      }
    }

    if (!user) {
      user = await this.prisma.client.user.create({
        data: {
          email: profile.email,
          googleId: profile.googleId,
          name: profile.name,
        },
      });
    }

    const tokens = await this.generateToken(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return { user, tokens };
  }

  private getStoredRefreshToken(hashedRefreshToken: unknown): string {
    if (typeof hashedRefreshToken !== 'string') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return hashedRefreshToken;
  }

  // ================================
  // Update Refresh Token
  // ================================
  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  // ================================
  // Generate Token
  // ================================
  async generateToken(
    userId: string,
    email: string,
    role: Role,
  ): Promise<AuthTokenResponse> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload: JwtPayload = {
      sub: userId,
      email,
      role,
      tokenVersion: readTokenVersion(user),
    };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret',
      expiresIn: '15m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret',
      expiresIn: '7d',
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
