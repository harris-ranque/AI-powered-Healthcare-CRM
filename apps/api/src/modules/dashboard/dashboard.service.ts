import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { AuditService, type AuditLogWithUser } from '../audit/audit.service';
import { AppointmentsService } from '../appointments/appointments.service';

export type DashboardStats = {
  patients: number;
  files: number;
  aiSummaries: number;
  appointmentsToday: number;
};

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async getStats(organizationId: string): Promise<DashboardStats> {
    const [patients, files, aiSummaries, appointmentsToday] =
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
      ]);

    return { patients, files, aiSummaries, appointmentsToday };
  }

  getRecentActivity(
    organizationId: string,
    take = 10,
  ): Promise<AuditLogWithUser[]> {
    return this.auditService.listForOrganization(organizationId, { take });
  }
}
