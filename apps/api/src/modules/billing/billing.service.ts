import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { UNLIMITED_DB_LIMIT, PLAN_CONFIG, type PlanConfig } from './plans';

export const LIMIT_REACHED = {
  PATIENT: 'PATIENT_LIMIT_REACHED',
  MEMBER: 'MEMBER_LIMIT_REACHED',
  AI: 'AI_LIMIT_REACHED',
} as const;

function isUnlimited(limit: number): boolean {
  return limit >= UNLIMITED_DB_LIMIT;
}

function startOfMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrganizationPlan(organizationId: string): Promise<PlanConfig> {
    const organization = await this.prisma.findOrganizationPlan(organizationId);

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return PLAN_CONFIG[organization.subscriptionPlan];
  }

  async hasFeature(organizationId: string, feature: string): Promise<boolean> {
    const organization = await this.prisma.findOrganizationPlan(organizationId);

    if (!organization) {
      return false;
    }

    return PLAN_CONFIG[organization.subscriptionPlan].features.includes(
      feature,
    );
  }

  async canCreatePatient(organizationId: string): Promise<boolean> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: { patientLimit: true },
    });

    if (!organization) {
      return false;
    }

    if (isUnlimited(organization.patientLimit)) {
      return true;
    }

    const count = await this.prisma.client.patient.count({
      where: { organizationId, deletedAt: null },
    });

    return count < organization.patientLimit;
  }

  async assertCanCreatePatient(organizationId: string): Promise<void> {
    if (!(await this.canCreatePatient(organizationId))) {
      throw new ForbiddenException(LIMIT_REACHED.PATIENT);
    }
  }

  async canAddMember(organizationId: string): Promise<boolean> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: { memberLimit: true },
    });

    if (!organization) {
      return false;
    }

    if (isUnlimited(organization.memberLimit)) {
      return true;
    }

    const count = await this.prisma.client.organizationMember.count({
      where: {
        organizationId,
        status: { not: MemberStatus.DISABLED },
      },
    });

    return count < organization.memberLimit;
  }

  async assertCanAddMember(organizationId: string): Promise<void> {
    if (!(await this.canAddMember(organizationId))) {
      throw new ForbiddenException(LIMIT_REACHED.MEMBER);
    }
  }

  async canUseAi(organizationId: string): Promise<boolean> {
    const organization = await this.prisma.client.organization.findUnique({
      where: { id: organizationId },
      select: { aiRequestLimitPerMonth: true },
    });

    if (!organization) {
      return false;
    }

    if (isUnlimited(organization.aiRequestLimitPerMonth)) {
      return true;
    }

    const count = await this.prisma.client.aiRequestLog.count({
      where: {
        organizationId,
        createdAt: { gte: startOfMonthUtc() },
      },
    });

    return count < organization.aiRequestLimitPerMonth;
  }

  async assertCanUseAi(organizationId: string): Promise<void> {
    if (!(await this.canUseAi(organizationId))) {
      throw new ForbiddenException(LIMIT_REACHED.AI);
    }
  }
}
