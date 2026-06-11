import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type { ProductEventNameKey } from './product-event.constants';

export type TrackProductEventInput = {
  organizationId: string;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class ProductAnalyticsService {
  private readonly logger = new Logger(ProductAnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async trackEvent(
    event: ProductEventNameKey,
    input: TrackProductEventInput,
  ): Promise<void> {
    try {
      await this.prisma.client.productEvent.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          event,
          metadata: input.metadata,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to track product event ${event} for org ${input.organizationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
