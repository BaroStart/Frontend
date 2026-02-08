import type { LoginRequestDto, SignupRequestDto, TokenPairResponseDto } from '@/generated';

import { authApi } from './clients';

// 공용 응답 래퍼 (generated에 generic 없어서 유지)
export type ApiEnvelope<T> = {
  status: number;
  code: string;
  message: string;
  result: T;
};

export async function signup(body: SignupRequestDto): Promise<ApiEnvelope<string>> {
  const { data } = await authApi.signup({ signupRequestDto: body });
  return data as unknown as ApiEnvelope<string>;
}

export async function login(body: LoginRequestDto): Promise<ApiEnvelope<TokenPairResponseDto>> {
  const { data } = await authApi.login({ loginRequestDto: body });
  return data as unknown as ApiEnvelope<TokenPairResponseDto>;
}

export async function refresh(token: string): Promise<ApiEnvelope<TokenPairResponseDto>> {
  const { data } = await authApi.refresh({ token });
  return data as unknown as ApiEnvelope<TokenPairResponseDto>;
}

export async function logout(): Promise<ApiEnvelope<string>> {
  const { data } = await authApi.logout();
  return data as unknown as ApiEnvelope<string>;
}
