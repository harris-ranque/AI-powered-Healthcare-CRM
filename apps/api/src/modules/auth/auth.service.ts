import {
  BadRequestException,
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
import { RegisterProviderDto } from './dto/register-provider.dto';
import { RegisterSoloDto } from './dto/register-solo.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
import { JwtPayload } from './types/jwt-payload.type';
import { getLoginRateLimiter } from '../../common/security/login-rate-limit';
import { EmailService } from '../queues/email/email.service';
import { AuditService } from '../audit/audit.service';
import { BillingService } from '../billing/billing.service';
import { InvitationsService } from '../invitations/invitations.service';
import { OtpService } from './otp.service';
import type { OtpPendingResponse } from './types/otp.types';

export type { OtpPendingResponse } from './types/otp.types';

type ResolvedRegistration = {
  email: string;
  googleId: string | undefined;
  passwordHash: string | null;
};

type RegisterChallengePayload = {
  resolved: ResolvedRegistration;
  dto:
    | RegisterProviderDto
    | RegisterClinicDto
    | RegisterStaffDto
    | RegisterPatientDto
    | RegisterSoloDto;
};

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
  name?: string | null;
  role: Role;
  organizationId?: string;
  memberStatus?: MemberStatus;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
};

import type {
  GoogleOnboardingPayload,
  GoogleOnboardingResponse,
  GoogleProfileInput,
} from './types/google-oauth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
    private readonly billingService: BillingService,
    private invitationsService: InvitationsService,
    private otpService: OtpService,
  ) {}

  // ================================
  // OTP — login / register start
  // ================================
  async startLogin(loginDto: LoginDto): Promise<OtpPendingResponse> {
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

    return this.otpService.createChallenge({
      purpose: 'LOGIN',
      email: user.email,
      userId: user.id,
    });
  }

  async startRegisterProvider(
    registerDto: RegisterProviderDto,
  ): Promise<OtpPendingResponse> {
    const payload = await this.prepareRegisterProvider(registerDto);
    return this.otpService.createChallenge({
      purpose: 'REGISTER_PROVIDER',
      email: payload.resolved.email,
      payload,
    });
  }

  async startRegisterClinic(
    registerDto: RegisterClinicDto,
  ): Promise<OtpPendingResponse> {
    return this.startRegisterProvider({
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password,
      googleToken: registerDto.googleToken,
    });
  }

  async startRegisterStaff(
    registerDto: RegisterStaffDto,
  ): Promise<OtpPendingResponse> {
    const payload = await this.prepareRegisterStaff(registerDto);
    return this.otpService.createChallenge({
      purpose: 'REGISTER_STAFF',
      email: payload.resolved.email,
      payload,
    });
  }

  async startRegisterPatient(
    registerDto: RegisterPatientDto,
  ): Promise<OtpPendingResponse> {
    const payload = await this.prepareRegisterPatient(registerDto);
    return this.otpService.createChallenge({
      purpose: 'REGISTER_PATIENT',
      email: payload.resolved.email,
      payload,
    });
  }

  async startRegisterSolo(
    registerDto: RegisterSoloDto,
  ): Promise<OtpPendingResponse> {
    return this.startRegisterProvider({
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password,
      googleToken: registerDto.googleToken,
    });
  }

  async verifyOtp(
    otpSessionId: string,
    code: string,
  ): Promise<AuthTokenResponse> {
    const challenge = await this.otpService.verifyCode(otpSessionId, code);

    if (challenge.purpose === 'LOGIN') {
      if (!challenge.userId) {
        throw new BadRequestException('Invalid login verification session');
      }
      const user = await this.prisma.client.user.findUnique({
        where: { id: challenge.userId },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const tokens = await this.generateToken(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refresh_token);
      await this.auditService.log({
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'AUTH',
        metadata: { email: user.email },
      });
      return tokens;
    }

    const payload = challenge.payload as RegisterChallengePayload | undefined;
    if (!payload) {
      throw new BadRequestException(
        'Invalid registration verification session',
      );
    }

    switch (challenge.purpose) {
      case 'REGISTER_PROVIDER':
        return this.executeRegisterProvider(
          payload.dto as RegisterProviderDto,
          payload.resolved,
        );
      case 'REGISTER_CLINIC':
        return this.executeRegisterProvider(
          {
            email: (payload.dto as RegisterClinicDto).email,
            name: (payload.dto as RegisterClinicDto).name,
          },
          payload.resolved,
        );
      case 'REGISTER_STAFF':
        return this.executeRegisterStaff(
          payload.dto as RegisterStaffDto,
          payload.resolved,
        );
      case 'REGISTER_PATIENT':
        return this.executeRegisterPatient(
          payload.dto as RegisterPatientDto,
          payload.resolved,
        );
      case 'REGISTER_SOLO':
        return this.executeRegisterProvider(
          {
            email: (payload.dto as RegisterSoloDto).email,
            name: (payload.dto as RegisterSoloDto).name,
          },
          payload.resolved,
        );
      default:
        throw new BadRequestException('Unknown verification purpose');
    }
  }

  async resendOtp(otpSessionId: string): Promise<OtpPendingResponse> {
    return this.otpService.resend(otpSessionId);
  }

  async registerLegacy(
    registerDto: RegisterClinicDto,
  ): Promise<OtpPendingResponse> {
    return this.startRegisterProvider({
      email: registerDto.email,
      name: registerDto.name,
      password: registerDto.password,
      googleToken: registerDto.googleToken,
    });
  }

  // ================================
  // Register provider (account only — org created in onboarding)
  // ================================
  private async prepareRegisterProvider(
    registerDto: RegisterProviderDto,
  ): Promise<RegisterChallengePayload> {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const resolved = await this.resolveGoogleRegistration(
      registerDto.email,
      registerDto.password,
      registerDto.googleToken,
    );

    return { dto: registerDto, resolved };
  }

  private async executeRegisterProvider(
    registerDto: RegisterProviderDto,
    resolved: ResolvedRegistration,
  ): Promise<AuthTokenResponse> {
    const user = await this.prisma.client.user.create({
      data: {
        email: resolved.email,
        password: resolved.passwordHash,
        googleId: resolved.googleId,
        name: registerDto.name,
        role: Role.CLINIC_OWNER,
      },
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name ?? '');
    const tokens = await this.generateToken(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  private async prepareRegisterStaff(
    registerDto: RegisterStaffDto,
  ): Promise<RegisterChallengePayload> {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const resolved = await this.resolveGoogleRegistration(
      registerDto.email,
      registerDto.password,
      registerDto.googleToken,
    );

    if (!registerDto.inviteToken) {
      if (!registerDto.clinicSlug || !registerDto.role) {
        throw new BadRequestException('Clinic and role are required');
      }
      const organization = await this.prisma.client.organization.findUnique({
        where: { slug: registerDto.clinicSlug },
        select: { id: true },
      });
      if (!organization) {
        throw new NotFoundException('Clinic not found');
      }
    } else {
      await this.invitationsService.getByToken(registerDto.inviteToken);
    }

    return { dto: registerDto, resolved };
  }

  private async executeRegisterStaff(
    registerDto: RegisterStaffDto,
    resolved: ResolvedRegistration,
  ): Promise<AuthTokenResponse> {
    const staffTarget = await this.resolveStaffRegistrationTarget(registerDto);
    await this.billingService.assertCanAddMember(staffTarget.organizationId);

    const user = await this.prisma.client.$transaction(async (tx) => {
      let organizationId: string;
      let memberRole: Role;

      if (registerDto.inviteToken) {
        const consumed = await this.invitationsService.consume(
          registerDto.inviteToken,
          registerDto.email,
          tx,
        );
        if (
          consumed.role !== Role.DOCTOR &&
          consumed.role !== Role.NURSE &&
          consumed.role !== Role.RECEPTIONIST
        ) {
          throw new BadRequestException('Invalid staff invitation');
        }
        if (
          registerDto.clinicSlug &&
          registerDto.clinicSlug !== consumed.clinicSlug
        ) {
          throw new BadRequestException('Clinic does not match invitation');
        }
        organizationId = consumed.organizationId;
        memberRole = consumed.role;
      } else {
        if (!registerDto.clinicSlug || !registerDto.role) {
          throw new BadRequestException('Clinic and role are required');
        }
        const organization = await tx.organization.findUnique({
          where: { slug: registerDto.clinicSlug },
          select: { id: true },
        });
        if (!organization) {
          throw new NotFoundException('Clinic not found');
        }
        organizationId = organization.id;
        memberRole = registerDto.role;
      }

      const createdUser = await tx.user.create({
        data: {
          email: resolved.email,
          password: resolved.passwordHash,
          googleId: resolved.googleId,
          name: registerDto.name,
          role: memberRole,
          organizationId,
        },
      });

      const memberStatus = registerDto.inviteToken
        ? MemberStatus.ACTIVE
        : MemberStatus.PENDING;

      await tx.organizationMember.create({
        data: {
          organizationId,
          userId: createdUser.id,
          role: memberRole,
          status: memberStatus,
        },
      });

      return createdUser;
    });

    await this.emailService.sendWelcomeEmail(user.email, user.name ?? '');
    const tokens = await this.generateToken(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  private async prepareRegisterPatient(
    registerDto: RegisterPatientDto,
  ): Promise<RegisterChallengePayload> {
    const existingUser = await this.prisma.client.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const resolved = await this.resolveGoogleRegistration(
      registerDto.email,
      registerDto.password,
      registerDto.googleToken,
    );

    if (!registerDto.inviteToken) {
      if (!registerDto.clinicSlug) {
        throw new BadRequestException('Clinic is required');
      }
      const organization = await this.prisma.client.organization.findUnique({
        where: { slug: registerDto.clinicSlug },
        select: { id: true },
      });
      if (!organization) {
        throw new NotFoundException('Clinic not found');
      }
    } else {
      await this.invitationsService.getByToken(registerDto.inviteToken);
    }

    return { dto: registerDto, resolved };
  }

  private async executeRegisterPatient(
    registerDto: RegisterPatientDto,
    resolved: ResolvedRegistration,
  ): Promise<AuthTokenResponse> {
    const organizationId = await this.resolvePatientOrganizationId(registerDto);
    const existingPatient = await this.prisma.client.patient.findFirst({
      where: {
        organizationId,
        email: registerDto.email,
        userId: null,
      },
    });
    if (!existingPatient) {
      await this.billingService.assertCanCreatePatient(organizationId);
    }

    const user = await this.prisma.client.$transaction(async (tx) => {
      let resolvedOrganizationId: string;

      if (registerDto.inviteToken) {
        const consumed = await this.invitationsService.consume(
          registerDto.inviteToken,
          registerDto.email,
          tx,
        );
        if (consumed.role !== Role.PATIENT) {
          throw new BadRequestException('Invalid client invitation');
        }
        if (
          registerDto.clinicSlug &&
          registerDto.clinicSlug !== consumed.clinicSlug
        ) {
          throw new BadRequestException('Clinic does not match invitation');
        }
        resolvedOrganizationId = consumed.organizationId;
      } else {
        if (!registerDto.clinicSlug) {
          throw new BadRequestException('Clinic is required');
        }
        const organization = await tx.organization.findUnique({
          where: { slug: registerDto.clinicSlug },
          select: { id: true },
        });
        if (!organization) {
          throw new NotFoundException('Clinic not found');
        }
        resolvedOrganizationId = organization.id;
      }

      const createdUser = await tx.user.create({
        data: {
          email: resolved.email,
          password: resolved.passwordHash,
          googleId: resolved.googleId,
          name: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
          role: Role.PATIENT,
          organizationId: resolvedOrganizationId,
        },
      });

      const linkedPatient = await tx.patient.findFirst({
        where: {
          organizationId: resolvedOrganizationId,
          email: registerDto.email,
          userId: null,
        },
      });

      if (linkedPatient) {
        await tx.patient.update({
          where: { id: linkedPatient.id },
          data: { userId: createdUser.id },
        });
      } else {
        await tx.patient.create({
          data: {
            organizationId: resolvedOrganizationId,
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

  private async resolveStaffRegistrationTarget(
    registerDto: RegisterStaffDto,
  ): Promise<{ organizationId: string; memberRole: Role }> {
    if (registerDto.inviteToken) {
      const invitation = await this.prisma.client.invitation.findUnique({
        where: { token: registerDto.inviteToken },
        select: { organizationId: true, role: true },
      });
      if (!invitation) {
        throw new BadRequestException('Invalid invitation');
      }
      return {
        organizationId: invitation.organizationId,
        memberRole: invitation.role,
      };
    }

    if (!registerDto.clinicSlug || !registerDto.role) {
      throw new BadRequestException('Clinic and role are required');
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: registerDto.clinicSlug },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Clinic not found');
    }

    return {
      organizationId: organization.id,
      memberRole: registerDto.role,
    };
  }

  private async resolvePatientOrganizationId(
    registerDto: RegisterPatientDto,
  ): Promise<string> {
    if (registerDto.inviteToken) {
      const invitation = await this.prisma.client.invitation.findUnique({
        where: { token: registerDto.inviteToken },
        select: { organizationId: true },
      });
      if (!invitation) {
        throw new BadRequestException('Invalid invitation');
      }
      return invitation.organizationId;
    }

    if (!registerDto.clinicSlug) {
      throw new BadRequestException('Clinic is required');
    }

    const organization = await this.prisma.client.organization.findUnique({
      where: { slug: registerDto.clinicSlug },
      select: { id: true },
    });
    if (!organization) {
      throw new NotFoundException('Clinic not found');
    }

    return organization.id;
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
        name: true,
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

    const ownedOrganization = await this.prisma.client.organization.findUnique({
      where: { ownerId: userId },
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: ownedOrganization?.id ?? membership?.organizationId,
      memberStatus: membership?.status,
      onboardingCompleted:
        user.role === Role.CLINIC_OWNER
          ? (ownedOrganization?.onboardingCompleted ?? false)
          : true,
      onboardingStep: ownedOrganization?.onboardingStep,
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
  async findGoogleUser(profile: GoogleProfileInput): Promise<User | null> {
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

    return user;
  }

  async completeGoogleLogin(user: User): Promise<AuthTokenResponse> {
    const tokens = await this.generateToken(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    return tokens;
  }

  async signGoogleOnboardingToken(
    profile: GoogleProfileInput,
  ): Promise<string> {
    const payload: GoogleOnboardingPayload = {
      purpose: 'google_onboarding',
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
    };

    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET || 'dev_secret',
      expiresIn: '5m',
    });
  }

  async getGoogleOnboarding(token: string): Promise<GoogleOnboardingResponse> {
    const payload = await this.verifyGoogleOnboardingToken(token);
    return { email: payload.email, name: payload.name };
  }

  private async verifyGoogleOnboardingToken(
    token: string,
  ): Promise<GoogleOnboardingPayload> {
    try {
      const payload =
        await this.jwtService.verifyAsync<GoogleOnboardingPayload>(token, {
          secret: process.env.JWT_SECRET || 'dev_secret',
        });

      if (payload.purpose !== 'google_onboarding') {
        throw new UnauthorizedException('Invalid Google onboarding token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired Google onboarding token',
      );
    }
  }

  private async resolveGoogleRegistration(
    email: string,
    password: string | undefined,
    googleToken: string | undefined,
  ): Promise<{
    email: string;
    googleId: string | undefined;
    passwordHash: string | null;
  }> {
    if (!googleToken) {
      if (!password) {
        throw new BadRequestException('Password is required');
      }
      return {
        email,
        googleId: undefined,
        passwordHash: await bcrypt.hash(password, 10),
      };
    }

    const payload = await this.verifyGoogleOnboardingToken(googleToken);
    if (payload.email !== email) {
      throw new BadRequestException('Email must match your Google account');
    }

    return {
      email: payload.email,
      googleId: payload.googleId,
      passwordHash: null,
    };
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
