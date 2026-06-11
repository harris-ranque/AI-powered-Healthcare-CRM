import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../database/prisma.module';
import { BillingModule } from '../billing/billing.module';
import { AuditModule } from '../audit/audit.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

import { openAiClientProvider } from './ai.client';
import { AiController } from './ai.controller';
import { PatientAiController } from './patient-ai.controller';
import { AiService } from './ai.service';

@Module({
  imports: [PrismaModule, BillingModule, JwtModule, AuditModule],
  providers: [
    AiService,
    openAiClientProvider,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [AiController, PatientAiController],
  exports: [AiService],
})
export class AiModule {}
