import { z } from 'zod';

export const organizationSettingsSchema = z.object({
  name: z.string().min(3, 'Clinic name must be at least 3 characters'),
  description: z.string().optional(),
});

export type OrganizationSettingsFormValues = z.infer<
  typeof organizationSettingsSchema
>;
