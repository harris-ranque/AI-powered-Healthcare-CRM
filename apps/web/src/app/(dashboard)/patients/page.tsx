'use client';

import { DataTable } from '@/components/tables/data-table';

import { patientColumns } from '@/components/tables/columns/patient-columns';

const data = [
  {
    id: '1',

    name: 'John Doe',

    email: 'john@example.com',
  },
];

export default function PatientsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patients</h1>
      </div>

      <DataTable columns={patientColumns} data={data} />
    </div>
  );
}
