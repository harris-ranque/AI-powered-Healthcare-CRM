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
import { useUpdatePatient } from '../hooks/use-update-patient';
import type { Patient } from '../types/patient.type';
import { PatientForm, patientValuesToPayload } from './patient-form';
import type { PatientFormValues } from '../schemas/patient.schema';

type Props = {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditPatientDialog({ patient, open, onOpenChange }: Props) {
  const updatePatient = useUpdatePatient();
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (values: PatientFormValues) => {
      if (!patient) return;
      try {
        setApiError(null);
        await updatePatient.mutateAsync({
          id: patient.id,
          input: patientValuesToPayload(values),
        });
        onOpenChange(false);
      } catch (error) {
        setApiError(getErrorMessage(error, 'Failed to update patient'));
      }
    },
    [onOpenChange, patient, updatePatient],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit patient</DialogTitle>
          <DialogDescription>Update patient details.</DialogDescription>
        </DialogHeader>
        <PatientForm
          initialPatient={patient}
          submitLabel="Save changes"
          loading={updatePatient.isPending}
          apiError={apiError}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
