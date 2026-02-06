import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import { fetchAssignmentDetail } from '@/api/assignmentDetail';
import { MOCK_ASSIGNMENT_DETAILS } from '@/data/menteeDetailMock';
import { useAssignmentStore } from '@/stores/useAssignmentStore';
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
      if (API_CONFIG.useMockMentor) {
        // 먼저 등록한 과제에서 찾기
        const registered = useAssignmentStore.getState().registeredIncomplete.find(
          (a) => a.id === assignmentId && a.menteeId === menteeId
        );
        if (registered && registered.content) {
          const dateStr = registered.deadlineDate ?? new Date().toISOString().slice(0, 10);
          return {
            assignmentId: registered.id,
            title: registered.title,
            subject: registered.subject,
            date: dateStr.replace(/-/g, '.'),
            goal: registered.description ?? '-',
            content: registered.content,
            providedPdfs: [],
            studentPhotos: [],
          };
        }
        // 그 다음 mock 데이터에서 찾기
        return MOCK_ASSIGNMENT_DETAILS[assignmentId] ?? null;
      }
      return fetchAssignmentDetail(menteeId, assignmentId);
    },
    enabled: (options?.enabled ?? true) && !!menteeId && !!assignmentId,
  });
}
