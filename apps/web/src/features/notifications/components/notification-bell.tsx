'use client';

import {
  Bell,
  CalendarClock,
  FileUp,
  UserPlus,
  UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import {
  selectUnreadCount,
  useNotificationFeedStore,
} from '../store/notification-feed.store';
import type { RealtimeNotificationType } from '../types/realtime-notification.type';

const TYPE_META: Record<
  RealtimeNotificationType,
  { icon: typeof Bell; label: string }
> = {
  PATIENT_CREATED: { icon: UserRound, label: 'Patient' },
  APPOINTMENT_CREATED: { icon: CalendarClock, label: 'Appointment' },
  FILE_UPLOADED: { icon: FileUp, label: 'Upload' },
  USER_INVITED: { icon: UserPlus, label: 'Invite' },
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function NotificationBell() {
  const items = useNotificationFeedStore((state) => state.items);
  const markAllRead = useNotificationFeedStore((state) => state.markAllRead);
  const unreadCount = selectUnreadCount(items);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open && unreadCount > 0) {
          markAllRead();
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 ? (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {items.length > 0 ? (
            <span className="text-muted-foreground text-xs font-normal">
              {items.length} recent
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.length === 0 ? (
          <p className="text-muted-foreground px-2 py-6 text-center text-sm">
            No notifications yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {items.map((item) => {
              const meta = TYPE_META[item.type];
              const Icon = meta.icon;

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-3 px-2 py-2.5',
                    !item.read && 'bg-muted/40',
                  )}
                >
                  <span className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {item.message}
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
