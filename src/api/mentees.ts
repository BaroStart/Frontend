import { MOCK_MENTEES } from '@/data/mockMentees';
import type { MenteeSummary } from '@/types';

// TODO: 백엔드 멘티 목록/상세 API 구현 후 실 API 연동
// 현재 /mentor/mentees 엔드포인트가 백엔드에 없으므로 mock 데이터 사용

/** 담당 멘티 목록 조회 */
export async function fetchMentees(): Promise<MenteeSummary[]> {
  return MOCK_MENTEES;
}

/** 멘티 상세 조회 */
export async function fetchMentee(menteeId: string): Promise<MenteeSummary | null> {
  return MOCK_MENTEES.find((m) => m.id === menteeId) ?? null;
}
