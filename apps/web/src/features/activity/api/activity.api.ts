import { api } from '@/lib/api/client';

import type { ActivityEvent } from '../types/activity.type';

export const activityApi = {
  listForPatient: async (patientId: string): Promise<ActivityEvent[]> => {
    const response = await api.get<ActivityEvent[]>(`/patients/${patientId}/activity`);
    return response.data;
  },
};
