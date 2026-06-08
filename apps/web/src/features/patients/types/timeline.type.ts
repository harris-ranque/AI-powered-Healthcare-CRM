export type TimelineEventType =
  | 'PATIENT_CREATED'
  | 'NOTE_ADDED'
  | 'AI_SUMMARY'
  | 'FILE_UPLOADED'
  | 'APPOINTMENT';

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string | null;
  actor: string | null;
  occurredAt: string;
};
