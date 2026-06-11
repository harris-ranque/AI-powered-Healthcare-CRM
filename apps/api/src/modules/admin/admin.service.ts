import { Injectable } from '@nestjs/common';
import { MemberStatus } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import {
  normalizeSubscriptionStatus,
  startOfUtcMonth,
  type SubscriptionBucket,
} from './admin.utils';

export type AdminOverview = {
  organizations: number;
  users: number;
  activeSubscriptions: number;
  aiTokensThisMonth: number;
  aiCostThisMonth: number;
  aiRequestsThisMonth: number;
};

export type AdminOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  stripeSubscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  users: number;
  createdAt: string;
};

export type AdminSubscriptionOrgRow = {
  id: string;
  name: string;
  slug: string;
  subscriptionPlan: string;
  stripeSubscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
};

export type AdminSubscriptionSummary = {
  counts: {
    active: number;
    canceled: number;
    pastDue: number;
    none: number;
  };
  organizations: Record<SubscriptionBucket, AdminSubscriptionOrgRow[]>;
};

export type AdminAiUsageTopCustomer = {
  organizationId: string;
  organizationName: string;
  tokens: number;
  cost: number;
  requests: number;
};

export type AdminAiUsage = {
  tokensThisMonth: number;
  costThisMonth: number;
  requestsThisMonth: number;
  topCustomers: AdminAiUsageTopCustomer[];
};

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(): Promise<AdminOverview> {
    const monthStart = startOfUtcMonth(new Date());

    const [organizations, users, orgsWithStatus, aiUsage] = await Promise.all([
      this.prisma.client.organization.count(),
      this.prisma.client.user.count(),
      this.prisma.client.organization.findMany({
        select: { stripeSubscriptionStatus: true },
      }),
      this.prisma.client.aiRequestLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { tokens: true, cost: true },
        _count: true,
      }),
    ]);

    const activeSubscriptions = orgsWithStatus.filter(
      (org) => normalizeSubscriptionStatus(org.stripeSubscriptionStatus) === 'active',
    ).length;

    return {
      organizations,
      users,
      activeSubscriptions,
      aiTokensThisMonth: aiUsage._sum.tokens ?? 0,
      aiCostThisMonth: aiUsage._sum.cost ?? 0,
      aiRequestsThisMonth: aiUsage._count,
    };
  }

  async listOrganizations(): Promise<AdminOrganizationRow[]> {
    const organizations = await this.prisma.client.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true,
        stripeSubscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = await Promise.all(
      organizations.map(async (org) => {
        const users = await this.prisma.client.organizationMember.count({
          where: {
            organizationId: org.id,
            status: { not: MemberStatus.DISABLED },
          },
        });

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          subscriptionPlan: org.subscriptionPlan,
          stripeSubscriptionStatus: org.stripeSubscriptionStatus,
          subscriptionCurrentPeriodEnd:
            org.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
          users,
          createdAt: org.createdAt.toISOString(),
        };
      }),
    );

    return rows;
  }

  async getSubscriptionSummary(): Promise<AdminSubscriptionSummary> {
    const organizations = await this.prisma.client.organization.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionPlan: true,
        stripeSubscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
      },
      orderBy: { name: 'asc' },
    });

    const buckets: Record<SubscriptionBucket, AdminSubscriptionOrgRow[]> = {
      active: [],
      canceled: [],
      pastDue: [],
      none: [],
    };

    for (const org of organizations) {
      const bucket = normalizeSubscriptionStatus(org.stripeSubscriptionStatus);
      buckets[bucket].push({
        id: org.id,
        name: org.name,
        slug: org.slug,
        subscriptionPlan: org.subscriptionPlan,
        stripeSubscriptionStatus: org.stripeSubscriptionStatus,
        subscriptionCurrentPeriodEnd:
          org.subscriptionCurrentPeriodEnd?.toISOString() ?? null,
      });
    }

    return {
      counts: {
        active: buckets.active.length,
        canceled: buckets.canceled.length,
        pastDue: buckets.pastDue.length,
        none: buckets.none.length,
      },
      organizations: buckets,
    };
  }

  async getAiUsage(): Promise<AdminAiUsage> {
    const monthStart = startOfUtcMonth(new Date());

    const [platformUsage, topByOrg] = await Promise.all([
      this.prisma.client.aiRequestLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { tokens: true, cost: true },
        _count: true,
      }),
      this.prisma.client.aiRequestLog.groupBy({
        by: ['organizationId'],
        where: { createdAt: { gte: monthStart } },
        _sum: { tokens: true, cost: true },
        _count: true,
        orderBy: { _sum: { tokens: 'desc' } },
        take: 10,
      }),
    ]);

    const orgIds = topByOrg.map((row) => row.organizationId);
    const orgs = orgIds.length
      ? await this.prisma.client.organization.findMany({
          where: { id: { in: orgIds } },
          select: { id: true, name: true },
        })
      : [];

    const orgNameById = new Map(orgs.map((org) => [org.id, org.name]));

    return {
      tokensThisMonth: platformUsage._sum.tokens ?? 0,
      costThisMonth: platformUsage._sum.cost ?? 0,
      requestsThisMonth: platformUsage._count,
      topCustomers: topByOrg.map((row) => ({
        organizationId: row.organizationId,
        organizationName: orgNameById.get(row.organizationId) ?? 'Unknown',
        tokens: row._sum.tokens ?? 0,
        cost: row._sum.cost ?? 0,
        requests: row._count,
      })),
    };
  }
}
