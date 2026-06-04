import { z } from 'zod';

import { Role } from '../types/role.type';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const slugSchema = z
  .string()
  .min(3, 'Slug must be at least 3 characters')
  .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and hyphens only');

function withOptionalGooglePassword<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape).superRefine((data, ctx) => {
    const record = data as { googleToken?: string; password?: string };
    if (!record.googleToken && !record.password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password is required',
        path: ['password'],
      });
    }
  });
}

export const registerClinicSchema = withOptionalGooglePassword({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema.optional(),
  googleToken: z.string().optional(),
  clinicName: z.string().min(3, 'Clinic name must be at least 3 characters'),
  clinicSlug: slugSchema,
});

export const registerStaffSchema = withOptionalGooglePassword({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema.optional(),
  googleToken: z.string().optional(),
  clinicSlug: slugSchema.optional(),
  role: z.enum([Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST]).optional(),
  inviteToken: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.inviteToken) {
    if (!data.clinicSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a clinic',
        path: ['clinicSlug'],
      });
    }
    if (!data.role) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a role',
        path: ['role'],
      });
    }
  }
});

export const registerPatientSchema = withOptionalGooglePassword({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema.optional(),
  googleToken: z.string().optional(),
  clinicSlug: slugSchema.optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  inviteToken: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.inviteToken && !data.clinicSlug) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Select a clinic',
      path: ['clinicSlug'],
    });
  }
});

export const registerSoloSchema = withOptionalGooglePassword({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: passwordSchema.optional(),
  googleToken: z.string().optional(),
  practiceName: z.string().min(3, 'Practice name must be at least 3 characters').optional(),
});

export type RegisterClinicFormValues = z.infer<typeof registerClinicSchema>;
export type RegisterSoloFormValues = z.infer<typeof registerSoloSchema>;
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

export function splitGoogleName(name?: string): { firstName: string; lastName: string } {
  if (!name?.trim()) {
    return { firstName: '', lastName: '' };
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
}
