export const ProductEventName = {
  PATIENT_CREATED: 'patient_created',
  APPOINTMENT_CREATED: 'appointment_created',
  FILE_UPLOADED: 'file_uploaded',
  AI_SUMMARY_GENERATED: 'ai_summary_generated',
  USER_INVITED: 'user_invited',
} as const;

export type ProductEventNameKey =
  (typeof ProductEventName)[keyof typeof ProductEventName];

export const ALL_PRODUCT_EVENT_NAMES: ProductEventNameKey[] = [
  ProductEventName.PATIENT_CREATED,
  ProductEventName.APPOINTMENT_CREATED,
  ProductEventName.FILE_UPLOADED,
  ProductEventName.AI_SUMMARY_GENERATED,
  ProductEventName.USER_INVITED,
];
