import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';
import { patientsQueryKeys } from '@/features/patients/hooks/query-keys';

import { clinicalNotesApi } from '../api/clinical-notes.api';
import type { ClinicalNoteInput } from '../types/clinical-note.type';
import { clinicalNotesQueryKeys } from './query-keys';

async function invalidateNoteQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: patientsQueryKeys.all,
    }),
    queryClient.invalidateQueries({
      queryKey: clinicalNotesQueryKeys.all,
    }),
  ]);
}

export function useCreateNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClinicalNoteInput) =>
      clinicalNotesApi.create(patientId, input),
    onSuccess: async () => {
      toast.success('Note added');
      await invalidateNoteQueries(queryClient);
    },
    onError: (error) => toast.error(getErrorMessage(error, 'Failed to add note')),
  });
}

export function useUpdateNote(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      noteId,
      ...input
    }: { noteId: string } & Partial<ClinicalNoteInput>) =>
      clinicalNotesApi.update(noteId, input),
    onSuccess: async () => {
      toast.success('Note updated');
      await invalidateNoteQueries(queryClient);
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
      await invalidateNoteQueries(queryClient);
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
      await invalidateNoteQueries(queryClient);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Failed to generate summary')),
  });
}

export function useGenerateKeyPoints(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => clinicalNotesApi.generateKeyPoints(noteId),
    onSuccess: async () => {
      toast.success('Key points generated');
      await invalidateNoteQueries(queryClient);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Failed to generate key points')),
  });
}

export function useGenerateVisitSummary(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => clinicalNotesApi.generateVisitSummary(noteId),
    onSuccess: async () => {
      toast.success('Visit summary generated');
      await invalidateNoteQueries(queryClient);
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Failed to generate visit summary')),
  });
}
