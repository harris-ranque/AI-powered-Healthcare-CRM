import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminController } from './admin.controller';
import { AdminHealthService } from './admin-health.service';
import { AdminService } from './admin.service';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    BullModule.registerQueue({ name: 'email' }, { name: 'payment' }),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminHealthService,
    AdminAnalyticsService,
    JwtAuthGuard,
  ],
})
export class AdminModule {}
