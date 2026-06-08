export const patientSortFields = [
  'lastName',
  'firstName',
  'email',
  'createdAt',
] as const;
export type PatientSortField = (typeof patientSortFields)[number];

export const patientSortOrders = ['asc', 'desc'] as const;
export type PatientSortOrder = (typeof patientSortOrders)[number];

export type Patient = {
  id: string;
  organizationId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ListPatientsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  includeDeleted?: boolean;
  sortBy?: PatientSortField;
  order?: PatientSortOrder;
};

export type CreatePatientInput = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  notes?: string;
};

export type UpdatePatientInput = Partial<CreatePatientInput>;
