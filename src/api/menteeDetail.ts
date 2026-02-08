import {
  MOCK_FEEDBACK_ITEMS,
  MOCK_INCOMPLETE_ASSIGNMENTS,
  MOCK_MENTEE_KPIS,
  MOCK_MENTEE_TASKS,
  MOCK_TODAY_COMMENTS,
} from '@/data/menteeDetailMock';
import { MOCK_SUBMITTED_ASSIGNMENTS } from '@/data/mockMentees';
import type {
  FeedbackItem,
  IncompleteAssignment,
  MenteeKpi,
  MenteeTask,
  SubmittedAssignment,
  TodayComment,
} from '@/types';

// TODO: 백엔드 멘티 상세 API 구현 후 실 API 연동
// 현재 /mentor/mentees/:id/* 엔드포인트가 백엔드에 없으므로 mock 데이터 사용

/** 피드백 대기/완료 목록 */
export async function fetchFeedbackItems(
  menteeId: string,
  _params?: { subject?: string; startDate?: string; endDate?: string },
): Promise<FeedbackItem[]> {
  return MOCK_FEEDBACK_ITEMS.filter((f) => f.menteeId === menteeId);
}

/** 미완료 과제 목록 */
export async function fetchIncompleteAssignments(
  menteeId: string,
  _params?: { startDate?: string; endDate?: string },
): Promise<IncompleteAssignment[]> {
  return MOCK_INCOMPLETE_ASSIGNMENTS.filter((a) => a.menteeId === menteeId);
}

/** 학습 일정/To-Do 목록 */
export async function fetchMenteeTasks(
  menteeId: string,
  _params?: { date?: string; startDate?: string; endDate?: string },
): Promise<MenteeTask[]> {
  return MOCK_MENTEE_TASKS.filter((t) => t.menteeId === menteeId);
}

/** 오늘의 한마디 & 질문 */
export async function fetchTodayComments(menteeId: string): Promise<TodayComment | null> {
  return MOCK_TODAY_COMMENTS.find((c) => c.menteeId === menteeId) ?? null;
}

/** 멘티 KPI 지표 */
export async function fetchMenteeKpi(menteeId: string): Promise<MenteeKpi | null> {
  return MOCK_MENTEE_KPIS.find((k) => k.menteeId === menteeId) ?? null;
}

/** 제출 과제 목록 */
export async function fetchSubmittedAssignments(menteeId?: string): Promise<SubmittedAssignment[]> {
  return menteeId
    ? MOCK_SUBMITTED_ASSIGNMENTS.filter((a) => a.menteeId === menteeId)
    : MOCK_SUBMITTED_ASSIGNMENTS;
}
