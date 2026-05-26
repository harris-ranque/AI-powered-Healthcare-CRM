import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Notification } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';

export type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  async createNotification(
    data: CreateNotificationInput,
  ): Promise<Notification> {
    const notification = await this.prisma.client.notification.create({
      data,
    });

    this.realtime.systemAlert(data.userId, data.message);

    return notification;
  }

  getUserNotifications(userId: string): Promise<Notification[]> {
    return this.prisma.client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.client.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.client.notification.count({
      where: { userId, read: false },
    });
  }
}
