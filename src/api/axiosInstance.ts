// NOTE: 추후 사용 예정
// import axios from 'axios';

// import { useAuthStore } from '../stores/useAuthStore';

// const axiosInstance = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,
// });

// axiosInstance.interceptors.request.use((config) => {
//   const token = useAuthStore.getState().accessToken;
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       useAuthStore.getState().logout();
//     }
//     return Promise.reject(error);
//   },
// );

// export default axiosInstance;
