import type { LoginRequestDto, SignupRequestDto } from '@/generated';

import { authApi } from './clients';

// 공용 응답 래퍼 (changeTodoStatus 등 수동 axios 호출에서만 사용)
export type ApiEnvelope<T> = {
  status: number;
  code: string;
  message: string;
  result: T;
};

export async function signup(body: SignupRequestDto) {
  const { data } = await authApi.signup({ signupRequestDto: body });
  return data;
}

export async function login(body: LoginRequestDto) {
  const { data } = await authApi.login({ loginRequestDto: body });
  return data;
}

export async function refresh(token: string) {
  const { data } = await authApi.refresh({ token });
  return data;
}

export async function logout() {
  const { data } = await authApi.logout();
  return data;
}
