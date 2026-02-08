import type { PreAuthenticatedUrlResponse } from '@/generated';

import type { ApiEnvelope } from './auth';
import { storagesApi } from './clients';

export async function getPreAuthenticatedUrl(
  fileName: string,
): Promise<ApiEnvelope<PreAuthenticatedUrlResponse>> {
  const { data } = await storagesApi.getPreAuthenticatedUrl({ fileName });
  return data as unknown as ApiEnvelope<PreAuthenticatedUrlResponse>;
}
