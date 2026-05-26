import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';

@Module({
  imports: [PrismaModule, RealtimeModule, AuthModule],
  providers: [NotificationsService, JwtAuthGuard],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
