import { z } from 'zod';

import { Role } from '../types/role.type';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only');

export const registerClinicSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema,
  clinicName: z.string().min(3, 'Clinic name must be at least 3 characters'),
  clinicSlug: slugSchema,
});

export const registerStaffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema,
  clinicSlug: slugSchema,
  role: z.enum([Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST]),
});

export const registerPatientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema,
  clinicSlug: slugSchema,
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export type RegisterClinicFormValues = z.infer<typeof registerClinicSchema>;
export type RegisterStaffFormValues = z.infer<typeof registerStaffSchema>;
export type RegisterPatientFormValues = z.infer<typeof registerPatientSchema>;

export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}
