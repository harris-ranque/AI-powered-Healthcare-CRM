import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PrismaService } from '../../database/prisma.service';

export type AdminQueueJobCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

export type AdminQueueHealth = {
  name: string;
  counts: AdminQueueJobCounts;
};

export type AdminFailedJob = {
  id: string;
  queue: string;
  name: string;
  failedReason: string | null;
  timestamp: string | null;
};

export type AdminHealthResponse = {
  uptime: number;
  timestamp: string;
  checks: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
  queues: AdminQueueHealth[];
  failedJobs: AdminFailedJob[];
};

@Injectable()
export class AdminHealthService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('payment') private readonly paymentQueue: Queue,
  ) {}

  async getHealth(): Promise<AdminHealthResponse> {
    const queues = [
      { name: 'email', queue: this.emailQueue },
      { name: 'payment', queue: this.paymentQueue },
    ];

    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.client.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    let redis: 'up' | 'down' = 'down';
    const queueHealth: AdminQueueHealth[] = [];
    const failedJobs: AdminFailedJob[] = [];

    for (const { name, queue } of queues) {
      try {
        const counts = await queue.getJobCounts(
          'waiting',
          'active',
          'completed',
          'failed',
          'delayed',
        );

        queueHealth.push({
          name,
          counts: {
            waiting: counts.waiting ?? 0,
            active: counts.active ?? 0,
            completed: counts.completed ?? 0,
            failed: counts.failed ?? 0,
            delayed: counts.delayed ?? 0,
          },
        });

        redis = 'up';

        const failed = await queue.getFailed(0, 19);
        for (const job of failed) {
          failedJobs.push({
            id: job.id ?? 'unknown',
            queue: name,
            name: job.name,
            failedReason: job.failedReason ?? null,
            timestamp: job.finishedOn
              ? new Date(job.finishedOn).toISOString()
              : null,
          });
        }
      } catch {
        queueHealth.push({
          name,
          counts: {
            waiting: 0,
            active: 0,
            completed: 0,
            failed: 0,
            delayed: 0,
          },
        });
      }
    }

    failedJobs.sort((a, b) => {
      const aTime = a.timestamp ? Date.parse(a.timestamp) : 0;
      const bTime = b.timestamp ? Date.parse(b.timestamp) : 0;
      return bTime - aTime;
    });

    return {
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database, redis },
      queues: queueHealth,
      failedJobs: failedJobs.slice(0, 20),
    };
  }
}
