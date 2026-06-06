'use client';

import { useCallback, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { useCreateAppointment } from '../hooks/use-appointment-mutations';
import type { AppointmentFormValues } from '../schemas/appointment.schema';
import {
  AppointmentForm,
  appointmentValuesToCreatePayload,
} from './appointment-form';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStart?: Date;
  defaultEnd?: Date;
};

export function CreateAppointmentDialog({
  open,
  onOpenChange,
  defaultStart,
  defaultEnd,
}: Props) {
  const createAppointment = useCreateAppointment();
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (values: AppointmentFormValues) => {
      try {
        setApiError(null);
        await createAppointment.mutateAsync(
          appointmentValuesToCreatePayload(values),
        );
        onOpenChange(false);
      } catch (error) {
        setApiError(getErrorMessage(error, 'Failed to create appointment'));
      }
    },
    [createAppointment, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create appointment</DialogTitle>
          <DialogDescription>
            Schedule a new visit for a patient.
          </DialogDescription>
        </DialogHeader>
        <AppointmentForm
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
          submitLabel="Create appointment"
          loading={createAppointment.isPending}
          apiError={apiError}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
