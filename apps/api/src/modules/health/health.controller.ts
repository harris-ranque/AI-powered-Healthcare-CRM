import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

type HealthStatus = 'ok' | 'degraded';

export type HealthResponse = {
  status: HealthStatus;
  uptime: number;
  timestamp: string;
  checks: {
    database: 'up' | 'down';
  };
};

// Version-neutral so monitors / k8s probes hit a stable URL (`/api/health`).
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<HealthResponse> {
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database },
    };
  }
}
