'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Patient } from '../types/patient.type';

type Props = {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
}

export function ViewPatientSheet({ patient, open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient details'}
          </SheetTitle>
          <SheetDescription>Read-only patient profile.</SheetDescription>
        </SheetHeader>
        {patient ? (
          <dl className="grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{patient.email ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{patient.phone ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Date of birth</dt>
              <dd>{formatDate(patient.dateOfBirth)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gender</dt>
              <dd>{patient.gender ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Address</dt>
              <dd>{patient.address ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Notes</dt>
              <dd>{patient.notes ?? 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{formatDate(patient.createdAt)}</dd>
            </div>
          </dl>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
