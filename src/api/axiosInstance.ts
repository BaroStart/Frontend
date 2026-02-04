import axios from 'axios';

import { useApiErrorStore } from '@/stores/useApiErrorStore';
import { useAuthStore } from '@/stores/useAuthStore';

import { API_CONFIG } from './config';

const axiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      useAuthStore.getState().logout();
    } else if (!API_CONFIG.useMock) {
      const message =
        error.response?.data?.message ??
        error.message ??
        '요청을 처리하는 중 오류가 발생했습니다.';
      useApiErrorStore.getState().setError(message, status);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
