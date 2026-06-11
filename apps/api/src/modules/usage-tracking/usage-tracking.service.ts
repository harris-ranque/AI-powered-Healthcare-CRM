import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  ALL_USAGE_METRICS,
  type CurrentUsageSnapshot,
  type UsageMetricKey,
} from './usage-metric.constants';

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(private readonly prisma: PrismaService) {}

  currentPeriodStart(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  async track(
    organizationId: string,
    metric: UsageMetricKey,
    delta = 1,
  ): Promise<void> {
    if (delta === 0) {
      return;
    }

    try {
      const periodStart = this.currentPeriodStart();

      await this.prisma.client.usageMetric.upsert({
        where: {
          organizationId_metric_periodStart: {
            organizationId,
            metric,
            periodStart,
          },
        },
        create: {
          organizationId,
          metric,
          periodStart,
          value: Math.max(0, delta),
        },
        update: {
          value: { increment: delta },
        },
      });

      if (delta < 0) {
        await this.prisma.client.usageMetric.updateMany({
          where: {
            organizationId,
            metric,
            periodStart,
            value: { lt: 0 },
          },
          data: { value: 0 },
        });
      }
    } catch (error) {
      this.logger.warn(
        `Failed to track usage metric ${metric} for org ${organizationId}: ${String(error)}`,
      );
    }
  }

  increment(organizationId: string, metric: UsageMetricKey): Promise<void> {
    return this.track(organizationId, metric, 1);
  }

  decrement(
    organizationId: string,
    metric: UsageMetricKey,
    amount = 1,
  ): Promise<void> {
    return this.track(organizationId, metric, -amount);
  }

  async getCurrentUsage(organizationId: string): Promise<CurrentUsageSnapshot> {
    const periodStart = this.currentPeriodStart();
    const rows = await this.prisma.client.usageMetric.findMany({
      where: { organizationId, periodStart },
      select: { metric: true, value: true },
    });

    const snapshot = Object.fromEntries(
      ALL_USAGE_METRICS.map((metric) => [metric, 0]),
    ) as CurrentUsageSnapshot;

    for (const row of rows) {
      if (row.metric in snapshot) {
        snapshot[row.metric as UsageMetricKey] = row.value;
      }
    }

    return snapshot;
  }
}
