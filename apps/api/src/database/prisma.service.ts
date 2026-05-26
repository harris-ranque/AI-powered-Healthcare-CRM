import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import type { File as StoredFile, Payment, Role } from '@prisma/client';
import type { AppConfig } from '../config/configuration';
import type { SubscriptionPlan } from '../common/enums/subscriptionplan.enum';
import { createPrismaPgAdapter } from './create-prisma-adapter';

export type OrganizationPlanRow = {
  subscriptionPlan: SubscriptionPlan;
  memberLimit: number;
};

export type OrganizationWithMemberCount = OrganizationPlanRow & {
  _count: { members: number };
};

export type ApiKeyRecord = {
  id: string;
  key: string;
  name: string;
  organizationId: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revoked: boolean;
  createdAt: Date;
};

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient;

  constructor(config: ConfigService<AppConfig, true>) {
    this.client = new PrismaClient({
      adapter: createPrismaPgAdapter(
        config.get('databaseUrl', { infer: true }),
      ),
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.$disconnect();
  }

  findPaymentByStripePaymentIntentId(
    stripePaymentIntentId: string,
  ): Promise<Payment | null> {
    return this.client.payment.findUnique({
      where: { stripePaymentIntentId },
    });
  }

  updatePaymentStatus(id: string, status: string): Promise<{ id: string }> {
    return this.client.payment.update({
      where: { id },
      data: { status },
      select: { id: true },
    });
  }

  createFile(data: Prisma.FileUncheckedCreateInput): Promise<StoredFile> {
    return this.client.file.create({ data });
  }

  findOrganizationMembership(
    organizationId: string,
    userId: string,
  ): Promise<{ role: Role } | null> {
    return this.client.organizationMember.findFirst({
      where: { organizationId, userId },
      select: { role: true },
    });
  }

  findOrganizationPlan(
    organizationId: string,
  ): Promise<OrganizationPlanRow | null> {
    return this.client.organization.findUnique({
      where: { id: organizationId },
      select: { subscriptionPlan: true, memberLimit: true },
    });
  }

  findOrganizationWithMemberCount(
    organizationId: string,
  ): Promise<OrganizationWithMemberCount | null> {
    return this.client.organization.findUnique({
      where: { id: organizationId },
      select: {
        subscriptionPlan: true,
        memberLimit: true,
        _count: { select: { members: true } },
      },
    });
  }

  findApiKey(key: string): Promise<ApiKeyRecord | null> {
    return this.client.apiKey.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        name: true,
        organizationId: true,
        lastUsedAt: true,
        expiresAt: true,
        revoked: true,
        createdAt: true,
      },
    });
  }

  touchApiKey(id: string): Promise<{ id: string }> {
    return this.client.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
      select: { id: true },
    });
  }
}
