import axiosInstance from './axiosInstance';
import type { ApiEnvelope } from './auth';

export type GetMenteeInfoResult = {
  menteeName: string;
  menteeGrade: string;
  lastAccess: number;
  mentoringStartDate: string;
  totalStudyTime: number;
  assignmentAchieveRate: number;
  averageScore: number;
};

export async function fetchMenteeInfo(menteeId: number): Promise<ApiEnvelope<GetMenteeInfoResult>> {
  const { data } = await axiosInstance.get<ApiEnvelope<GetMenteeInfoResult>>(`/api/v1/mentee/${menteeId}`);
  return data;
}

