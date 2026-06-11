import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { UNLIMITED_DB_LIMIT } from './plans';
import { BillingService, LIMIT_REACHED } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;

  const prisma = {
    client: {
      organization: { findUnique: jest.fn() },
      patient: { count: jest.fn() },
      organizationMember: { count: jest.fn() },
      aiRequestLog: { count: jest.fn() },
    },
    findOrganizationPlan: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [BillingService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(BillingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assertCanCreatePatient', () => {
    it('allows creation when under patient limit', async () => {
      prisma.client.organization.findUnique.mockResolvedValue({
        patientLimit: 500,
      });
      prisma.client.patient.count.mockResolvedValue(499);

      await expect(
        service.assertCanCreatePatient('org-1'),
      ).resolves.toBeUndefined();
    });

    it('throws when patient limit is reached', async () => {
      prisma.client.organization.findUnique.mockResolvedValue({
        patientLimit: 500,
      });
      prisma.client.patient.count.mockResolvedValue(500);

      await expect(service.assertCanCreatePatient('org-1')).rejects.toThrow(
        new ForbiddenException(LIMIT_REACHED.PATIENT),
      );
    });
  });

  describe('assertCanAddMember', () => {
    it('counts organization members and throws at limit', async () => {
      prisma.client.organization.findUnique.mockResolvedValue({
        memberLimit: 5,
      });
      prisma.client.organizationMember.count.mockResolvedValue(5);

      await expect(service.assertCanAddMember('org-1')).rejects.toThrow(
        new ForbiddenException(LIMIT_REACHED.MEMBER),
      );

      expect(prisma.client.organizationMember.count).toHaveBeenCalledWith({
        where: {
          organizationId: 'org-1',
          status: { not: MemberStatus.DISABLED },
        },
      });
    });

    it('allows member creation when under limit', async () => {
      prisma.client.organization.findUnique.mockResolvedValue({
        memberLimit: 5,
      });
      prisma.client.organizationMember.count.mockResolvedValue(4);

      await expect(
        service.assertCanAddMember('org-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('assertCanUseAi', () => {
    it('throws when monthly AI limit is reached', async () => {
      prisma.client.organization.findUnique.mockResolvedValue({
        aiRequestLimitPerMonth: 100,
      });
      prisma.client.aiRequestLog.count.mockResolvedValue(100);

      await expect(service.assertCanUseAi('org-1')).rejects.toThrow(
        new ForbiddenException(LIMIT_REACHED.AI),
      );
    });

    it('never throws for unlimited enterprise limits', async () => {
      prisma.client.organization.findUnique.mockResolvedValue({
        aiRequestLimitPerMonth: UNLIMITED_DB_LIMIT,
      });

      await expect(service.assertCanUseAi('org-1')).resolves.toBeUndefined();
      expect(prisma.client.aiRequestLog.count).not.toHaveBeenCalled();
    });
  });
});
