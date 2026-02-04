import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import {
  fetchFeedbackDetail,
  submitFeedback,
  type SubmitFeedbackPayload,
} from '@/api/feedback';

/** 피드백 상세 조회 (API 모드에서만 호출, Mock 시 null) */
export function useFeedbackDetail(
  menteeId: string | undefined,
  assignmentId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: ['feedbackDetail', menteeId, assignmentId],
    queryFn: () => {
      if (!menteeId || !assignmentId) return Promise.resolve(null);
      return fetchFeedbackDetail(menteeId, assignmentId);
    },
    enabled:
      (options?.enabled ?? true) &&
      !!menteeId &&
      !!assignmentId &&
      !API_CONFIG.useMock,
  });
}

/** 피드백 제출 */
export function useSubmitFeedback(menteeId: string, assignmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SubmitFeedbackPayload) =>
      submitFeedback(menteeId, assignmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['feedbackDetail', menteeId, assignmentId],
      });
      queryClient.invalidateQueries({ queryKey: ['feedbackItems', menteeId] });
      queryClient.invalidateQueries({ queryKey: ['submittedAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['mentees'] });
    },
  });
}
