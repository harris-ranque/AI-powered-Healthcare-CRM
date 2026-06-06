import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/features/notifications/utils/get-error-message';

import { appointmentsApi } from '../api/appointments.api';
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '../types/appointment.type';
import { appointmentsQueryKeys } from './query-keys';

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAppointmentInput) => appointmentsApi.create(input),
    onSuccess: async () => {
      toast.success('Appointment created');
      await queryClient.invalidateQueries({
        queryKey: appointmentsQueryKeys.all,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to create appointment'));
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateAppointmentInput;
    }) => appointmentsApi.update(id, input),
    onSuccess: async () => {
      toast.success('Appointment updated');
      await queryClient.invalidateQueries({
        queryKey: appointmentsQueryKeys.all,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update appointment'));
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: async () => {
      toast.success('Appointment deleted');
      await queryClient.invalidateQueries({
        queryKey: appointmentsQueryKeys.all,
      });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete appointment'));
    },
  });
}
