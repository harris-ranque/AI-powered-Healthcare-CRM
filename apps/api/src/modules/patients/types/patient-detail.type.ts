import type { File, Patient } from '@prisma/client';

import type { AiService } from '../../ai/ai.service';
import type { AuditService } from '../../audit/audit.service';
import type { ClinicalNotesService } from '../../clinical-notes/clinical-notes.service';
import type { StorageService } from '../../storage/storage.service';

export type PatientDetail = {
  patient: Patient;
  files: Awaited<ReturnType<StorageService['listForPatient']>>;
  notes: Awaited<ReturnType<ClinicalNotesService['listForPatient']>>;
  aiSummaries: Awaited<ReturnType<AiService['listForPatient']>>;
  activity: Awaited<ReturnType<AuditService['listForPatient']>>;
};

export type { File };
