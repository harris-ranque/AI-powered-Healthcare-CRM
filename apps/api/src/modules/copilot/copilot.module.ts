import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { OrganizationContextGuard } from '../../common/guards/organization-context.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PrismaModule } from '../../database/prisma.module';
import { AiModule } from '../ai/ai.module';

import { CopilotContextService } from './copilot-context.service';
import { CopilotController } from './copilot.controller';
import { CopilotService } from './copilot.service';

@Module({
  imports: [PrismaModule, AiModule, JwtModule],
  controllers: [CopilotController],
  providers: [
    CopilotService,
    CopilotContextService,
    JwtAuthGuard,
    OrganizationContextGuard,
    PermissionsGuard,
  ],
})
export class CopilotModule {}
