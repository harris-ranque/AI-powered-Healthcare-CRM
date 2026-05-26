import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AuditLog } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

export type AuditLogInput = {
  userId?: string;
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
}
