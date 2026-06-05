export type ClinicalNoteAuthor = {
  id: string;
  name: string | null;
  email: string;
};

export type ClinicalNote = {
  id: string;
  organizationId: string;
  patientId: string;
  authorId: string;
  body: string;
  aiSummary: string | null;
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
