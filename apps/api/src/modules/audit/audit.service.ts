import { Injectable } from '@nestjs/common';
import { Prisma, type AuditLog } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

const auditUserInclude = {
  user: { select: { id: true, name: true, email: true } },
} as const;

export type AuditLogWithUser = Prisma.AuditLogGetPayload<{
  include: typeof auditUserInclude;
}>;

export type AuditLogInput = {
  userId?: string;
  organizationId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: AuditLogInput): Promise<AuditLog> {
    return this.prisma.client.auditLog.create({ data: entry });
  }

  list(
    organizationId: string,
    options: { action?: string; take?: number } = {},
  ): Promise<AuditLog[]> {
    const take = options.take ?? 100;

    return this.prisma.client.auditLog.findMany({
      where: {
        organizationId,
        ...(options.action ? { action: options.action } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  listForOrganization(
    organizationId: string,
    options: { take?: number; actions?: string[] } = {},
  ): Promise<AuditLogWithUser[]> {
    const take = options.take ?? 100;

    return this.prisma.client.auditLog.findMany({
      where: {
        organizationId,
        ...(options.actions?.length
          ? { action: { in: options.actions } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: auditUserInclude,
    });
  }

  listForPatient(
    organizationId: string,
    patientId: string,
    options: { take?: number } = {},
  ): Promise<AuditLogWithUser[]> {
    const take = options.take ?? 100;

    return this.prisma.client.auditLog.findMany({
      where: {
        organizationId,
        OR: [
          { resource: 'PATIENT', resourceId: patientId },
          {
            metadata: {
              path: ['patientId'],
              equals: patientId,
            },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take,
      include: auditUserInclude,
    });
  }
}
