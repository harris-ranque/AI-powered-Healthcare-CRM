import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../database/prisma.service';
import { UsageMetric } from './usage-metric.constants';
import { UsageTrackingService } from './usage-tracking.service';

describe('UsageTrackingService', () => {
  let service: UsageTrackingService;

  const prisma = {
    client: {
      usageMetric: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
        findMany: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.client.usageMetric.updateMany.mockResolvedValue({ count: 0 });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackingService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(UsageTrackingService);
  });

  it('tracks increments with the current UTC month periodStart', async () => {
    const periodStart = service.currentPeriodStart();

    await service.track('org-1', UsageMetric.PATIENTS, 1);

    expect(prisma.client.usageMetric.upsert).toHaveBeenCalledWith({
      where: {
        organizationId_metric_periodStart: {
          organizationId: 'org-1',
          metric: UsageMetric.PATIENTS,
          periodStart,
        },
      },
      create: {
        organizationId: 'org-1',
        metric: UsageMetric.PATIENTS,
        periodStart,
        value: 1,
      },
      update: {
        value: { increment: 1 },
      },
    });
  });

  it('decrements with a negative delta and floors negative values', async () => {
    await service.decrement('org-1', UsageMetric.USERS, 2);

    expect(prisma.client.usageMetric.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { value: { increment: -2 } },
      }),
    );
    expect(prisma.client.usageMetric.updateMany).toHaveBeenCalledTimes(1);
  });

  it('returns current usage with zero defaults for missing metrics', async () => {
    prisma.client.usageMetric.findMany.mockResolvedValue([
      { metric: UsageMetric.PATIENTS, value: 3 },
      { metric: UsageMetric.AI_REQUESTS, value: 7 },
    ]);

    const usage = await service.getCurrentUsage('org-1');

    expect(usage).toEqual({
      patients: 3,
      users: 0,
      ai_requests: 7,
      storage_bytes: 0,
      appointments: 0,
    });
  });
});
