'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityTimeline } from '@/features/activity/components/activity-timeline';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { NotesList } from '@/features/clinical-notes/components/notes-list';
import { FileList } from '@/features/files/components/file-list';
import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { DeletePatientDialog } from '@/features/patients/components/delete-patient-dialog';
import { EditPatientDialog } from '@/features/patients/components/edit-patient-dialog';
import { PatientOverview } from '@/features/patients/components/patient-overview';
import { PatientSummaryCard } from '@/features/patients/components/patient-summary-card';
import { usePatient } from '@/features/patients/hooks/use-patient';

export default function PatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const user = useAuth().user;
  const patientId = params.id;
  const { data: detail, isLoading, error } = usePatient(patientId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const canRead = hasPermission(user?.role, Permission.PATIENT_READ);
  const canWrite = hasPermission(user?.role, Permission.PATIENT_WRITE);
  const canDelete = hasPermission(user?.role, Permission.PATIENT_DELETE);

  if (!canRead) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground">You do not have permission to view patients.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4 rounded-lg border p-6">
        <p className="text-destructive">{getErrorMessage(error, 'Patient not found')}</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/patients">
            <ArrowLeft className="mr-2 size-4" />
            Back to patients
          </Link>
        </Button>
      </div>
    );
  }

  const { patient, files, notes, aiSummaries, activity } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="-ml-2 w-fit" asChild>
            <Link href="/dashboard/patients">
              <ArrowLeft className="mr-2 size-4" />
              Back to patients
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Patient workspace</h1>
          <p className="text-muted-foreground text-sm">
            Central operational view for {patient.firstName} {patient.lastName}.
          </p>
        </div>

        <div className="flex gap-2">
          {canWrite ? (
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 size-4" />
              Edit
            </Button>
          ) : null}
          {canDelete ? (
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          ) : null}
        </div>
      </div>

      <PatientSummaryCard patient={patient} />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PatientOverview patient={patient} />
        </TabsContent>
        <TabsContent value="notes">
          <NotesList patientId={patient.id} notes={notes} aiSummaries={aiSummaries} />
        </TabsContent>
        <TabsContent value="files">
          <FileList patientId={patient.id} files={files} />
        </TabsContent>
        <TabsContent value="activity">
          <ActivityTimeline events={activity} />
        </TabsContent>
      </Tabs>

      <EditPatientDialog patient={patient} open={editOpen} onOpenChange={setEditOpen} />
      <DeletePatientDialog
        patient={patient}
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) {
            router.push('/dashboard/patients');
          }
        }}
      />
    </div>
  );
}
