import axios from 'axios';

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
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
