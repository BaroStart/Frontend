import type {
  FeedbackItem,
  IncompleteAssignment,
  MenteeKpi,
  MenteeTask,
  TodayComment,
} from '@/types';

import axiosInstance from './axiosInstance';

/** 피드백 대기/완료 목록 */
export async function fetchFeedbackItems(
  menteeId: string,
  params?: { subject?: string; startDate?: string; endDate?: string }
): Promise<FeedbackItem[]> {
  const { data } = await axiosInstance.get<FeedbackItem[]>(
    `/mentor/mentees/${menteeId}/feedback`,
    { params }
  );
  return data;
}

/** 미완료 과제 목록 */
export async function fetchIncompleteAssignments(
  menteeId: string,
  params?: { startDate?: string; endDate?: string }
): Promise<IncompleteAssignment[]> {
  const { data } = await axiosInstance.get<IncompleteAssignment[]>(
    `/mentor/mentees/${menteeId}/assignments/incomplete`,
    { params }
  );
  return data;
}

/** 학습 일정/To-Do 목록 */
export async function fetchMenteeTasks(
  menteeId: string,
  params?: { date?: string; startDate?: string; endDate?: string }
): Promise<MenteeTask[]> {
  const { data } = await axiosInstance.get<MenteeTask[]>(
    `/mentor/mentees/${menteeId}/tasks`,
    { params }
  );
  return data;
}

/** 오늘의 한마디 & 질문 */
export async function fetchTodayComments(menteeId: string): Promise<TodayComment | null> {
  const { data } = await axiosInstance.get<TodayComment | null>(
    `/mentor/mentees/${menteeId}/comments/today`
  );
  return data;
}

/** 멘티 KPI 지표 */
export async function fetchMenteeKpi(menteeId: string): Promise<MenteeKpi | null> {
  const { data } = await axiosInstance.get<MenteeKpi | null>(
    `/mentor/mentees/${menteeId}/kpi`
  );
  return data;
}
