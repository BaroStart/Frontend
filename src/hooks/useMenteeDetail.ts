import { useQuery } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import {
  fetchFeedbackItems,
  fetchIncompleteAssignments,
  fetchMenteeKpi,
  fetchMenteeTasks,
  fetchTodayComments,
} from '@/api/menteeDetail';
import {
  MOCK_FEEDBACK_ITEMS,
  MOCK_INCOMPLETE_ASSIGNMENTS,
  MOCK_MENTEE_KPIS,
  MOCK_MENTEE_TASKS,
  MOCK_TODAY_COMMENTS,
} from '@/data/menteeDetailMock';
import { getMentorFeedback } from '@/lib/mentorFeedbackStorage';
import { useAssignmentStore } from '@/stores/useAssignmentStore';

type DateRange = { startDate?: string; endDate?: string };

export function useFeedbackItems(
  menteeId: string | undefined,
  params?: { subject?: string } & DateRange
) {
  return useQuery({
    queryKey: ['feedbackItems', menteeId, params],
    queryFn: async () => {
      if (!menteeId) return [];
      if (API_CONFIG.useMock) {
        const base = MOCK_FEEDBACK_ITEMS.filter((f) => f.menteeId === menteeId);
        return base.map((item) => {
          const stored = getMentorFeedback(menteeId, item.assignmentId);
          if (stored?.status === 'completed') {
            return {
              ...item,
              status: 'completed' as const,
              feedbackText: stored.feedbackText,
              feedbackDate: stored.feedbackDate,
            };
          }
          return item;
        });
      }
      return fetchFeedbackItems(menteeId, params);
    },
    enabled: !!menteeId,
  });
}

export function useIncompleteAssignments(menteeId: string | undefined, params?: DateRange) {
  return useQuery({
    queryKey: ['incompleteAssignments', menteeId, params],
    refetchOnMount: 'always', // 새로고침/페이지 진입 시 persist 복원 후 항상 최신 데이터 반영
    queryFn: async () => {
      if (!menteeId) return [];
      if (API_CONFIG.useMock) {
        const { registeredIncomplete } = useAssignmentStore.getState();
        const mock = MOCK_INCOMPLETE_ASSIGNMENTS.filter((a) => a.menteeId === menteeId);
        const registered = registeredIncomplete.filter((a) => a.menteeId === menteeId);
        return [...mock, ...registered]; // 더미 유지 + 등록한 과제 추가
      }
      return fetchIncompleteAssignments(menteeId, params);
    },
    enabled: !!menteeId,
  });
}

export function useMenteeTasks(
  menteeId: string | undefined,
  params?: { date?: string } & DateRange
) {
  return useQuery({
    queryKey: ['menteeTasks', menteeId, params],
    queryFn: async () => {
      if (!menteeId) return [];
      if (API_CONFIG.useMock) {
        const mock = MOCK_MENTEE_TASKS.filter((t) => t.menteeId === menteeId);
        const registered = useAssignmentStore.getState().registeredTasks.filter(
          (t) => t.menteeId === menteeId
        );
        return [...mock, ...registered];
      }
      return fetchMenteeTasks(menteeId, params);
    },
    enabled: !!menteeId,
  });
}

export function useTodayComment(menteeId: string | undefined, date?: string) {
  return useQuery({
    queryKey: ['todayComment', menteeId, date],
    queryFn: async () => {
      if (!menteeId) return null;
      if (API_CONFIG.useMock) {
        return MOCK_TODAY_COMMENTS.find((c) => c.menteeId === menteeId && c.date === date) ?? null;
      }
      return fetchTodayComments(menteeId);
    },
    enabled: !!menteeId && !!date,
  });
}

export function useMenteeKpi(menteeId: string | undefined) {
  return useQuery({
    queryKey: ['menteeKpi', menteeId],
    queryFn: async () => {
      if (!menteeId) return null;
      if (API_CONFIG.useMock) {
        return MOCK_MENTEE_KPIS.find((k) => k.menteeId === menteeId) ?? null;
      }
      return fetchMenteeKpi(menteeId);
    },
    enabled: !!menteeId,
  });
}
