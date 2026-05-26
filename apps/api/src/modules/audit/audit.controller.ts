import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type { AuditLog } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';

@Controller('audit')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getAuditLogs(@Query('action') action?: string): Promise<AuditLog[]> {
    return this.prisma.client.auditLog.findMany({
      where: action ? { action } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
