'use client';

import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useNotificationStore } from '@/features/notifications/store/notification.store';
import type { NotificationType } from '@/features/notifications/types/notification.type';
import { cn } from '@/lib/utils';

const typeStyles: Record<NotificationType, string> = {
  error: 'border-red-200 bg-red-50 text-red-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  info: 'border-zinc-200 bg-white text-zinc-950',
};

const typeIcons: Record<NotificationType, typeof Info> = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

export function NotificationPanel() {
  const notifications = useNotificationStore((state) => state.notifications);
  const dismiss = useNotificationStore((state) => state.dismiss);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      {notifications.map((notification) => {
        const Icon = typeIcons[notification.type];

        return (
          <div
            key={notification.id}
            role="alert"
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border p-4 shadow-lg',
              typeStyles[notification.type],
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
            <p className="flex-1 text-sm leading-5">{notification.message}</p>
            <button
              type="button"
              onClick={() => dismiss(notification.id)}
              className="shrink-0 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
