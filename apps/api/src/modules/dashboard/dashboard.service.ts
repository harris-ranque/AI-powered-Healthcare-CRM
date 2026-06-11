import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AuditService, type AuditLogWithUser } from '../audit/audit.service';
import { AppointmentsService } from '../appointments/appointments.service';

export type DashboardStats = {
  patients: number;
  files: number;
  aiSummaries: number;
  appointmentsToday: number;
  aiTokensThisMonth: number;
  aiCostThisMonth: number;
  aiRequestsThisMonth: number;
};

export type PatientGrowthPoint = {
  date: string;
  newPatients: number;
  cumulative: number;
};

export type AiUsagePoint = {
  date: string;
  requests: number;
};

export type DashboardAnalytics = {
  patientGrowth: PatientGrowthPoint[];
  aiUsage: AiUsagePoint[];
};

const DEFAULT_ANALYTICS_DAYS = 30;

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function formatUtcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
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

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async getStats(organizationId: string): Promise<DashboardStats> {
    const monthStart = startOfUtcMonth(new Date());

    const [patients, files, aiSummaries, appointmentsToday, aiUsageThisMonth] =
      await Promise.all([
        this.prisma.client.patient.count({
          where: { organizationId, deletedAt: null },
        }),
        this.prisma.client.file.count({
          where: { organizationId },
        }),
        this.prisma.client.aiRequestLog.count({
          where: { organizationId },
        }),
        this.appointmentsService.countToday(organizationId),
        this.prisma.client.aiRequestLog.aggregate({
          where: {
            organizationId,
            createdAt: { gte: monthStart },
          },
          _sum: { tokens: true, cost: true },
          _count: true,
        }),
      ]);

    return {
      patients,
      files,
      aiSummaries,
      appointmentsToday,
      aiTokensThisMonth: aiUsageThisMonth._sum.tokens ?? 0,
      aiCostThisMonth: aiUsageThisMonth._sum.cost ?? 0,
      aiRequestsThisMonth: aiUsageThisMonth._count,
    };
  }

  getRecentActivity(
    organizationId: string,
    take = 10,
  ): Promise<AuditLogWithUser[]> {
    return this.auditService.listForOrganization(organizationId, { take });
  }

  async getAnalytics(
    organizationId: string,
    days = DEFAULT_ANALYTICS_DAYS,
  ): Promise<DashboardAnalytics> {
    const normalizedDays = Number.isFinite(days) && days > 0 ? days : DEFAULT_ANALYTICS_DAYS;
    const dayKeys = buildDayKeys(normalizedDays);
    const windowStart = startOfUtcDay(new Date(`${dayKeys[0]}T00:00:00.000Z`));

    const [baseline, patients, aiLogs] = await Promise.all([
      this.prisma.client.patient.count({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { lt: windowStart },
        },
      }),
      this.prisma.client.patient.findMany({
        where: {
          organizationId,
          deletedAt: null,
          createdAt: { gte: windowStart },
        },
        select: { createdAt: true },
      }),
      this.prisma.client.aiRequestLog.findMany({
        where: {
          organizationId,
          createdAt: { gte: windowStart },
        },
        select: { createdAt: true },
      }),
    ]);

    const patientBuckets = bucketByUtcDay(patients);
    const aiBuckets = bucketByUtcDay(aiLogs);

    let cumulative = baseline;
    const patientGrowth = dayKeys.map((date) => {
      const newPatients = patientBuckets.get(date) ?? 0;
      cumulative += newPatients;
      return { date, newPatients, cumulative };
    });

    const aiUsage = dayKeys.map((date) => ({
      date,
      requests: aiBuckets.get(date) ?? 0,
    }));

    return { patientGrowth, aiUsage };
  }
}
