import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { patientsQueryKeys } from '@/features/patients/hooks/query-keys';

import { clinicalNotesApi } from '../api/clinical-notes.api';

export function useCreateNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => clinicalNotesApi.create(patientId, body),
    onSuccess: async () => {
      toast.success('Note added');
      await queryClient.invalidateQueries({
        queryKey: patientsQueryKeys.detail(patientId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to add note')),
  });
}

export function useUpdateNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string; body: string }) =>
      clinicalNotesApi.update(noteId, body),
    onSuccess: async () => {
      toast.success('Note updated');
      await queryClient.invalidateQueries({
        queryKey: patientsQueryKeys.detail(patientId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to update note')),
  });
}

export function useDeleteNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => clinicalNotesApi.delete(noteId),
    onSuccess: async () => {
      toast.success('Note deleted');
      await queryClient.invalidateQueries({
        queryKey: patientsQueryKeys.detail(patientId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to delete note')),
  });
}

export function useSummarizeNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => clinicalNotesApi.summarize(noteId),
    onSuccess: async () => {
      toast.success('AI summary generated');
      await queryClient.invalidateQueries({
        queryKey: patientsQueryKeys.detail(patientId),
      });
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to generate summary')),
  });
}
