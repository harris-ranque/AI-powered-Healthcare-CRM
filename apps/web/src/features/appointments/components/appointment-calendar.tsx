'use client';

import type { DateSelectArg, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

import { appointmentsApi } from '../api/appointments.api';
import { appointmentsQueryKeys } from '../hooks/query-keys';
import { useAppointmentsList } from '../hooks/use-appointments-list';
import type { Appointment, AppointmentStatus } from '../types/appointment.type';
import { getAppointmentEventTitle } from '../utils/appointment-format';
import { AppointmentDetailsDrawer } from './appointment-details-drawer';
import { CreateAppointmentDialog } from './create-appointment-dialog';

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'fc-event-scheduled',
  CONFIRMED: 'fc-event-confirmed',
  COMPLETED: 'fc-event-completed',
  CANCELLED: 'fc-event-cancelled',
  NO_SHOW: 'fc-event-noshow',
};

type Props = {
  onNewAppointment?: () => void;
};

export function AppointmentCalendar({ onNewAppointment }: Props) {
  const user = useAuth().user;
  const canWrite = hasPermission(user?.role, Permission.APPOINTMENT_WRITE);
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkAppointmentId = searchParams.get('appointmentId');

  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [defaultStart, setDefaultStart] = useState<Date | undefined>();
  const [defaultEnd, setDefaultEnd] = useState<Date | undefined>();
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: appointments = [], isLoading } = useAppointmentsList(
    range ?? {},
    { enabled: range !== null },
  );

  const { data: deepLinkedAppointment } = useQuery({
    queryKey: appointmentsQueryKeys.detail(deepLinkAppointmentId ?? ''),
    queryFn: () => appointmentsApi.getById(deepLinkAppointmentId as string),
    enabled: Boolean(deepLinkAppointmentId),
  });

  useEffect(() => {
    if (deepLinkedAppointment) {
      setSelectedAppointment(deepLinkedAppointment);
      setDrawerOpen(true);
    }
  }, [deepLinkedAppointment]);

  const events = useMemo(
    () =>
      appointments.map((appointment) => ({
        id: appointment.id,
        title: getAppointmentEventTitle(appointment),
        start: appointment.startsAt,
        end: appointment.endsAt,
        classNames: [STATUS_CLASS[appointment.status] ?? ''],
        extendedProps: { appointment },
      })),
    [appointments],
  );

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setRange({
      from: arg.start.toISOString(),
      to: arg.end.toISOString(),
    });
  }, []);

  const openCreateWithSlot = useCallback((start: Date, end: Date) => {
    setDefaultStart(start);
    setDefaultEnd(end);
    setCreateOpen(true);
  }, []);

  const handleSelect = useCallback(
    (arg: DateSelectArg) => {
      if (!canWrite) return;
      openCreateWithSlot(arg.start, arg.end);
      arg.view.calendar.unselect();
    },
    [canWrite, openCreateWithSlot],
  );

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const appointment = arg.event.extendedProps.appointment as Appointment;
    setSelectedAppointment(appointment);
    setDrawerOpen(true);
  }, []);

  const handleNewClick = useCallback(() => {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    setDefaultStart(now);
    setDefaultEnd(end);
    setCreateOpen(true);
    onNewAppointment?.();
  }, [onNewAppointment]);

  return (
    <div className="space-y-4">
      {canWrite ? (
        <div className="flex justify-end">
          <Button onClick={handleNewClick}>
            <Plus className="mr-2 size-4" />
            New appointment
          </Button>
        </div>
      ) : null}

      <div className="appointment-calendar relative rounded-lg border bg-card p-2">
        {isLoading && range ? (
          <Skeleton className="absolute inset-2 z-10 rounded-md" />
        ) : null}
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridDay,timeGridWeek,dayGridMonth',
          }}
          height="auto"
          slotMinTime="07:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          nowIndicator
          selectable={canWrite}
          selectMirror
          events={events}
          datesSet={handleDatesSet}
          select={handleSelect}
          eventClick={handleEventClick}
        />
      </div>

      <CreateAppointmentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultStart={defaultStart}
        defaultEnd={defaultEnd}
      />

      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open && deepLinkAppointmentId) {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('appointmentId');
            const query = params.toString();
            router.replace(query ? `/dashboard/calendar?${query}` : '/dashboard/calendar');
          }
        }}
      />
    </div>
  );
}
