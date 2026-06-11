import { forwardRef, Module } from '@nestjs/common';

import { PrismaModule } from '../../database/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BillingModule } from '../billing/billing.module';
import { ProductAnalyticsModule } from '../product-analytics/product-analytics.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../queues/email/email.module';
import { RealtimeModule } from '../realtime/realtime.module';

import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [
    PrismaModule,
    BillingModule,
    ProductAnalyticsModule,
    EmailModule,
    AuditModule,
    RealtimeModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    InvitationsService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [InvitationsController],
  exports: [InvitationsService],
})
export class InvitationsModule {}
