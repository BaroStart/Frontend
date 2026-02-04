/**
 * API 설정
 * - VITE_USE_MOCK: 'true'면 mock 데이터 사용 (기본값)
 * - VITE_API_URL: 백엔드 API 베이스 URL
 */
export const API_CONFIG = {
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  baseURL: import.meta.env.VITE_API_URL ?? '',
} as const;
