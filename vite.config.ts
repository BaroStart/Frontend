import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Vite config에서는 import.meta.env 대신 loadEnv 사용
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // 개발 중 CORS 회피용: /api -> backend 로 프록시
  const proxyTarget = env.VITE_API_URL || 'http://localhost:3000';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          // 백엔드가 self-signed/사설 인증서인 경우 대비
          secure: false,
          // 프록시 요청에 Origin이 그대로 전달되면 백엔드 CORS 필터가
          // `Invalid CORS request`로 403을 내려줄 수 있어 제거한다.
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
          },
        },
        // 멘토 서비스 API도 백엔드로 프록시
        '/mentor': {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('referer');
            });
          },
        },
      },
    },
  };
});
