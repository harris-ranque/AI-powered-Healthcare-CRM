const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

const EXTENSION_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function resolveMimeType(file: File): string | null {
  if (file.type && ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return file.type;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && extension in EXTENSION_MIME) {
    return EXTENSION_MIME[extension];
  }

  return null;
}

export function validateFile(file: File): { mimeType: string } | { error: string } {
  const mimeType = resolveMimeType(file);
  if (!mimeType) {
    return { error: 'Only PDF, JPEG, PNG, and DOCX files are allowed' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { error: 'File must be 10MB or smaller' };
  }
  return { mimeType };
}
