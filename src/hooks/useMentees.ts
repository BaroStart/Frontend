import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import { fetchMentees } from '@/api/mentees';
import { MOCK_MENTEES } from '@/data/mockMentees';

const MENTEES_QUERY_KEY = ['mentees'] as const;

export function useMentees() {
  return useQuery({
    queryKey: MENTEES_QUERY_KEY,
    queryFn: async () => {
      if (API_CONFIG.useMock) {
        return MOCK_MENTEES;
      }
      return fetchMentees();
    },
  });
}
