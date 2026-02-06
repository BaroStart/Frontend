import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import { fetchSubmittedAssignments } from '@/api/assignments';
import { MOCK_SUBMITTED_ASSIGNMENTS } from '@/data/mockMentees';
import { getCompletedAssignmentIds } from '@/lib/mentorFeedbackStorage';

export function useSubmittedAssignments(menteeId?: string) {
  return useQuery({
    queryKey: ['submittedAssignments', menteeId],
    queryFn: async () => {
      if (API_CONFIG.useMockMentor) {
        let list = menteeId
          ? MOCK_SUBMITTED_ASSIGNMENTS.filter((a) => a.menteeId === menteeId)
          : [...MOCK_SUBMITTED_ASSIGNMENTS];
        const completedIds = getCompletedAssignmentIds();
        return list.map((a) =>
          completedIds.has(a.id) ? { ...a, feedbackDone: true } : a
        );
      }
      return fetchSubmittedAssignments(menteeId);
    },
  });
}
