import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../database/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { BillingModule } from '../billing/billing.module';
import { AiModule } from '../ai/ai.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuditModule } from '../audit/audit.module';
import { ClinicalNotesModule } from '../clinical-notes/clinical-notes.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { StorageModule } from '../storage/storage.module';

import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    PrismaModule,
    BillingModule,
    JwtModule,
    AuditModule,
    AppointmentsModule,
    ClinicalNotesModule,
    StorageModule,
    AiModule,
    RealtimeModule,
  ],
  providers: [
    PatientsService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [PatientsController],
  exports: [PatientsService],
})
export class PatientsModule {}
