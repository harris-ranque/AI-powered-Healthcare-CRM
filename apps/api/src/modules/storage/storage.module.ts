import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../database/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditModule } from '../audit/audit.module';
import { ProductAnalyticsModule } from '../product-analytics/product-analytics.module';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [
    PrismaModule,
    JwtModule,
    AuditModule,
    UsageTrackingModule,
    ProductAnalyticsModule,
    RealtimeModule,
  ],
  providers: [
    StorageService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [StorageController],
  exports: [StorageService],
})
export class StorageModule {}
