import { z } from 'zod';

import { patientSortFields, patientSortOrders } from '../types/patient.type';

const optionalTrimmed = z.string().trim().max(255).optional().or(z.literal(''));

export const patientFormSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .max(255)
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  dateOfBirth: z.string().trim().optional().or(z.literal('')),
  gender: z.string().trim().max(20).optional().or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const listPatientsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  search: optionalTrimmed,
  includeDeleted: z.boolean().default(false),
  sortBy: z.enum(patientSortFields).default('lastName'),
  order: z.enum(patientSortOrders).default('asc'),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;
export type ListPatientsQueryValues = z.infer<typeof listPatientsQuerySchema>;
