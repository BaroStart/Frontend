/**
 * API 타입 래퍼
 * 사용법: import type { ExampleRes, ApiResponse } from '@/types/api';
 */
import type { components } from './api.generated';

type Schemas = components['schemas'];

export type ExampleRes = Schemas['ExampleRes'];
export type PreAuthenticatedUrlResponse = Schemas['PreAuthenticatedUrlResponse'];

export type ApiResponse<T> = {
  status: number;
  code: string;
  message: string;
  result: T;
};

export type { Schemas };
