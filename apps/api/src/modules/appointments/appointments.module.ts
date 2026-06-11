import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ProductAnalyticsModule } from '../product-analytics/product-analytics.module';
import { UsageTrackingModule } from '../usage-tracking/usage-tracking.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

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
    AppointmentsService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [AppointmentsController],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
