import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, SubscriptionPlan } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { InvitationsService } from '../invitations/invitations.service';
import { StripeService } from '../stripe/stripe.service';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  const prisma = {
    client: {
      user: { findUnique: jest.fn() },
      organization: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      organizationMember: { create: jest.fn() },
      $transaction: jest.fn(),
    },
  };

  const invitationsService = {
    create: jest.fn(),
  };

  const stripeService = {
    createOnboardingSubscriptionCheckout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvitationsService, useValue: invitationsService },
        { provide: StripeService, useValue: stripeService },
      ],
    }).compile();

    service = module.get(OnboardingService);
  });

  it('returns step 1 state when owner has no organization', async () => {
    prisma.client.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: Role.CLINIC_OWNER,
    });
    prisma.client.organization.findUnique.mockResolvedValue(null);

    const state = await service.getState('user-1');

    expect(state.onboardingStep).toBe(1);
    expect(state.onboardingCompleted).toBe(false);
  });

  it('creates clinic and advances to step 2', async () => {
    prisma.client.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: Role.CLINIC_OWNER,
    });
    prisma.client.organization.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    prisma.client.$transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          organization: {
            create: jest.fn().mockResolvedValue({
              id: 'org-1',
              name: 'Sunrise Medical',
              slug: 'sunrise-medical',
              subscriptionPlan: SubscriptionPlan.FREE,
            }),
          },
          organizationMember: { create: jest.fn() },
          user: { update: jest.fn() },
        };
        return fn(tx);
      },
    );

    const state = await service.createClinic('user-1', {
      clinicName: 'Sunrise Medical',
    });

    expect(state.onboardingStep).toBe(2);
    expect(state.clinicName).toBe('Sunrise Medical');
  });

  it('rejects non-owners', async () => {
    prisma.client.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: Role.DOCTOR,
    });

    await expect(service.getState('user-1')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('selects free plan and advances to step 5', async () => {
    prisma.client.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: Role.CLINIC_OWNER,
    });
    prisma.client.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      ownerId: 'user-1',
      onboardingStep: 4,
      onboardingCompleted: false,
    });
    prisma.client.organization.update.mockResolvedValue({
      id: 'org-1',
      name: 'Clinic',
      slug: 'clinic',
      clinicSize: 'SIZE_1_5',
      onboardingCompleted: false,
      onboardingStep: 5,
      subscriptionPlan: SubscriptionPlan.FREE,
    });

    const result = await service.selectPlan('user-1', { plan: 'free' });

    expect(result.state.onboardingStep).toBe(5);
    expect(result.checkoutUrl).toBeUndefined();
  });

  it('blocks complete before step 5', async () => {
    prisma.client.user.findUnique.mockResolvedValue({
      id: 'user-1',
      role: Role.CLINIC_OWNER,
    });
    prisma.client.organization.findUnique.mockResolvedValue({
      id: 'org-1',
      ownerId: 'user-1',
      onboardingStep: 3,
      onboardingCompleted: false,
    });

    await expect(service.complete('user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
