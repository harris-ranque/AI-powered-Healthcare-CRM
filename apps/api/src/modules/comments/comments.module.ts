import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../database/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { AuditModule } from '../audit/audit.module';

import {
  AppointmentCommentsController,
  CommentActionsController,
  PatientCommentsController,
} from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [PrismaModule, JwtModule, AuditModule],
  providers: [
    CommentsService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [
    PatientCommentsController,
    AppointmentCommentsController,
    CommentActionsController,
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
