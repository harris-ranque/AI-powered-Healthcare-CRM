export type SearchPatientResult = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
};

export type SearchAppointmentResult = {
  id: string;
  patientId: string;
  patientName: string;
  title: string | null;
  startsAt: string;
  status: string;
};

export type SearchNoteResult = {
  id: string;
  patientId: string;
  title: string | null;
  snippet: string;
};

export type SearchFileResult = {
  id: string;
  patientId: string | null;
  originalName: string;
  mimeType: string;
};

export type SearchResults = {
  patients: SearchPatientResult[];
  appointments: SearchAppointmentResult[];
  notes: SearchNoteResult[];
  files: SearchFileResult[];
};
