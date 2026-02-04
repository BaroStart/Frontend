import type { MenteeSummary } from '@/types';

import axiosInstance from './axiosInstance';

/** 담당 멘티 목록 조회 */
export async function fetchMentees(): Promise<MenteeSummary[]> {
  const { data } = await axiosInstance.get<MenteeSummary[]>('/mentor/mentees');
  return data;
}

/** 멘티 상세 조회 */
export async function fetchMentee(menteeId: string): Promise<MenteeSummary | null> {
  const { data } = await axiosInstance.get<MenteeSummary>(`/mentor/mentees/${menteeId}`);
  return data;
}
