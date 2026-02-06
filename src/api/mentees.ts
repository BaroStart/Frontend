import type { MenteeSummary } from '@/types';

import axiosInstance from './axiosInstance';

/** 담당 멘티 목록 조회 */
export async function fetchMentees(): Promise<MenteeSummary[]> {
  const { data } = await axiosInstance.get<unknown>('/mentor/mentees');
  // 백엔드 구현에 따라 배열 또는 Envelope({ result: [...] })로 내려올 수 있어 방어적으로 처리
  if (Array.isArray(data)) return data as MenteeSummary[];
  if (data && typeof data === 'object' && Array.isArray((data as any).result)) {
    return (data as any).result as MenteeSummary[];
  }
  return [];
}

/** 멘티 상세 조회 */
export async function fetchMentee(menteeId: string): Promise<MenteeSummary | null> {
  const { data } = await axiosInstance.get<unknown>(`/mentor/mentees/${menteeId}`);
  if (!data) return null;
  if (data && typeof data === 'object' && (data as any).id) return data as MenteeSummary;
  if (data && typeof data === 'object' && (data as any).result) return (data as any).result as MenteeSummary;
  return null;
}
