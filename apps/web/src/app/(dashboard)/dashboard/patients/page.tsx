'use client';

import type { PaginationState, SortingState } from '@tanstack/react-table';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DataTable } from '@/components/tables/data-table';
import { patientColumns } from '@/components/tables/columns/patient-columns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { Permission, hasPermission } from '@/features/auth/utils/role-permissions';
import { InvitationsList } from '@/features/organizations/components/invitations-list';
import { InviteDialog } from '@/features/organizations/components/invite-dialog';
import { CreatePatientDialog } from '@/features/patients/components/create-patient-dialog';
import { DeletePatientDialog } from '@/features/patients/components/delete-patient-dialog';
import { EditPatientDialog } from '@/features/patients/components/edit-patient-dialog';
import { ViewPatientSheet } from '@/features/patients/components/view-patient-sheet';
import { useDebounce } from '@/features/patients/hooks/use-debounce';
import { usePatientsList } from '@/features/patients/hooks/use-patients-list';
import type {
  Patient,
  PatientSortField,
  PatientSortOrder,
} from '@/features/patients/types/patient.type';

export default function PatientsPage() {
  const user = useAuth().user;
  const canInviteClients = hasPermission(user?.role, Permission.CLIENT_INVITE);
  const [search, setSearch] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'lastName', desc: false }]);

  const debouncedSearch = useDebounce(search, 300);
  const sortBy = (sorting[0]?.id ?? 'lastName') as PatientSortField;
  const order: PatientSortOrder = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading, isFetching, refetch } = usePatientsList({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearch || undefined,
    sortBy,
    order,
  });

  const rows = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta;
  const pageCount = Math.max(meta?.totalPages ?? 1, 1);

  function onView(patient: Patient) {
    setSelectedPatient(patient);
    setViewOpen(true);
  }

  function onEdit(patient: Patient) {
    setSelectedPatient(patient);
    setEditOpen(true);
  }

  function onDelete(patient: Patient) {
    setSelectedPatient(patient);
    setDeleteOpen(true);
  }

  return (
    <div className="space-y-6">
      {canInviteClients ? (
        <InvitationsList
          inviteeType="client"
          action={<InviteDialog mode="client" onOpenChange={setInviteDialogOpen} />}
        />
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full max-w-lg">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            name="patient-table-search"
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
            value={search}
            disabled={inviteDialogOpen}
            onChange={(event) => {
              setSearch(event.target.value);
              setPagination((prev) => ({ ...prev, pageIndex: 0 }));
            }}
            className="pl-8"
            placeholder="Search by name, email, or phone..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(value) => {
              setPagination({ pageIndex: 0, pageSize: Number(value) });
            }}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            New patient
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Patients</h2>
        {meta ? (
          <span className="text-muted-foreground text-sm">{meta.total} total</span>
        ) : null}
      </div>

      <DataTable
        columns={patientColumns}
        data={rows}
        pageCount={pageCount}
        pagination={pagination}
        sorting={sorting}
        onPaginationChange={setPagination}
        onSortingChange={setSorting}
        isLoading={isLoading}
        emptyState={
          <div className="space-y-1">
            <p className="font-medium">No patients found</p>
            <p className="text-muted-foreground text-sm">
              Try a different search term or create a patient.
            </p>
          </div>
        }
        meta={{ onView, onEdit, onDelete }}
      />

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {meta
            ? `Showing page ${meta.page} of ${Math.max(meta.totalPages, 1)} (${meta.total} total)`
            : 'Loading...'}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setPagination((prev) => ({ ...prev, pageIndex: Math.max(prev.pageIndex - 1, 0) }))
            }
            disabled={pagination.pageIndex === 0 || isFetching}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                pageIndex: Math.min(prev.pageIndex + 1, pageCount - 1),
              }))
            }
            disabled={pagination.pageIndex + 1 >= pageCount || isFetching}
          >
            Next
          </Button>
        </div>
      </div>

      <CreatePatientDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditPatientDialog patient={selectedPatient} open={editOpen} onOpenChange={setEditOpen} />
      <DeletePatientDialog
        patient={selectedPatient}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
      <ViewPatientSheet patient={selectedPatient} open={viewOpen} onOpenChange={setViewOpen} />
    </div>
  );
}
