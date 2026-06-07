import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { Permission } from '../../common/permissions';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CommentsService } from './comments.service';

describe('CommentsService', () => {
  const prisma = {
    client: {
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      },
      appointment: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'appt-1',
          patientId: 'patient-1',
        }),
      },
      comment: {
        create: jest.fn().mockResolvedValue({
          id: 'comment-1',
          patientId: 'patient-1',
          appointmentId: null,
          body: 'Need follow-up in 2 weeks.',
          authorId: 'user-1',
          author: { id: 'user-1', name: 'Dr. Smith', email: 'smith@example.com' },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'comment-1',
            body: 'Need follow-up in 2 weeks.',
            createdAt: new Date('2024-06-01T10:00:00Z'),
            author: { id: 'user-1', name: 'Dr. Smith', email: 'smith@example.com' },
          },
          {
            id: 'comment-2',
            body: 'Scheduled.',
            createdAt: new Date('2024-06-01T11:00:00Z'),
            author: { id: 'user-2', name: 'Nurse Jane', email: 'jane@example.com' },
          },
        ]),
        findFirst: jest.fn().mockResolvedValue({
          id: 'comment-1',
          authorId: 'user-1',
          patientId: 'patient-1',
          appointmentId: null,
        }),
        delete: jest.fn(),
      },
    },
  };

  const auditService = { log: jest.fn() };

  let service: CommentsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();
    service = module.get(CommentsService);
  });

  it('creates a patient comment and audits COMMENT_CREATED', async () => {
    await service.createForPatient(
      'patient-1',
      { body: 'Need follow-up in 2 weeks.' },
      { organizationId: 'org-1', userId: 'user-1', permissions: [] },
    );

    expect(prisma.client.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          patientId: 'patient-1',
          body: 'Need follow-up in 2 weeks.',
          authorId: 'user-1',
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COMMENT_CREATED', resource: 'COMMENT' }),
    );
  });

  it('creates an appointment comment with patientId from appointment', async () => {
    await service.createForAppointment(
      'appt-1',
      { body: 'Scheduled.' },
      { organizationId: 'org-1', userId: 'user-2', permissions: [] },
    );

    expect(prisma.client.comment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          appointmentId: 'appt-1',
          patientId: 'patient-1',
          body: 'Scheduled.',
        }),
      }),
    );
  });

  it('lists patient comments in chronological order', async () => {
    await service.listForPatient('patient-1', 'org-1');

    expect(prisma.client.comment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { patientId: 'patient-1', organizationId: 'org-1' },
        orderBy: { createdAt: 'asc' },
      }),
    );
  });

  it('allows author to delete their own comment', async () => {
    const result = await service.remove('comment-1', {
      organizationId: 'org-1',
      userId: 'user-1',
      permissions: [],
    });

    expect(prisma.client.comment.delete).toHaveBeenCalled();
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'COMMENT_DELETED' }),
    );
    expect(result).toEqual({ id: 'comment-1' });
  });

  it('allows org owner to delete any comment', async () => {
    prisma.client.comment.findFirst.mockResolvedValueOnce({
      id: 'comment-1',
      authorId: 'user-2',
      patientId: 'patient-1',
      appointmentId: null,
    });

    await service.remove('comment-1', {
      organizationId: 'org-1',
      userId: 'user-1',
      permissions: [Permission.ORG_MANAGE],
    });

    expect(prisma.client.comment.delete).toHaveBeenCalled();
  });

  it('forbids delete by non-author without ORG_MANAGE', async () => {
    prisma.client.comment.findFirst.mockResolvedValueOnce({
      id: 'comment-1',
      authorId: 'user-2',
      patientId: 'patient-1',
      appointmentId: null,
    });

    await expect(
      service.remove('comment-1', {
        organizationId: 'org-1',
        userId: 'user-1',
        permissions: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws 404 when patient is not in org', async () => {
    prisma.client.patient.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.createForPatient(
        'missing',
        { body: 'Test' },
        { organizationId: 'org-1', userId: 'user-1', permissions: [] },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
