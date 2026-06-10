import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import configuration from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { PatientsModule } from './modules/patients/patients.module';
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
import { BillingModule } from './modules/billing/billing.module';
import { QueuesModule } from './modules/queues/queues.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { AiModule } from './modules/ai/ai.module';
import { ClinicalNotesModule } from './modules/clinical-notes/clinical-notes.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SearchModule } from './modules/search/search.module';
import { AssistantModule } from './modules/assistant/assistant.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
      // Load from cwd (apps/api when running pnpm start:dev) first, then fall
      // back to paths relative to the compiled output so it works from root too.
      envFilePath: [
        '.env',
        resolve(process.cwd(), 'apps/api/.env'),
        resolve(__dirname, '..', '.env'),
        resolve(__dirname, '..', '..', '.env'),
      ],
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    OrganizationsModule,
    InvitationsModule,
    PatientsModule,
    AiModule,
    ClinicalNotesModule,
    AppointmentsModule,
    DashboardModule,
    CommentsModule,
    SearchModule,
    AssistantModule,
    OnboardingModule,
    HealthModule,
    StripeModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
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
export class AppModule {}
