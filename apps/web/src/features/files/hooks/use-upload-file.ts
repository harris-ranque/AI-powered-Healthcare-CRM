import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { patientsQueryKeys } from '@/features/patients/hooks/query-keys';

import { filesApi } from '../api/files.api';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024;

export function useUploadFile(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error('Only PDF, JPEG, and PNG files are allowed');
      }
      if (file.size > MAX_SIZE) {
        throw new Error('File must be 10MB or smaller');
      }

      const { uploadUrl } = await filesApi.createUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        patientId,
      });

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }
    },
    onSuccess: async () => {
      toast.success('File uploaded');
      await queryClient.invalidateQueries({
        queryKey: patientsQueryKeys.detail(patientId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to upload file')),
  });
}
