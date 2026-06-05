import type { ActivityEvent } from '@/features/activity/types/activity.type';
import type { AiSummaryEntry, ClinicalNote } from '@/features/clinical-notes/types/clinical-note.type';
import type { PatientFile } from '@/features/files/types/file.type';

import type { Patient } from './patient.type';

export type PatientDetail = {
  patient: Patient;
  files: PatientFile[];
  notes: ClinicalNote[];
  aiSummaries: AiSummaryEntry[];
  activity: ActivityEvent[];
};
