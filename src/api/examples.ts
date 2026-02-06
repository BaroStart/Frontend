import axiosInstance from './axiosInstance';
import type { ApiEnvelope } from './auth';

export type ExampleRes = {
  name: string;
};

export async function fetchExamples(): Promise<ApiEnvelope<ExampleRes[]>> {
  const { data } = await axiosInstance.get<ApiEnvelope<ExampleRes[]>>('/api/v1/examples');
  return data;
}

export async function fetchExampleById(id: number): Promise<ApiEnvelope<ExampleRes>> {
  const { data } = await axiosInstance.get<ApiEnvelope<ExampleRes>>(`/api/v1/examples/${id}`);
  return data;
}

