import { menteeApi } from './clients';

export async function fetchMenteeInfo(menteeId: number) {
  const { data } = await menteeApi.getMenteeInfo({ menteeId });
  return data;
}
