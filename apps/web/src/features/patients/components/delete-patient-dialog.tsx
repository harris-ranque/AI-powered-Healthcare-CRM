'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeletePatient } from '../hooks/use-delete-patient';
import type { Patient } from '../types/patient.type';

type Props = {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DeletePatientDialog({ patient, open, onOpenChange }: Props) {
  const deletePatient = useDeletePatient();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete patient?</AlertDialogTitle>
          <AlertDialogDescription>
            This will soft-delete {patient?.firstName} {patient?.lastName}. You can restore
            later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePatient.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deletePatient.isPending || !patient}
            onClick={async (event) => {
              event.preventDefault();
              if (!patient) return;
              await deletePatient.mutateAsync(patient.id);
              onOpenChange(false);
            }}
          >
            {deletePatient.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
