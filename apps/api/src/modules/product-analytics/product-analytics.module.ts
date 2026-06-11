import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';

import { ProductAnalyticsService } from './product-analytics.service';

@Module({
  imports: [PrismaModule],
  providers: [ProductAnalyticsService],
  exports: [ProductAnalyticsService],
})
export class ProductAnalyticsModule {}
