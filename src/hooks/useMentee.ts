import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import { fetchMentee } from '@/api/mentees';
import { MOCK_MENTEES } from '@/data/mockMentees';

export function useMentee(menteeId: string | undefined) {
  return useQuery({
    queryKey: ['mentee', menteeId],
    queryFn: async () => {
      if (!menteeId) return null;
      if (API_CONFIG.useMockMentor) {
        return MOCK_MENTEES.find((m) => m.id === menteeId) ?? null;
      }
      return fetchMentee(menteeId);
    },
    enabled: !!menteeId,
  });
}
