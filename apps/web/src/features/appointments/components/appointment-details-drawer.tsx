'use client';

import { useCallback, useState } from 'react';
import {
  CalendarClock,
  ClipboardList,
  FileText,
  Stethoscope,
  Tag,
  User,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import {
  useDeleteAppointment,
  useUpdateAppointment,
} from '../hooks/use-appointment-mutations';
import type { AppointmentFormValues } from '../schemas/appointment.schema';
import type { Appointment, AppointmentStatus } from '../types/appointment.type';
import { appointmentStatuses } from '../types/appointment.type';
import {
  formatAppointmentRange,
  formatPatientName,
  formatProviderName,
} from '../utils/appointment-format';
import {
  AppointmentForm,
  appointmentValuesToUpdatePayload,
} from './appointment-form';

type Props = {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STATUS_BADGE_CLASS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  CONFIRMED:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  NO_SHOW: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide uppercase',
        STATUS_BADGE_CLASS[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof User;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <div className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-muted-foreground text-xs font-medium uppercase">
          {label}
        </p>
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

export function AppointmentDetailsDrawer({
  appointment,
  open,
  onOpenChange,
}: Props) {
  const user = useAuth().user;
  const canWrite = hasPermission(user?.role, Permission.APPOINTMENT_WRITE);
  const updateAppointment = useUpdateAppointment();
  const deleteAppointment = useDeleteAppointment();
  const [editing, setEditing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleStatusChange = useCallback(
    async (status: AppointmentStatus) => {
      if (!appointment) return;
      try {
        await updateAppointment.mutateAsync({
          id: appointment.id,
          input: { status },
        });
      } catch {
        // toast handled in mutation
      }
    },
    [appointment, updateAppointment],
  );

  const handleCancel = useCallback(async () => {
    if (!appointment) return;
    await handleStatusChange('CANCELLED');
    onOpenChange(false);
  }, [appointment, handleStatusChange, onOpenChange]);

  const handleDelete = useCallback(async () => {
    if (!appointment) return;
    try {
      await deleteAppointment.mutateAsync(appointment.id);
      onOpenChange(false);
    } catch {
      // toast handled in mutation
    }
  }, [appointment, deleteAppointment, onOpenChange]);

  const handleEditSubmit = useCallback(
    async (values: AppointmentFormValues) => {
      if (!appointment) return;
      try {
        setApiError(null);
        await updateAppointment.mutateAsync({
          id: appointment.id,
          input: appointmentValuesToUpdatePayload(values),
        });
        setEditing(false);
      } catch (error) {
        setApiError(getErrorMessage(error, 'Failed to update appointment'));
      }
    },
    [appointment, updateAppointment],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setEditing(false);
      setApiError(null);
      setConfirmDelete(false);
    }
    onOpenChange(next);
  };

  if (!appointment) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Appointment details</SheetTitle>
          <SheetDescription>
            {appointment.title ?? formatPatientName(appointment.patient)}
          </SheetDescription>
        </SheetHeader>

        {editing ? (
          <div className="px-4 pb-6">
            <AppointmentForm
              initialAppointment={appointment}
              submitLabel="Save changes"
              loading={updateAppointment.isPending}
              apiError={apiError}
              onSubmit={handleEditSubmit}
            />
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => {
                setEditing(false);
                setApiError(null);
              }}
            >
              Cancel edit
            </Button>
          </div>
        ) : (
          <div className="space-y-5 px-4 pb-6">
            <div className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
              <StatusBadge status={appointment.status} />
              {canWrite ? (
                <Select
                  value={appointment.status}
                  onValueChange={(v) =>
                    void handleStatusChange(v as AppointmentStatus)
                  }
                  disabled={updateAppointment.isPending}
                >
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder="Change status" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replaceAll('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            <div className="space-y-4">
              <DetailRow icon={CalendarClock} label="When">
                {formatAppointmentRange(appointment.startsAt, appointment.endsAt)}
              </DetailRow>

              <DetailRow icon={User} label="Patient">
                <span className="font-medium">
                  {formatPatientName(appointment.patient)}
                </span>
              </DetailRow>

              <DetailRow icon={Stethoscope} label="Provider">
                {formatProviderName(appointment.provider)}
              </DetailRow>

              {appointment.title ? (
                <DetailRow icon={Tag} label="Title">
                  {appointment.title}
                </DetailRow>
              ) : null}

              {appointment.reason ? (
                <DetailRow icon={ClipboardList} label="Reason">
                  {appointment.reason}
                </DetailRow>
              ) : null}

              {appointment.notes ? (
                <DetailRow icon={FileText} label="Notes">
                  <p className="whitespace-pre-wrap">{appointment.notes}</p>
                </DetailRow>
              ) : null}
            </div>

            {canWrite ? (
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <Button size="sm" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                {appointment.status !== 'CANCELLED' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updateAppointment.isPending}
                    onClick={() => void handleCancel()}
                  >
                    Cancel appointment
                  </Button>
                ) : null}
                {confirmDelete ? (
                  <>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={deleteAppointment.isPending}
                      onClick={() => void handleDelete()}
                    >
                      Confirm delete
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDelete(false)}
                    >
                      Keep
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
