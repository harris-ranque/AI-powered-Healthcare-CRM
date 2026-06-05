'use client';

import type { ColumnDef, RowData } from '@tanstack/react-table';
import { ArrowUpDown, EllipsisVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Patient } from '@/features/patients/types/patient.type';

type RowActions = {
  onView: (patient: Patient) => void;
  onEdit: (patient: Patient) => void;
  onDelete: (patient: Patient) => void;
};

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> extends RowActions {}
}

function SortHeader({
  label,
  onToggle,
}: {
  label: string;
  onToggle: (desc?: boolean) => void;
}) {
  return (
    <Button variant="ghost" size="sm" className="-ml-2" onClick={() => onToggle()}>
      {label}
      <ArrowUpDown className="ml-1 size-3.5" />
    </Button>
  );
}

export const patientColumns: ColumnDef<Patient>[] = [
  {
    id: 'lastName',
    accessorFn: (row) => `${row.lastName}, ${row.firstName}`,
    header: ({ column }) => (
      <SortHeader label="Name" onToggle={(desc) => column.toggleSorting(desc)} />
    ),
  },
  {
    id: 'email',
    accessorKey: 'email',
    header: ({ column }) => (
      <SortHeader label="Email" onToggle={(desc) => column.toggleSorting(desc)} />
    ),
    cell: ({ row }) => row.original.email ?? 'N/A',
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone ?? 'N/A',
  },
  {
    id: 'dateOfBirth',
    accessorKey: 'dateOfBirth',
    header: 'Date of birth',
    cell: ({ row }) =>
      row.original.dateOfBirth
        ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
            new Date(row.original.dateOfBirth),
          )
        : 'N/A',
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <SortHeader label="Created" onToggle={(desc) => column.toggleSorting(desc)} />
    ),
    cell: ({ row }) =>
      new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
        new Date(row.original.createdAt),
      ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row, table }) => <PatientActionsCell patient={row.original} table={table} />,
  },
];

function PatientActionsCell({
  patient,
  table,
}: {
  patient: Patient;
  table: { options: { meta?: RowActions } };
}) {
  const router = useRouter();

  return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="ml-auto">
            <EllipsisVertical className="size-4" />
            <span className="sr-only">Open actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
          >
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => table.options.meta?.onEdit(patient)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => table.options.meta?.onDelete(patient)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
  );
}
