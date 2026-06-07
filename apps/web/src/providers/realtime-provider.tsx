'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks/use-auth';
import { useNotificationFeedStore } from '@/features/notifications/store/notification-feed.store';
import type { RealtimeNotificationPayload } from '@/features/notifications/types/realtime-notification.type';
import { socket } from '@/lib/socket';

type Props = {
  children: React.ReactNode;
};

export function RealtimeProvider({ children }: Props) {
  const user = useAuth().user;
  const addNotification = useNotificationFeedStore((state) => state.add);
  const clearNotifications = useNotificationFeedStore((state) => state.clear);

  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!user?.organizationId) {
      return;
    }

    const organizationId = user.organizationId;

    const handleConnect = () => {
      socket.emit('joinOrg', organizationId);
    };

    const handleNotification = (payload: RealtimeNotificationPayload) => {
      if (payload.actorId === user.id) {
        return;
      }

      addNotification(payload);
      toast(payload.title, { description: payload.message });
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on('connect', handleConnect);
    socket.on('notification', handleNotification);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('notification', handleNotification);
    };
  }, [user?.id, user?.organizationId, addNotification]);

  useEffect(() => {
    if (!user) {
      clearNotifications();
    }
  }, [user, clearNotifications]);

  return children;
}
