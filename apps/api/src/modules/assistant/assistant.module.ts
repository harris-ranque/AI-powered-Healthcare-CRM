import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/role.guard';
import { PrismaModule } from '../../database/prisma.module';
import { AiModule } from '../ai/ai.module';
import { AppointmentsModule } from '../appointments/appointments.module';

import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [PrismaModule, JwtModule, AiModule, AppointmentsModule],
  providers: [AssistantService, JwtAuthGuard, RolesGuard],
  controllers: [AssistantController],
})
export class AssistantModule {}
