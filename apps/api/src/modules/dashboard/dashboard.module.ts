import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../database/prisma.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { AuditModule } from '../audit/audit.module';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PrismaModule, JwtModule, AuditModule, AppointmentsModule],
  providers: [
    DashboardService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
