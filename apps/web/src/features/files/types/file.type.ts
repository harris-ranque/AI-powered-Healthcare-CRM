export type PatientFile = {
  id: string;
  organizationId: string;
  uploadedById: string;
  patientId: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  publicUrl: string;
  createdAt: string;
};

export type UploadUrlResponse = {
  uploadUrl: string;
  file: PatientFile;
};
