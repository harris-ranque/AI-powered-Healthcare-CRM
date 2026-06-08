import { Test } from '@nestjs/testing';

import { Permission } from '../../common/permissions';
import { PrismaService } from '../../database/prisma.service';
import { SearchService } from './search.service';

describe('SearchService', () => {
  const prisma = {
    client: {
      patient: { findMany: jest.fn().mockResolvedValue([]) },
      appointment: { findMany: jest.fn().mockResolvedValue([]) },
      clinicalNote: { findMany: jest.fn().mockResolvedValue([]) },
      file: { findMany: jest.fn().mockResolvedValue([]) },
    },
  };

  let service: SearchService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(SearchService);
  });

  it('returns empty groups when query is shorter than 2 characters', async () => {
    const result = await service.search('org-1', 'a', [
      Permission.PATIENT_READ,
      Permission.APPOINTMENT_READ,
      Permission.FILE_READ,
    ]);

    expect(result).toEqual({
      patients: [],
      appointments: [],
      notes: [],
      files: [],
    });
    expect(prisma.client.patient.findMany).not.toHaveBeenCalled();
  });

  it('searches patients with org scoping and insensitive contains', async () => {
    await service.search('org-1', 'jane', [Permission.PATIENT_READ]);

    expect(prisma.client.patient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          deletedAt: null,
          OR: expect.arrayContaining([
            { firstName: { contains: 'jane', mode: 'insensitive' } },
          ]),
        }),
        take: 5,
      }),
    );
    expect(prisma.client.appointment.findMany).not.toHaveBeenCalled();
    expect(prisma.client.file.findMany).not.toHaveBeenCalled();
  });

  it('omits patient and note groups without PATIENT_READ', async () => {
    await service.search('org-1', 'test', [Permission.APPOINTMENT_READ]);

    expect(prisma.client.patient.findMany).not.toHaveBeenCalled();
    expect(prisma.client.clinicalNote.findMany).not.toHaveBeenCalled();
    expect(prisma.client.appointment.findMany).toHaveBeenCalled();
  });

  it('omits files without FILE_READ', async () => {
    await service.search('org-1', 'report', [Permission.PATIENT_READ]);

    expect(prisma.client.file.findMany).not.toHaveBeenCalled();
    expect(prisma.client.patient.findMany).toHaveBeenCalled();
    expect(prisma.client.clinicalNote.findMany).toHaveBeenCalled();
  });
});
