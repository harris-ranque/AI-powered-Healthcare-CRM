'use client';

import { NotificationPanel } from '@/components/notifications/notification-panel';

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <NotificationPanel />
    </>
  );
}
