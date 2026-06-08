'use client';

import { useQuery } from '@tanstack/react-query';
import { HeartPulse } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { appointmentsApi } from '@/features/appointments/api/appointments.api';
import { appointmentsQueryKeys } from '@/features/appointments/hooks/query-keys';
import type { Appointment } from '@/features/appointments/types/appointment.type';
import { useDashboardStats } from '@/features/dashboard/hooks/use-dashboard-stats';

const statColors = ['text-primary', 'text-medical-sky', 'text-sunrise'];

const SAMPLE_STATS = [
  { label: 'Patients', value: '1,284' },
  { label: 'Visits', value: '38' },
  { label: 'Pending', value: '6' },
];

const SAMPLE_ROWS = [
  { name: 'Aisha Khan', time: '09:30', tag: 'Follow-up', tagClass: 'text-primary' },
  { name: 'Marco Silva', time: '10:15', tag: 'New patient', tagClass: 'text-medical-sky' },
  { name: 'Priya Shah', time: '11:00', tag: 'Lab review', tagClass: 'text-medical-mint' },
];

function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function formatStatusTag(appointment: Appointment) {
  if (appointment.title) {
    return appointment.title;
  }
  return appointment.status
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (char) => char.toUpperCase());
}

function patientName(appointment: Appointment) {
  if (appointment.patient) {
    return `${appointment.patient.firstName} ${appointment.patient.lastName}`;
  }
  return 'Patient';
}

export function TodayOverview() {
  const user = useAuth().user;
  const canReadPatients = hasPermission(user?.role, Permission.PATIENT_READ);
  const canReadAppointments = hasPermission(
    user?.role,
    Permission.APPOINTMENT_READ,
  );
  const isLive = canReadPatients || canReadAppointments;

  const { data: stats, isLoading: statsLoading } = useDashboardStats({
    enabled: canReadPatients,
  });

  const todayRange = getTodayRange();
  const { data: todayAppointments = [], isLoading: appointmentsLoading } =
    useQuery({
      queryKey: appointmentsQueryKeys.list(todayRange),
      queryFn: () => appointmentsApi.list(todayRange),
      enabled: canReadAppointments,
    });

  const pendingToday = todayAppointments.filter(
    (appointment) => appointment.status === 'SCHEDULED',
  ).length;

  const liveStats = [
    {
      label: 'Patients',
      value: statsLoading ? null : (stats?.patients ?? 0).toLocaleString(),
    },
    {
      label: 'Visits',
      value: appointmentsLoading ? null : todayAppointments.length.toString(),
    },
    {
      label: 'Pending',
      value: appointmentsLoading ? null : pendingToday.toString(),
    },
  ];

  const showLiveRows = canReadAppointments;
  const liveRows = todayAppointments.slice(0, 3);

  return (
    <div className="medical-card-glow bg-card rounded-2xl border p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="bg-primary/15 text-primary inline-flex h-10 w-10 items-center justify-center rounded-full">
            <HeartPulse className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold">Today&apos;s overview</p>
            <p className="text-muted-foreground text-xs">
              {isLive ? 'Live clinic data' : 'Sample preview'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(isLive ? liveStats : SAMPLE_STATS).map((stat, index) => (
            <div key={stat.label} className="bg-secondary/60 rounded-lg border p-3">
              {stat.value === null ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className={`text-2xl font-bold ${statColors[index]}`}>
                  {stat.value}
                </p>
              )}
              <p className="text-muted-foreground text-xs">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {showLiveRows ? (
            appointmentsLoading ? (
              <>
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </>
            ) : liveRows.length === 0 ? (
              <div className="bg-muted/50 text-muted-foreground rounded-lg border px-3 py-6 text-center text-sm">
                No appointments scheduled today.
              </div>
            ) : (
              liveRows.map((appointment) => (
                <div
                  key={appointment.id}
                  className="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{patientName(appointment)}</p>
                    <p className="text-primary text-xs font-medium">
                      {formatStatusTag(appointment)}
                    </p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {formatTime(appointment.startsAt)}
                  </span>
                </div>
              ))
            )
          ) : (
            SAMPLE_ROWS.map((row) => (
              <div
                key={row.name}
                className="bg-muted/50 flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className={`text-xs font-medium ${row.tagClass}`}>{row.tag}</p>
                </div>
                <span className="text-muted-foreground text-xs">{row.time}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
