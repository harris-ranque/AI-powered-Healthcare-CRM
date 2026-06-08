'use client';

import { Calendar, Mail, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import type { Patient } from '../types/patient.type';

type Props = {
  patient: Patient;
};

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
}

export function PatientSummaryCard({ patient }: Props) {
  const fullName = `${patient.firstName} ${patient.lastName}`;
  const isDeleted = Boolean(patient.deletedAt);

  return (
    <Card className="border-primary/15 bg-card/80">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">{fullName}</h2>
            {isDeleted ? (
              <Badge variant="destructive">Deleted</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
          </div>
          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5">
              <Mail className="size-3.5 shrink-0" />
              {patient.email ?? 'No email on file'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Phone className="size-3.5 shrink-0" />
              {patient.phone ?? 'No phone on file'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              Created {formatDate(patient.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
