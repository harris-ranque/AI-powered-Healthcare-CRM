'use client';

import { useCallback, useState } from 'react';

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

function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex rounded-md px-2 py-0.5 text-xs font-medium uppercase">
      {status.replaceAll('_', ' ')}
    </span>
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
            {formatAppointmentRange(appointment.startsAt, appointment.endsAt)}
          </SheetDescription>
        </SheetHeader>

        {editing ? (
          <div className="mt-6">
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
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Status
              </p>
              <div className="flex items-center gap-2">
                <StatusBadge status={appointment.status} />
                {canWrite ? (
                  <Select
                    value={appointment.status}
                    onValueChange={(v) =>
                      void handleStatusChange(v as AppointmentStatus)
                    }
                    disabled={updateAppointment.isPending}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
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
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Patient
              </p>
              <p className="text-sm font-medium">
                {formatPatientName(appointment.patient)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground text-xs font-medium uppercase">
                Provider
              </p>
              <p className="text-sm">{formatProviderName(appointment.provider)}</p>
            </div>

            {appointment.title ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  Title
                </p>
                <p className="text-sm">{appointment.title}</p>
              </div>
            ) : null}

            {appointment.reason ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  Reason
                </p>
                <p className="text-sm">{appointment.reason}</p>
              </div>
            ) : null}

            {appointment.notes ? (
              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase">
                  Notes
                </p>
                <p className="text-sm whitespace-pre-wrap">{appointment.notes}</p>
              </div>
            ) : null}

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
