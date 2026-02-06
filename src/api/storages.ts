import axiosInstance from './axiosInstance';
import type { ApiEnvelope } from './auth';

export type PreAuthenticatedUrlResult = {
  url: string;
};

export async function getPreAuthenticatedUrl(fileName: string): Promise<ApiEnvelope<PreAuthenticatedUrlResult>> {
  const { data } = await axiosInstance.post<ApiEnvelope<PreAuthenticatedUrlResult>>(
    '/api/v1/storages/pre-authenticated-url',
    undefined,
    { params: { fileName } },
  );
  return data;
}

