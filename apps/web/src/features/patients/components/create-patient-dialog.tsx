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
import { useCreatePatient } from '../hooks/use-create-patient';
import { PatientForm, patientValuesToPayload } from './patient-form';
import type { PatientFormValues } from '../schemas/patient.schema';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePatientDialog({ open, onOpenChange }: Props) {
  const createPatient = useCreatePatient();
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (values: PatientFormValues) => {
      try {
        setApiError(null);
        await createPatient.mutateAsync(patientValuesToPayload(values));
        onOpenChange(false);
      } catch (error) {
        setApiError(getErrorMessage(error, 'Failed to create patient'));
      }
    },
    [createPatient, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create patient</DialogTitle>
          <DialogDescription>Add a new patient record.</DialogDescription>
        </DialogHeader>
        <PatientForm
          submitLabel="Create patient"
          loading={createPatient.isPending}
          apiError={apiError}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
