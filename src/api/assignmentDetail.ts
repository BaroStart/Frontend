import type { AssignmentDetail } from '@/types';

import axiosInstance from './axiosInstance';

/** 과제 상세 조회 */
export async function fetchAssignmentDetail(
  menteeId: string,
  assignmentId: string
): Promise<AssignmentDetail | null> {
  const { data } = await axiosInstance.get<AssignmentDetail | null>(
    `/mentor/mentees/${menteeId}/assignments/${assignmentId}`
  );
  return data;
}
