import { useQuery } from '@tanstack/react-query';

import { commentsApi } from '../api/comments.api';
import { commentsQueryKeys } from './query-keys';

export function usePatientComments(patientId: string | null) {
  return useQuery({
    queryKey: commentsQueryKeys.patient(patientId ?? ''),
    queryFn: () => commentsApi.listForPatient(patientId as string),
    enabled: Boolean(patientId),
  });
}

export function useAppointmentComments(appointmentId: string | null) {
  return useQuery({
    queryKey: commentsQueryKeys.appointment(appointmentId ?? ''),
    queryFn: () => commentsApi.listForAppointment(appointmentId as string),
    enabled: Boolean(appointmentId),
  });
}
