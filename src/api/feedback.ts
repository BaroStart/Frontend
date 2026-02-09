import type { FeedbackListItemRes } from '@/generated';

import { feedbacksApi } from './clients';

// 멘토 피드백 목록 조회
export async function fetchFeedbackListByMentor(): Promise<FeedbackListItemRes[]> {
  const { data } = await feedbacksApi.getListByMentor();
  return data.result ?? [];
}

// 피드백 생성
export async function createFeedback(
  assignmentId: number,
  content: string,
  summary?: string,
): Promise<number | null> {
  const { data } = await feedbacksApi.createFeedback({
    assignmentId,
    feedbackCreateReq: { content, summary },
  });
  return data.result ?? null;
}
