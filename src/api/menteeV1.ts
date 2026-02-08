import type { GetMenteeInfoResponseDto } from '@/generated';

import type { ApiEnvelope } from './auth';
import { menteeApi } from './clients';

export type GetMenteeInfoResult = GetMenteeInfoResponseDto;

export async function fetchMenteeInfo(menteeId: number): Promise<ApiEnvelope<GetMenteeInfoResult>> {
  const { data } = await menteeApi.getMenteeInfo({ menteeId });
  return data as unknown as ApiEnvelope<GetMenteeInfoResult>;
}
