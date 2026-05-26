import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import configuration from './config/configuration';
import { PrismaModule } from './database/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { HealthModule } from './modules/health/health.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters/all-exceptions/all-exceptions.filter';
import { BullModule } from '@nestjs/bullmq';
import { EmailModule } from './modules/queues/email/email.module';
import { PaymentModule } from './modules/queues/payment/payment.module';
import { StorageModule } from './modules/storage/storage.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { LoggerModule } from './common/logger/logger.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { TenantMiddleware } from './common/middleware/tenant/tenant.middleware';
import { BillingModule } from './modules/billing/billing.module';
import { QueuesModule } from './modules/queues/queues.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrganizationsModule,
    HealthModule,
    StripeModule,
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 5,
      },
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
    }),
    EmailModule,
    PaymentModule,
    StorageModule,
    RealtimeModule,
    NotificationsModule,
    AuditModule,
    LoggerModule,
    MetricsModule,
    BillingModule,
    QueuesModule,
  ],
  // controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
