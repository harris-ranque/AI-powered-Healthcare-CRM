import { Controller, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import type { Notification, Prisma } from '@prisma/client';

import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import type { AuthenticatedRequest } from '../../common/types/authenticated-request.type';

import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // =====================================
  // GET NOTIFICATIONS
  // =====================================
  @UseGuards(JwtAuthGuard)
  @Get()
  getNotifications(@Req() req: AuthenticatedRequest): Promise<Notification[]> {
    return this.notificationsService.getUserNotifications(req.user.sub);
  }

  // =====================================
  // MARK AS READ
  // =====================================
  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markAsRead(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<Prisma.BatchPayload> {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  // =====================================
  // UNREAD COUNT
  // =====================================
  @UseGuards(JwtAuthGuard)
  @Get('unread/count')
  unreadCount(@Req() req: AuthenticatedRequest): Promise<number> {
    return this.notificationsService.unreadCount(req.user.sub);
  }
}
