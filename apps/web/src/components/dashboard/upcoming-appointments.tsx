'use client';

import { CalendarClock } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Appointment } from '@/features/appointments/types/appointment.type';

type Props = {
  appointments: Appointment[];
  isLoading?: boolean;
};

const STATUS_VARIANTS: Record<
  Appointment['status'],
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  SCHEDULED: 'secondary',
  CONFIRMED: 'default',
  COMPLETED: 'outline',
  CANCELLED: 'destructive',
  NO_SHOW: 'destructive',
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) {
    const diffMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
    return diffMinutes <= 1 ? 'Starting soon' : `In ${diffMinutes} min`;
  }

  if (diffHours < 24) {
    return `In ${diffHours}h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function UpcomingAppointments({ appointments, isLoading }: Props) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Upcoming appointments</CardTitle>
        <p className="text-muted-foreground text-sm">
          Next scheduled visits in the coming two weeks
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
            <CalendarClock className="size-8 opacity-40" />
            <p>No upcoming appointments scheduled.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {appointments.map((appointment) => {
              const patientName = appointment.patient
                ? `${appointment.patient.firstName} ${appointment.patient.lastName}`
                : 'Patient';

              return (
                <li key={appointment.id}>
                  <Link
                    href={`/dashboard/calendar?appointmentId=${appointment.id}`}
                    className="hover:bg-muted/60 flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {appointment.title ?? 'Appointment'} · {patientName}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {formatDateTime(appointment.startsAt)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {formatRelativeTime(appointment.startsAt)}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANTS[appointment.status]}>
                      {appointment.status.replaceAll('_', ' ')}
                    </Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
