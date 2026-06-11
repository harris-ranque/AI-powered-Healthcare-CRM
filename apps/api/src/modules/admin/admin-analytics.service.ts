import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import {
  ALL_PRODUCT_EVENT_NAMES,
  ProductEventName,
  type ProductEventNameKey,
} from '../product-analytics/product-event.constants';

export type ActiveWindowCounts = {
  daily: number;
  weekly: number;
  monthly: number;
};

export type AdminDailyAiUsagePoint = {
  date: string;
  requests: number;
};

export type AdminEventTotal = {
  event: ProductEventNameKey;
  count: number;
};

export type AdminWeeklyRetentionRow = {
  cohortWeek: string;
  size: number;
  retention: number[];
};

export type AdminAnalytics = {
  activeOrganizations: ActiveWindowCounts;
  activeUsers: ActiveWindowCounts;
  dailyAiUsage: AdminDailyAiUsagePoint[];
  eventTotals: AdminEventTotal[];
  weeklyRetention: AdminWeeklyRetentionRow[];
  week1Retention: number | null;
};

const ANALYTICS_DAYS = 30;
const COHORT_WEEKS = 8;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay();
  const daysFromMonday = (weekday + 6) % 7;
  day.setUTCDate(day.getUTCDate() - daysFromMonday);
  return day;
}

function formatUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatUtcWeekKey(date: Date): string {
  return formatUtcDayKey(startOfUtcWeek(date));
}

function buildDayKeys(days: number): string[] {
  const today = startOfUtcDay(new Date());
  const keys: string[] = [];

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - offset);
    keys.push(formatUtcDayKey(day));
  }

  return keys;
}

function bucketByUtcDay(
  records: { createdAt: Date }[],
): Map<string, number> {
  const buckets = new Map<string, number>();

  for (const record of records) {
    const key = formatUtcDayKey(record.createdAt);
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return buckets;
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * MS_PER_DAY);
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(): Promise<AdminAnalytics> {
    const [
      activeOrganizations,
      activeUsers,
      dailyAiUsage,
      eventTotals,
      weeklyRetention,
    ] = await Promise.all([
      this.getActiveOrganizations(),
      this.getActiveUsers(),
      this.getDailyAiUsage(),
      this.getEventTotals(),
      this.getWeeklyRetention(),
    ]);

    const week1Retention = this.computeWeek1Retention(weeklyRetention);

    return {
      activeOrganizations,
      activeUsers,
      dailyAiUsage,
      eventTotals,
      weeklyRetention,
      week1Retention,
    };
  }

  private async getActiveOrganizations(): Promise<ActiveWindowCounts> {
    const [daily, weekly, monthly] = await Promise.all([
      this.countDistinctOrganizations(daysAgo(1)),
      this.countDistinctOrganizations(daysAgo(7)),
      this.countDistinctOrganizations(daysAgo(30)),
    ]);

    return { daily, weekly, monthly };
  }

  private async getActiveUsers(): Promise<ActiveWindowCounts> {
    const [daily, weekly, monthly] = await Promise.all([
      this.countDistinctUsers(daysAgo(1)),
      this.countDistinctUsers(daysAgo(7)),
      this.countDistinctUsers(daysAgo(30)),
    ]);

    return { daily, weekly, monthly };
  }

  private async countDistinctOrganizations(since: Date): Promise<number> {
    const groups = await this.prisma.client.productEvent.groupBy({
      by: ['organizationId'],
      where: { createdAt: { gte: since } },
    });

    return groups.length;
  }

  private async countDistinctUsers(since: Date): Promise<number> {
    const groups = await this.prisma.client.productEvent.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: since },
        userId: { not: null },
      },
    });

    return groups.length;
  }

  private async getDailyAiUsage(): Promise<AdminDailyAiUsagePoint[]> {
    const dayKeys = buildDayKeys(ANALYTICS_DAYS);
    const windowStart = startOfUtcDay(new Date(`${dayKeys[0]}T00:00:00.000Z`));

    const events = await this.prisma.client.productEvent.findMany({
      where: {
        event: ProductEventName.AI_SUMMARY_GENERATED,
        createdAt: { gte: windowStart },
      },
      select: { createdAt: true },
    });

    const buckets = bucketByUtcDay(events);

    return dayKeys.map((date) => ({
      date,
      requests: buckets.get(date) ?? 0,
    }));
  }

  private async getEventTotals(): Promise<AdminEventTotal[]> {
    const since = daysAgo(ANALYTICS_DAYS);

    const groups = await this.prisma.client.productEvent.groupBy({
      by: ['event'],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    });

    const counts = new Map(groups.map((g) => [g.event, g._count._all]));

    return ALL_PRODUCT_EVENT_NAMES.map((event) => ({
      event,
      count: counts.get(event) ?? 0,
    }));
  }

  private async getWeeklyRetention(): Promise<AdminWeeklyRetentionRow[]> {
    const now = new Date();
    const cohortWindowStart = new Date(
      startOfUtcWeek(now).getTime() - (COHORT_WEEKS - 1) * MS_PER_WEEK,
    );

    const organizations = await this.prisma.client.organization.findMany({
      where: { createdAt: { gte: cohortWindowStart } },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    if (organizations.length === 0) {
      return [];
    }

    const cohortMap = new Map<string, string[]>();

    for (const org of organizations) {
      const cohortWeek = formatUtcWeekKey(org.createdAt);
      const existing = cohortMap.get(cohortWeek) ?? [];
      existing.push(org.id);
      cohortMap.set(cohortWeek, existing);
    }

    const cohortWeeks = [...cohortMap.keys()].sort();
    const maxRetentionWeeks = COHORT_WEEKS;

    const events = await this.prisma.client.productEvent.findMany({
      where: {
        organizationId: { in: organizations.map((org) => org.id) },
        createdAt: { gte: cohortWindowStart },
      },
      select: { organizationId: true, createdAt: true },
    });

    const eventsByOrg = new Map<string, Date[]>();
    for (const event of events) {
      const existing = eventsByOrg.get(event.organizationId) ?? [];
      existing.push(event.createdAt);
      eventsByOrg.set(event.organizationId, existing);
    }

    return cohortWeeks.map((cohortWeek) => {
      const orgIds = cohortMap.get(cohortWeek) ?? [];
      const cohortStart = new Date(`${cohortWeek}T00:00:00.000Z`);
      const weeksSinceCohort = Math.floor(
        (startOfUtcWeek(now).getTime() - cohortStart.getTime()) / MS_PER_WEEK,
      );
      const retentionLength = Math.min(maxRetentionWeeks, weeksSinceCohort + 1);

      const retention: number[] = [];

      for (let weekIndex = 0; weekIndex < retentionLength; weekIndex += 1) {
        const weekStart = new Date(
          cohortStart.getTime() + weekIndex * MS_PER_WEEK,
        );
        const weekEnd = new Date(weekStart.getTime() + MS_PER_WEEK);

        let activeCount = 0;
        for (const orgId of orgIds) {
          const orgEvents = eventsByOrg.get(orgId) ?? [];
          const isActive = orgEvents.some(
            (createdAt) => createdAt >= weekStart && createdAt < weekEnd,
          );
          if (isActive) {
            activeCount += 1;
          }
        }

        retention.push(
          orgIds.length > 0
            ? Math.round((activeCount / orgIds.length) * 1000) / 10
            : 0,
        );
      }

      return {
        cohortWeek,
        size: orgIds.length,
        retention,
      };
    });
  }

  private computeWeek1Retention(
    rows: AdminWeeklyRetentionRow[],
  ): number | null {
    const eligible = rows.filter((row) => row.retention.length > 1 && row.size > 0);

    if (eligible.length === 0) {
      return null;
    }

    const total = eligible.reduce((sum, row) => sum + row.retention[1], 0);
    return Math.round((total / eligible.length) * 10) / 10;
  }
}
