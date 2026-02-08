// TODO: 백엔드 피드백 API 구현 후 실 API 연동
// 현재 /mentor/mentees/:id/assignments/:id/feedback 엔드포인트가 백엔드에 없으므로 mock 처리

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
  _menteeId: string,
  _assignmentId: string,
): Promise<FeedbackDetail | null> {
  return null;
}

/** 피드백 제출 (mock) */
export async function submitFeedback(
  menteeId: string,
  assignmentId: string,
  payload: SubmitFeedbackPayload,
): Promise<FeedbackDetail> {
  return {
    id: `fb-${Date.now()}`,
    assignmentId,
    menteeId,
    feedbackText: payload.feedbackText,
    status: payload.status,
    progress: payload.progress,
    feedbackDate: new Date().toISOString(),
  };
}
