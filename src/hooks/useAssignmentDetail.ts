import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import { fetchAssignmentDetail } from '@/api/assignmentDetail';
import { MOCK_ASSIGNMENT_DETAILS } from '@/data/menteeDetailMock';
import type { AssignmentDetail } from '@/types';

export function useAssignmentDetail(
  menteeId: string | undefined,
  assignmentId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['assignmentDetail', menteeId, assignmentId],
    queryFn: async (): Promise<AssignmentDetail | null> => {
      if (!menteeId || !assignmentId) return null;
      if (API_CONFIG.useMock) {
        return MOCK_ASSIGNMENT_DETAILS[assignmentId] ?? null;
      }
      return fetchAssignmentDetail(menteeId, assignmentId);
    },
    enabled: (options?.enabled ?? true) && !!menteeId && !!assignmentId,
  });
}
