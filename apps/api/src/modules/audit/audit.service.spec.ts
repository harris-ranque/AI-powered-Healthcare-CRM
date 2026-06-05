import { Test } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  const prisma = {
    client: {
      auditLog: {
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
    },
  };

  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(AuditService);
  });

  it('listForPatient filters by patient resource and metadata', async () => {
    await service.listForPatient('org-1', 'patient-1');

    expect(prisma.client.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: 'org-1',
          OR: [
            { resource: 'PATIENT', resourceId: 'patient-1' },
            {
              metadata: {
                path: ['patientId'],
                equals: 'patient-1',
              },
            },
          ],
        },
      }),
    );
  });
});
