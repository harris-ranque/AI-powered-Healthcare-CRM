import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://signed.example.com/file'),
}));

jest.mock('./r2.client', () => ({
  r2Client: { send: jest.fn().mockResolvedValue({}) },
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

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();
    service = module.get(StorageService);
  });

  it('lists files for a patient', async () => {
    await service.listForPatient('patient-1', 'org-1');
    expect(prisma.findFilesByPatient).toHaveBeenCalledWith('org-1', 'patient-1');
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
      url: 'https://signed.example.com/file',
      expiresIn: 300,
    });
  });
});
