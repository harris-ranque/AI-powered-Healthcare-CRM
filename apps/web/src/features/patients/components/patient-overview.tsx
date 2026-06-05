'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Patient } from '../types/patient.type';

type Props = {
  patient: Patient;
};

function formatDate(value: string | null) {
  if (!value) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value));
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export function PatientOverview({ patient }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Patient info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <Field label="First name" value={patient.firstName} />
            <Field label="Last name" value={patient.lastName} />
            <Field label="Date of birth" value={formatDate(patient.dateOfBirth)} />
            <Field label="Gender" value={patient.gender ?? 'N/A'} />
            <Field label="Address" value={patient.address ?? 'N/A'} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm">
            <Field label="Email" value={patient.email ?? 'N/A'} />
            <Field label="Phone" value={patient.phone ?? 'N/A'} />
          </dl>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Patient ID" value={patient.id} />
            <Field label="Organization ID" value={patient.organizationId} />
            <Field label="Portal user ID" value={patient.userId ?? 'Not linked'} />
            <Field label="Created" value={formatDate(patient.createdAt)} />
            <Field label="Updated" value={formatDate(patient.updatedAt)} />
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1">
                {patient.deletedAt ? (
                  <Badge variant="destructive">Deleted</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
