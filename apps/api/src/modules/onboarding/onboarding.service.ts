import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClinicSize, Role, SubscriptionPlan } from '@prisma/client';

import { getPermissionsForRole } from '../../common/permissions';
import type { OrganizationContext } from '../../common/types/organization-context.type';
import { suggestSlug } from '../../common/utils/suggest-slug';
import { PrismaService } from '../../database/prisma.service';
import { planLimitsForDb } from '../billing/plans';
import { CreateInvitationDto } from '../invitations/dto/create-invitation.dto';
import { InvitationsService } from '../invitations/invitations.service';
import { StripeService } from '../stripe/stripe.service';
import { UsageMetric } from '../usage-tracking/usage-metric.constants';
import { UsageTrackingService } from '../usage-tracking/usage-tracking.service';
import { CreateOnboardingClinicDto } from './dto/create-onboarding-clinic.dto';
import { OnboardingPlanDto } from './dto/onboarding-plan.dto';
import { UpdateClinicSizeDto } from './dto/update-clinic-size.dto';

export type OnboardingState = {
  organizationId?: string;
  clinicName?: string;
  clinicSlug?: string;
  clinicSize?: ClinicSize | null;
  onboardingCompleted: boolean;
  onboardingStep: number;
  subscriptionPlan?: SubscriptionPlan;
};

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitationsService: InvitationsService,
    private readonly stripeService: StripeService,
    private readonly usageTrackingService: UsageTrackingService,
  ) {}

  async getState(userId: string): Promise<OnboardingState> {
    const user = await this.requireClinicOwner(userId);
    const organization = await this.prisma.client.organization.findUnique({
      where: { ownerId: user.id },
      select: {
        id: true,
        name: true,
        slug: true,
        clinicSize: true,
        onboardingCompleted: true,
        onboardingStep: true,
        subscriptionPlan: true,
      },
    });

    if (!organization) {
      return {
        onboardingCompleted: false,
        onboardingStep: 1,
      };
    }

    return {
      organizationId: organization.id,
      clinicName: organization.name,
      clinicSlug: organization.slug,
      clinicSize: organization.clinicSize,
      onboardingCompleted: organization.onboardingCompleted,
      onboardingStep: organization.onboardingStep,
      subscriptionPlan: organization.subscriptionPlan,
    };
  }

  async createClinic(
    userId: string,
    dto: CreateOnboardingClinicDto,
  ): Promise<OnboardingState> {
    const user = await this.requireClinicOwner(userId);

    const existingOrg = await this.prisma.client.organization.findUnique({
      where: { ownerId: user.id },
    });
    if (existingOrg) {
      throw new BadRequestException('Clinic already created');
    }

    let clinicSlug = dto.clinicSlug?.trim() || suggestSlug(dto.clinicName);
    if (!clinicSlug) {
      clinicSlug = 'clinic';
    }

    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? clinicSlug : `${clinicSlug}-${suffix}`;
      const taken = await this.prisma.client.organization.findUnique({
        where: { slug: candidate },
      });
      if (!taken) {
        clinicSlug = candidate;
        break;
      }
      suffix += 1;
    }

    const organization = await this.prisma.client.$transaction(async (tx) => {
      const created = await tx.organization.create({
        data: {
          name: dto.clinicName.trim(),
          slug: clinicSlug,
          ownerId: user.id,
          onboardingCompleted: false,
          onboardingStep: 2,
          members: { connect: { id: user.id } },
        },
      });

      await tx.organizationMember.create({
        data: {
          organizationId: created.id,
          userId: user.id,
          role: Role.CLINIC_OWNER,
          status: 'ACTIVE',
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: { organizationId: created.id },
      });

      return created;
    });

    void this.usageTrackingService.increment(
      organization.id,
      UsageMetric.USERS,
    );

    return {
      organizationId: organization.id,
      clinicName: organization.name,
      clinicSlug: organization.slug,
      onboardingCompleted: false,
      onboardingStep: 2,
      subscriptionPlan: organization.subscriptionPlan,
    };
  }

  async updateClinicSize(
    userId: string,
    dto: UpdateClinicSizeDto,
  ): Promise<OnboardingState> {
    const organization = await this.requireOwnedOrg(userId);
    if (organization.onboardingStep < 2) {
      throw new BadRequestException('Complete clinic setup first');
    }

    const updated = await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: {
        clinicSize: dto.clinicSize,
        onboardingStep: Math.max(organization.onboardingStep, 3),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        clinicSize: true,
        onboardingCompleted: true,
        onboardingStep: true,
        subscriptionPlan: true,
      },
    });

    return this.toState(updated);
  }

  async inviteStaff(
    userId: string,
    dto: CreateInvitationDto,
  ): Promise<OnboardingState> {
    const organization = await this.requireOwnedOrg(userId);
    if (organization.onboardingStep < 3) {
      throw new BadRequestException('Complete clinic size step first');
    }

    const orgContext: OrganizationContext = {
      organizationId: organization.id,
      role: Role.CLINIC_OWNER,
      permissions: getPermissionsForRole(Role.CLINIC_OWNER),
    };

    await this.invitationsService.create(dto, orgContext, userId);

    const updated = await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: { onboardingStep: Math.max(organization.onboardingStep, 4) },
      select: {
        id: true,
        name: true,
        slug: true,
        clinicSize: true,
        onboardingCompleted: true,
        onboardingStep: true,
        subscriptionPlan: true,
      },
    });

    return this.toState(updated);
  }

  async skipInvitations(userId: string): Promise<OnboardingState> {
    const organization = await this.requireOwnedOrg(userId);
    if (organization.onboardingStep < 3) {
      throw new BadRequestException('Complete clinic size step first');
    }

    const updated = await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: { onboardingStep: 4 },
      select: {
        id: true,
        name: true,
        slug: true,
        clinicSize: true,
        onboardingCompleted: true,
        onboardingStep: true,
        subscriptionPlan: true,
      },
    });

    return this.toState(updated);
  }

  async selectPlan(
    userId: string,
    dto: OnboardingPlanDto,
  ): Promise<{ state: OnboardingState; checkoutUrl?: string }> {
    const organization = await this.requireOwnedOrg(userId);
    if (organization.onboardingStep < 4) {
      throw new BadRequestException('Complete staff invites step first');
    }

    if (dto.plan === 'free') {
      const updated = await this.prisma.client.organization.update({
        where: { id: organization.id },
        data: {
          subscriptionPlan: SubscriptionPlan.FREE,
          ...planLimitsForDb(SubscriptionPlan.FREE),
          onboardingStep: 5,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          clinicSize: true,
          onboardingCompleted: true,
          onboardingStep: true,
          subscriptionPlan: true,
        },
      });

      return { state: this.toState(updated) };
    }

    const checkout =
      await this.stripeService.createOnboardingSubscriptionCheckout(
        userId,
        dto.plan,
      );

    const current = await this.getState(userId);
    return { state: current, checkoutUrl: checkout.url };
  }

  async complete(userId: string): Promise<OnboardingState> {
    const organization = await this.requireOwnedOrg(userId);
    if (organization.onboardingStep < 5) {
      throw new BadRequestException('Complete all onboarding steps first');
    }

    const updated = await this.prisma.client.organization.update({
      where: { id: organization.id },
      data: { onboardingCompleted: true, onboardingStep: 5 },
      select: {
        id: true,
        name: true,
        slug: true,
        clinicSize: true,
        onboardingCompleted: true,
        onboardingStep: true,
        subscriptionPlan: true,
      },
    });

    return this.toState(updated);
  }

  private async requireClinicOwner(userId: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (user.role !== Role.CLINIC_OWNER) {
      throw new ForbiddenException(
        'Only clinic owners can complete onboarding',
      );
    }
    return user;
  }

  private async requireOwnedOrg(userId: string) {
    await this.requireClinicOwner(userId);
    const organization = await this.prisma.client.organization.findUnique({
      where: { ownerId: userId },
    });
    if (!organization) {
      throw new BadRequestException('Create your clinic first');
    }
    if (organization.onboardingCompleted) {
      throw new BadRequestException('Onboarding already completed');
    }
    return organization;
  }

  private toState(org: {
    id: string;
    name: string;
    slug: string;
    clinicSize: ClinicSize | null;
    onboardingCompleted: boolean;
    onboardingStep: number;
    subscriptionPlan: SubscriptionPlan;
  }): OnboardingState {
    return {
      organizationId: org.id,
      clinicName: org.name,
      clinicSlug: org.slug,
      clinicSize: org.clinicSize,
      onboardingCompleted: org.onboardingCompleted,
      onboardingStep: org.onboardingStep,
      subscriptionPlan: org.subscriptionPlan,
    };
  }
}
