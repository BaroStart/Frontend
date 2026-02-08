import type { ExampleRes } from '@/generated';

import type { ApiEnvelope } from './auth';
import { examplesApi } from './clients';

export async function fetchExamples(): Promise<ApiEnvelope<ExampleRes[]>> {
  const { data } = await examplesApi.getAll();
  return data as unknown as ApiEnvelope<ExampleRes[]>;
}

export async function fetchExampleById(id: number): Promise<ApiEnvelope<ExampleRes>> {
  const { data } = await examplesApi.getById({ id });
  return data as unknown as ApiEnvelope<ExampleRes>;
}
