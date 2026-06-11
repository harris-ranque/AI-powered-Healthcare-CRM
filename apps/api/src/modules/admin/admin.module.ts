import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { AuthModule } from '../auth/auth.module';

import { AdminController } from './admin.controller';
import { AdminHealthService } from './admin-health.service';
import { AdminService } from './admin.service';

@Module({
  imports: [
    AuthModule,
    BullModule.registerQueue({ name: 'email' }, { name: 'payment' }),
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminHealthService, JwtAuthGuard],
})
export class AdminModule {}
