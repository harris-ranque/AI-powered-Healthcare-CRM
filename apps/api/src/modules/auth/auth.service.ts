import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MemberStatus, Role, type User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  readTokenVersion,
  sessionRevocationUpdate,
} from '../../common/utils/token-version';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterClinicDto } from './dto/register-clinic.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
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

export type AuthMeResponse = {
  id: string;
  email: string;
  role: Role;
  organizationId?: string;
  memberStatus?: MemberStatus;
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
  // Register clinic owner
  // ================================
  async registerClinic(
    registerDto: RegisterClinicDto,
  ): Promise<AuthTokenResponse> {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const existingSlug = await this.prisma.client.organization.findUnique({
      where: { slug: registerDto.clinicSlug },
    });
    if (existingSlug) {
      throw new ConflictException('Clinic slug already exists');
    }

    const user = await this.prisma.client.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
          role: Role.CLINIC_OWNER,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: registerDto.clinicName,
          slug: registerDto.clinicSlug,
          ownerId: createdUser.id,
          members: {
            connect: { id: createdUser.id },
          },
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: createdUser.id,
          role: Role.CLINIC_OWNER,
          status: MemberStatus.ACTIVE,
        },
      });

      await tx.user.update({
        where: { id: createdUser.id },
        data: { organizationId: organization.id },
      });

      return createdUser;
    });
    await this.emailService.sendWelcomeEmail(user.email, user.name ?? '');
    const tokens = await this.generateToken(user.id, user.email, user.role);

    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async registerStaff(registerDto: RegisterStaffDto): Promise<AuthTokenResponse> {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: registerDto.clinicSlug },
      select: { id: true, name: true, owner: { select: { email: true } } },
    });
    if (!organization) {
      throw new NotFoundException('Clinic not found');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.client.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: registerDto.name,
          role: registerDto.role,
          organizationId: organization.id,
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: createdUser.id,
          role: registerDto.role,
          status: MemberStatus.PENDING,
        },
      });

      return createdUser;
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name ?? '');
    const tokens = await this.generateToken(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async registerPatient(
    registerDto: RegisterPatientDto,
  ): Promise<AuthTokenResponse> {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: registerDto.clinicSlug },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Clinic not found');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.client.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          name: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
          role: Role.PATIENT,
          organizationId: organization.id,
        },
      });

      const existingPatient = await tx.patient.findFirst({
        where: {
          organizationId: organization.id,
          email: registerDto.email,
          userId: null,
        },
      });

      if (existingPatient) {
        await tx.patient.update({
          where: { id: existingPatient.id },
          data: { userId: createdUser.id },
        });
      } else {
        await tx.patient.create({
          data: {
            organizationId: organization.id,
            userId: createdUser.id,
            firstName: registerDto.firstName,
            lastName: registerDto.lastName,
            email: registerDto.email,
            phone: registerDto.phone,
            dateOfBirth: registerDto.dateOfBirth
              ? new Date(registerDto.dateOfBirth)
              : undefined,
          },
        });
      }

      return createdUser;
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name ?? '');
    const tokens = await this.generateToken(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async registerLegacy(registerDto: RegisterClinicDto): Promise<AuthTokenResponse> {
    return this.registerClinic(registerDto);
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

  async me(userId: string): Promise<AuthMeResponse> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const membership = await this.prisma.client.organizationMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: { organizationId: true, status: true },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: membership?.organizationId,
      memberStatus: membership?.status,
    };
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
          role: Role.PATIENT,
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
