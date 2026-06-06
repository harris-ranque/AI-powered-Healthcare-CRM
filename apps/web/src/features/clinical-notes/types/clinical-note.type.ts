export type ClinicalNoteAuthor = {
  id: string;
  name: string | null;
  email: string;
};

export type ClinicalNoteInput = {
  title?: string;
  body: string;
};

export type KeyPoints = {
  keyFindings: string[];
  actionItems: string[];
  followUpTasks: string[];
};

export const AI_SAFETY_DISCLAIMER = 'Not medical advice. Review before use.';

export type ClinicalNote = {
  id: string;
  organizationId: string;
  patientId: string;
  authorId: string;
  title: string | null;
  body: string;
  aiSummary: string | null;
  keyPoints: KeyPoints | null;
  visitSummary: string | null;
  createdAt: string;
  updatedAt: string;
  author?: ClinicalNoteAuthor;
};

export type AiSummaryEntry = {
  id: string;
  prompt: string;
  response: string;
  tokens: number;
  noteId: string | null;
  createdAt: string;
  user: ClinicalNoteAuthor;
};
