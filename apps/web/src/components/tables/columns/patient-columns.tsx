'use client';

import { ColumnDef } from '@tanstack/react-table';

type Patient = {
  id: string;

  name: string;

  email: string;
};

export const patientColumns: ColumnDef<Patient>[] = [
  {
    accessorKey: 'name',

    header: 'Name',
  },

  {
    accessorKey: 'email',

    header: 'Email',
  },
];
