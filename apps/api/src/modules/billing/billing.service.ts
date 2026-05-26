import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PLAN_CONFIG, type PlanConfig } from './plans';

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

  async canAddMember(organizationId: string): Promise<boolean> {
    const organization =
      await this.prisma.findOrganizationWithMemberCount(organizationId);

    if (!organization) {
      return false;
    }

    return organization._count.members < organization.memberLimit;
  }
}
