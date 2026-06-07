import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { commentsApi } from '../api/comments.api';
import { commentsQueryKeys } from './query-keys';

export function useCreatePatientComment(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => commentsApi.createForPatient(patientId, body),
    onSuccess: async () => {
      toast.success('Comment posted');
      await queryClient.invalidateQueries({
        queryKey: commentsQueryKeys.patient(patientId),
      });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Failed to post comment')),
  });
}

export function useCreateAppointmentComment(appointmentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      commentsApi.createForAppointment(appointmentId, body),
    onSuccess: async () => {
      toast.success('Comment posted');
      await queryClient.invalidateQueries({
        queryKey: commentsQueryKeys.appointment(appointmentId),
      });
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Failed to post comment')),
  });
}

export function useDeleteComment(scope: {
  patientId?: string;
  appointmentId?: string;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(commentId),
    onSuccess: async () => {
      toast.success('Comment deleted');
      if (scope.patientId) {
        await queryClient.invalidateQueries({
          queryKey: commentsQueryKeys.patient(scope.patientId),
        });
      }
      if (scope.appointmentId) {
        await queryClient.invalidateQueries({
          queryKey: commentsQueryKeys.appointment(scope.appointmentId),
        });
      }
    },
    onError: (error) =>
      toast.error(getErrorMessage(error, 'Failed to delete comment')),
  });
}
