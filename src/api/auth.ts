import axiosInstance from './axiosInstance';

export type ApiEnvelope<T> = {
  status: number;
  code: string;
  message: string;
  result: T;
};

export type JoinType = 'MENTOR' | 'MENTEE';
export type Grade = 'FIRST' | 'SECOND' | 'THIRD';
export type SchoolType = 'NORMAL' | 'SPECIAL' | 'PRIVATE' | 'ETC';

export type SignupRequest = {
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  joinType: JoinType;
  grade: Grade;
  school: SchoolType;
  hopeMajor: string;
  university: string;
};

export type LoginRequest = {
  loginId: string;
  password: string;
};

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
};

export async function signup(body: SignupRequest): Promise<ApiEnvelope<string>> {
  const { data } = await axiosInstance.post<ApiEnvelope<string>>('/api/v1/signup', body);
  return data;
}

export async function login(body: LoginRequest): Promise<ApiEnvelope<LoginResult>> {
  const { data } = await axiosInstance.post<ApiEnvelope<LoginResult>>('/api/v1/login', body);
  return data;
}

export async function refresh(token: string): Promise<ApiEnvelope<LoginResult>> {
  const { data } = await axiosInstance.get<ApiEnvelope<LoginResult>>('/api/v1/refresh', {
    params: { token },
  });
  return data;
}

export async function logout(): Promise<ApiEnvelope<string>> {
  const { data } = await axiosInstance.get<ApiEnvelope<string>>('/api/v1/logout');
  return data;
}

