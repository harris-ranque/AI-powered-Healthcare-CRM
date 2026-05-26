import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { stripeClientProvider } from './stripe.client';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { AuditModule } from '../audit/audit.module';
import { AuditService } from '../audit/audit.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [AuthModule, RealtimeModule, AuditModule, NotificationsModule],
  providers: [
    StripeService,
    JwtAuthGuard,
    stripeClientProvider,
    AuditService,
    NotificationsService,
  ],
  controllers: [StripeController],
})
export class StripeModule {}
