import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RealtimeService } from '../realtime/realtime.service';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed.example.com/upload'),
}));

const r2Send = jest.fn();

jest.mock('./r2.client', () => ({
  r2Client: { send: (...args: unknown[]) => r2Send(...args) },
}));

describe('StorageService', () => {
  const prisma = {
    client: {
      patient: {
        findFirst: jest.fn().mockResolvedValue({ id: 'patient-1' }),
      },
    },
    createFile: jest.fn().mockResolvedValue({
      id: 'file-1',
      originalName: 'report.pdf',
      mimeType: 'application/pdf',
      patientId: 'patient-1',
      storageKey: 'org-1/uuid.pdf',
    }),
    findFilesByPatient: jest.fn().mockResolvedValue([]),
    findFileById: jest.fn(),
    deleteFile: jest.fn().mockResolvedValue({ id: 'file-1' }),
  };

  const auditService = { log: jest.fn() };

  let service: StorageService;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.R2_BUCKET_NAME = 'bucket';
    process.env.R2_PUBLIC_URL = 'https://cdn.example.com';
    r2Send.mockResolvedValue({ ContentLength: 1024 });

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        {
          provide: RealtimeService,
          useValue: { emitNotification: jest.fn() },
        },
      ],
    }).compile();
    service = module.get(StorageService);
  });

  it('lists files for a patient', async () => {
    await service.listForPatient('patient-1', 'org-1');
    expect(prisma.findFilesByPatient).toHaveBeenCalledWith('org-1', 'patient-1');
  });

  it('issues upload URL without persisting metadata', async () => {
    const result = await service.createUploadUrl(
      {
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        patientId: 'patient-1',
      },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(result.uploadUrl).toBe('https://signed.example.com/upload');
    expect(result.storageKey).toMatch(/^org-1\//);
    expect(prisma.createFile).not.toHaveBeenCalled();
    expect(auditService.log).not.toHaveBeenCalled();
  });

  it('confirms upload after HeadObject and persists metadata', async () => {
    const file = await service.confirmUpload(
      {
        fileName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageKey: 'org-1/uuid.pdf',
        patientId: 'patient-1',
      },
      { organizationId: 'org-1', userId: 'user-1' },
    );

    expect(r2Send).toHaveBeenCalled();
    expect(prisma.createFile).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        uploadedById: 'user-1',
        patientId: 'patient-1',
        originalName: 'report.pdf',
        mimeType: 'application/pdf',
        size: 1024,
        storageKey: 'org-1/uuid.pdf',
        publicUrl: 'https://cdn.example.com/org-1/uuid.pdf',
      }),
    );
    expect(auditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'FILE_UPLOADED',
        resourceId: file.id,
      }),
    );
  });

  it('rejects confirm when storage key is outside organization', async () => {
    await expect(
      service.confirmUpload(
        {
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          storageKey: 'other-org/uuid.pdf',
        },
        { organizationId: 'org-1', userId: 'user-1' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects confirm when object is missing in storage', async () => {
    r2Send.mockRejectedValueOnce(new Error('NotFound'));

    await expect(
      service.confirmUpload(
        {
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          storageKey: 'org-1/missing.pdf',
        },
        { organizationId: 'org-1', userId: 'user-1' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws conflict when storage key is already registered', async () => {
    prisma.createFile.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.confirmUpload(
        {
          fileName: 'report.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          storageKey: 'org-1/uuid.pdf',
        },
        { organizationId: 'org-1', userId: 'user-1' },
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('throws when deleting a missing file', async () => {
    prisma.findFileById.mockResolvedValue(null);
    await expect(
      service.deleteFile('missing', { organizationId: 'org-1', userId: 'user-1' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns a presigned download URL for an owned file', async () => {
    prisma.findFileById.mockResolvedValue({
      id: 'file-1',
      storageKey: 'org-1/key.pdf',
      originalName: 'report.pdf',
      mimeType: 'application/pdf',
    });

    const result = await service.getDownloadUrl('file-1', 'org-1');

    expect(prisma.findFileById).toHaveBeenCalledWith('file-1', 'org-1');
    expect(result).toEqual({
      url: 'https://signed.example.com/upload',
      expiresIn: 300,
    });
  });
});
