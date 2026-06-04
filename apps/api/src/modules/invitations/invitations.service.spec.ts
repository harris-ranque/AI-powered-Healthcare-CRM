import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  InvitationStatus,
  Role,
} from '@prisma/client';

import { Permission } from '../../common/permissions';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../queues/email/email.service';
import { InvitationsService } from './invitations.service';

describe('InvitationsService', () => {
  let service: InvitationsService;
  const prisma = {
    client: {
      user: { findUnique: jest.fn() },
      organizationMember: { findFirst: jest.fn() },
      organization: { findUnique: jest.fn() },
      invitation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    },
  };
  const emailService = { sendInvitationEmail: jest.fn() };

  const orgContext = {
    organizationId: 'org-1',
    permissions: [Permission.CLIENT_INVITE],
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        InvitationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get(InvitationsService);
  });

  it('rejects staff invite without STAFF_INVITE permission', async () => {
    await expect(
      service.create(
        { email: 'staff@test.com', role: Role.DOCTOR },
        orgContext,
        'user-1',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates client invite when CLIENT_INVITE is granted', async () => {
    prisma.client.user.findUnique.mockResolvedValue(null);
    prisma.client.invitation.findFirst.mockResolvedValue(null);
    prisma.client.organization.findUnique.mockResolvedValue({
      name: 'Sunrise',
      slug: 'sunrise',
    });
    prisma.client.invitation.create.mockResolvedValue({
      id: 'inv-1',
      email: 'client@test.com',
      role: Role.PATIENT,
      status: InvitationStatus.PENDING,
      expiresAt: new Date('2030-01-01'),
      createdAt: new Date(),
      invitedBy: { name: 'Owner' },
    });

    const result = await service.create(
      { email: 'client@test.com', role: Role.PATIENT },
      orgContext,
      'user-1',
    );

    expect(result.email).toBe('client@test.com');
    expect(emailService.sendInvitationEmail).toHaveBeenCalled();
  });

  it('creates staff invite when STAFF_INVITE is granted', async () => {
    const staffOrgContext = {
      organizationId: 'org-1',
      permissions: [Permission.STAFF_INVITE],
    };
    prisma.client.user.findUnique.mockResolvedValue(null);
    prisma.client.invitation.findFirst.mockResolvedValue(null);
    prisma.client.organization.findUnique.mockResolvedValue({
      name: 'Sunrise',
      slug: 'sunrise',
    });
    prisma.client.invitation.create.mockResolvedValue({
      id: 'inv-2',
      email: 'staff@test.com',
      role: Role.DOCTOR,
      status: InvitationStatus.PENDING,
      expiresAt: new Date('2030-01-01'),
      createdAt: new Date(),
      invitedBy: { name: 'Owner' },
    });

    const result = await service.create(
      { email: 'staff@test.com', role: Role.DOCTOR },
      staffOrgContext,
      'user-1',
    );

    expect(result.role).toBe(Role.DOCTOR);
  });

  it('filters list by inviteeType staff', async () => {
    prisma.client.invitation.findMany.mockResolvedValue([]);

    await service.listForOrganization('org-1', InvitationStatus.PENDING, undefined, 'staff');

    expect(prisma.client.invitation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: { in: [Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST] },
        }),
      }),
    );
  });

  it('rejects lookup for accepted invitation', async () => {
    prisma.client.invitation.findUnique.mockResolvedValue({
      id: 'inv-1',
      email: 'client@test.com',
      role: Role.PATIENT,
      status: InvitationStatus.ACCEPTED,
      expiresAt: new Date('2030-01-01'),
      organization: { name: 'Sunrise', slug: 'sunrise' },
    });

    await expect(service.getByToken('token-abc')).rejects.toThrow(
      'Invitation was already used',
    );
  });
});
