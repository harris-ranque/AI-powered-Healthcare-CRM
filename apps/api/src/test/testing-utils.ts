import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TestingModuleBuilder } from '@nestjs/testing';
import { JwtAuthGuard } from '../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../common/guards/organization-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { PrismaService } from '../database/prisma.service';
import { InvitationsService } from '../modules/invitations/invitations.service';
import { OtpService } from '../modules/auth/otp.service';

export const mockGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

export function applyGuardOverrides(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder
    .overrideGuard(JwtAuthGuard)
    .useValue(mockGuard)
    .overrideGuard(OrganizationContextGuard)
    .useValue(mockGuard)
    .overrideGuard(PermissionsGuard)
    .useValue(mockGuard)
    .overrideGuard(RolesGuard)
    .useValue(mockGuard);
}

export const mockPrismaService = {
  provide: PrismaService,
  useValue: {
    client: {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organization: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organizationMember: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      patient: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      auditLog: { create: jest.fn(), findMany: jest.fn() },
      file: { create: jest.fn(), count: jest.fn() },
      aiRequestLog: { count: jest.fn() },
      appointment: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      notification: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    },
    findPaymentByStripePaymentIntentId: jest.fn(),
    updatePaymentStatus: jest.fn(),
    createFile: jest.fn(),
  },
};

export const mockJwtService = {
  provide: JwtService,
  useValue: {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  },
};

export const mockConfigService = {
  provide: ConfigService,
  useValue: {
    get: jest.fn(),
  },
};

export const mockInvitationsService = {
  provide: InvitationsService,
  useValue: {
    getByToken: jest.fn(),
    consume: jest.fn(),
  },
};

export const mockOtpService = {
  provide: OtpService,
  useValue: {
    createChallenge: jest.fn(),
    verifyAndConsume: jest.fn(),
  },
};
