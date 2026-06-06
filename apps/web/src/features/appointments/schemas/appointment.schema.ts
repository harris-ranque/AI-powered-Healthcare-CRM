import { z } from 'zod';

import { appointmentStatuses } from '../types/appointment.type';

export const appointmentFormSchema = z
  .object({
    patientId: z.string().uuid('Select a patient'),
    providerId: z.string().optional().or(z.literal('')),
    startsAt: z.string().min(1, 'Start time is required'),
    endsAt: z.string().min(1, 'End time is required'),
    status: z.enum(appointmentStatuses),
    title: z.string().trim().max(200).optional().or(z.literal('')),
    reason: z.string().trim().max(500).optional().or(z.literal('')),
    notes: z.string().trim().max(2000).optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      return new Date(data.endsAt) > new Date(data.startsAt);
    },
    { message: 'End time must be after start time', path: ['endsAt'] },
  );

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;
