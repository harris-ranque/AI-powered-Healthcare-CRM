'use client';

import {
  Activity,
  CalendarClock,
  FileUp,
  NotebookPen,
  Sparkles,
  UserPlus,
  UserRound,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { ActivityEvent } from '@/features/activity/types/activity.type';

type Props = {
  events: ActivityEvent[];
  isLoading?: boolean;
  title?: string;
  description?: string;
};

const ACTION_LABELS: Record<string, { label: string; icon: typeof Activity }> = {
  PATIENT_CREATED: { label: 'Patient created', icon: UserRound },
  PATIENT_UPDATED: { label: 'Patient updated', icon: UserRound },
  PATIENT_DELETED: { label: 'Patient deleted', icon: UserRound },
  PATIENT_RESTORED: { label: 'Patient restored', icon: UserRound },
  FILE_UPLOADED: { label: 'File uploaded', icon: FileUp },
  FILE_DELETED: { label: 'File deleted', icon: FileUp },
  NOTE_CREATED: { label: 'Clinical note added', icon: NotebookPen },
  NOTE_UPDATED: { label: 'Clinical note updated', icon: NotebookPen },
  NOTE_DELETED: { label: 'Clinical note deleted', icon: NotebookPen },
  AI_SUMMARIZED: { label: 'AI summary generated', icon: Sparkles },
  APPOINTMENT_CREATED: { label: 'Appointment scheduled', icon: CalendarClock },
  APPOINTMENT_UPDATED: { label: 'Appointment updated', icon: CalendarClock },
  APPOINTMENT_DELETED: { label: 'Appointment cancelled', icon: CalendarClock },
  USER_INVITED: { label: 'User invited', icon: UserPlus },
};

function getActionMeta(action: string) {
  return (
    ACTION_LABELS[action] ?? {
      label: action.replaceAll('_', ' ').toLowerCase(),
      icon: Activity,
    }
  );
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-56" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({
  events,
  isLoading,
  title = 'Recent activity',
  description = 'Latest updates across patients, files, notes, and appointments.',
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ActivityFeedSkeleton />
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity recorded yet.</p>
        ) : (
          <ol>
            {events.map((event, index) => {
              const meta = getActionMeta(event.action);
              const Icon = meta.icon;
              const actor = event.user?.name ?? event.user?.email ?? 'System';
              const isFirst = index === 0;
              const isLast = index === events.length - 1;

              return (
                <li key={event.id} className="flex gap-4">
                  <div className="flex w-8 shrink-0 flex-col items-center self-stretch">
                    <span
                      aria-hidden
                      className={cn('w-px flex-1', isFirst ? 'bg-transparent' : 'bg-border')}
                    />
                    <span className="bg-background flex size-8 shrink-0 items-center justify-center rounded-full border">
                      <Icon className="text-primary size-4" />
                    </span>
                    <span
                      aria-hidden
                      className={cn('w-px flex-1', isLast ? 'bg-transparent' : 'bg-border')}
                    />
                  </div>
                  <div className={cn('flex-1 rounded-lg border p-3', !isLast && 'mb-3')}>
                    <p className="font-medium capitalize">{meta.label}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatRelativeTime(event.createdAt)} · by {actor}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
