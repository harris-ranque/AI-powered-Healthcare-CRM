'use client';

import { AppointmentCalendar } from '@/features/appointments/components/appointment-calendar';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';

export default function CalendarPage() {
  const user = useAuth().user;
  const canRead = hasPermission(user?.role, Permission.APPOINTMENT_READ);

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="font-medium">You do not have access to the clinic calendar.</p>
        <p className="text-muted-foreground text-sm">
          Contact your clinic administrator if you need scheduling access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          Clinic schedule
        </h2>
        <p className="text-muted-foreground text-sm">
          View and manage appointments across day, week, and month views.
        </p>
      </div>
      <AppointmentCalendar />
    </div>
  );
}
