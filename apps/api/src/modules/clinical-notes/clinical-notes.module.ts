import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../database/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AiModule } from '../ai/ai.module';
import { AuditModule } from '../audit/audit.module';

import {
  ClinicalNotesController,
  NoteActionsController,
} from './clinical-notes.controller';
import { ClinicalNotesService } from './clinical-notes.service';

@Module({
  imports: [PrismaModule, JwtModule, AuditModule, AiModule],
  providers: [
    ClinicalNotesService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [ClinicalNotesController, NoteActionsController],
})
export class ClinicalNotesModule {}
