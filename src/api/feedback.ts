import axiosInstance from './axiosInstance';

/** 피드백 제출 요청 */
export interface SubmitFeedbackPayload {
  feedbackText: string;
  status: 'partial' | 'completed';
  progress?: number;
}

/** 피드백 상세 응답 */
export interface FeedbackDetail {
  id: string;
  assignmentId: string;
  menteeId: string;
  feedbackText: string;
  status: 'partial' | 'completed';
  progress?: number;
  feedbackDate: string;
  lastUpdate?: string;
}

/** 피드백 조회 */
export async function fetchFeedbackDetail(
  menteeId: string,
  assignmentId: string
): Promise<FeedbackDetail | null> {
  const { data } = await axiosInstance.get<FeedbackDetail | null>(
    `/mentor/mentees/${menteeId}/assignments/${assignmentId}/feedback`
  );
  return data;
}

/** 피드백 제출 */
export async function submitFeedback(
  menteeId: string,
  assignmentId: string,
  payload: SubmitFeedbackPayload
): Promise<FeedbackDetail> {
  const { data } = await axiosInstance.post<FeedbackDetail>(
    `/mentor/mentees/${menteeId}/assignments/${assignmentId}/feedback`,
    payload
  );
  return data;
}
