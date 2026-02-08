import type { AssignmentDetail } from '@/types';

import { MOCK_ASSIGNMENT_DETAILS } from '@/data/menteeDetailMock';

// TODO: 백엔드 과제 상세 API 구현 후 실 API 연동
// 현재 /mentor/mentees/:id/assignments/:id 엔드포인트가 백엔드에 없으므로 mock 데이터 사용

/** 과제 상세 조회 */
export async function fetchAssignmentDetail(
  _menteeId: string,
  assignmentId: string,
): Promise<AssignmentDetail | null> {
  return MOCK_ASSIGNMENT_DETAILS[assignmentId] ?? null;
}
