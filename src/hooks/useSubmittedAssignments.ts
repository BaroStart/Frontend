import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import { fetchSubmittedAssignments } from '@/api/assignments';
import { MOCK_SUBMITTED_ASSIGNMENTS } from '@/data/mockMentees';

export function useSubmittedAssignments(menteeId?: string) {
  return useQuery({
    queryKey: ['submittedAssignments', menteeId],
    queryFn: async () => {
      if (API_CONFIG.useMock) {
        if (menteeId) {
          return MOCK_SUBMITTED_ASSIGNMENTS.filter((a) => a.menteeId === menteeId);
        }
        return MOCK_SUBMITTED_ASSIGNMENTS;
      }
      return fetchSubmittedAssignments(menteeId);
    },
  });
}
