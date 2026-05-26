import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TestingModuleBuilder } from '@nestjs/testing';
import { JwtAuthGuard } from '../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/role.guard';
import { PrismaService } from '../database/prisma.service';

export const mockGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

export function applyGuardOverrides(
  builder: TestingModuleBuilder,
): TestingModuleBuilder {
  return builder
    .overrideGuard(JwtAuthGuard)
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
      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      auditLog: { create: jest.fn() },
      file: { create: jest.fn() },
      notification: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
      },
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
