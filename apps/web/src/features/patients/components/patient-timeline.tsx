'use client';

import {
  CalendarClock,
  FileUp,
  NotebookPen,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

import type { TimelineEvent, TimelineEventType } from '../types/timeline.type';

type Props = {
  events: TimelineEvent[];
  isLoading?: boolean;
};

const EVENT_META: Record<
  TimelineEventType,
  { icon: typeof UserRound }
> = {
  PATIENT_CREATED: { icon: UserRound },
  NOTE_ADDED: { icon: NotebookPen },
  AI_SUMMARY: { icon: Sparkles },
  FILE_UPLOADED: { icon: FileUp },
  APPOINTMENT: { icon: CalendarClock },
};

function formatDateHeader(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function groupEventsByDay(events: TimelineEvent[]) {
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const dayKey = new Date(event.occurredAt).toDateString();
    const existing = groups.get(dayKey) ?? [];
    existing.push(event);
    groups.set(dayKey, existing);
  }
  return Array.from(groups.entries()).map(([dayKey, dayEvents]) => ({
    dayKey,
    dateLabel: formatDateHeader(dayEvents[0]!.occurredAt),
    events: dayEvents,
  }));
}

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-5 w-32" />
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="h-20 flex-1 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function PatientTimeline({ events, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Timeline</h3>
          <p className="text-muted-foreground text-sm">
            Notes, files, appointments, and AI summaries in chronological order.
          </p>
        </div>
        <TimelineSkeleton />
      </div>
    );
  }

  const grouped = groupEventsByDay(events);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Timeline</h3>
        <p className="text-muted-foreground text-sm">
          Notes, files, appointments, and AI summaries in chronological order.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No timeline events yet.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <section key={group.dayKey} className="space-y-3">
              <h4 className="text-muted-foreground text-sm font-medium">
                {group.dateLabel}
              </h4>
              <ol>
                {group.events.map((event, index) => {
                  const Icon = EVENT_META[event.type].icon;
                  const isFirst = index === 0;
                  const isLast = index === group.events.length - 1;
                  return (
                    <li key={event.id} className="flex gap-4">
                      <div className="flex w-8 shrink-0 flex-col items-center self-stretch">
                        <span
                          aria-hidden
                          className={cn(
                            'w-px flex-1',
                            isFirst ? 'bg-transparent' : 'bg-border',
                          )}
                        />
                        <span className="bg-background flex size-8 shrink-0 items-center justify-center rounded-full border">
                          <Icon className="text-primary size-4" />
                        </span>
                        <span
                          aria-hidden
                          className={cn(
                            'w-px flex-1',
                            isLast ? 'bg-transparent' : 'bg-border',
                          )}
                        />
                      </div>
                      <div
                        className={cn(
                          'flex-1 rounded-lg border p-3',
                          !isLast && 'mb-3',
                        )}
                      >
                        <p className="font-medium">{event.title}</p>
                        {event.description ? (
                          <p className="text-muted-foreground mt-1 text-sm">
                            {event.description}
                          </p>
                        ) : null}
                        <p className="text-muted-foreground mt-1 text-xs">
                          {formatTime(event.occurredAt)}
                          {event.actor ? ` · ${event.actor}` : ''}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
