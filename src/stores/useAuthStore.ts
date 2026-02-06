import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { API_CONFIG } from '@/api/config';
import { login as loginApi } from '@/api/auth';
import { isApiSuccess } from '@/api/response';
import { STORAGE_KEYS } from '@/constants';
import type { User, UserRole } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null; // TODO: JWT 토큰용
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (role: UserRole, userId?: string) => void;
  loginWithCredentials: (id: string, password: string, role: UserRole) => Promise<boolean>;
  setToken: (token: string) => void; // TODO: JWT 토큰 설정용
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  setProfileImage: (url: string | null) => void;
  logout: () => void;
}

// MVP 테스트용: mentee01, mentee02, mentor01 / PW: test1234
const MOCK_ACCOUNTS: Record<string, { user: User; password: string }> = {
  mentee01: {
    user: { id: 's1', name: '멘티1', role: 'mentee', school: 'OO고' },
    password: 'test1234',
  },
  mentee02: {
    user: { id: 's2', name: '멘티2', role: 'mentee', school: 'OO고' },
    password: 'test1234',
  },
  mentor01: {
    user: {
      id: 'm1',
      name: '김멘토',
      role: 'mentor',
      school: '서울대학교 의과대학',
      subject: '국어' as const,
    },
    password: 'test1234',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (role: UserRole, userId?: string) => {
        if (role === 'mentor') {
          set({ user: MOCK_ACCOUNTS.mentor01.user, isAuthenticated: true });
        } else {
          const mentee =
            userId === 's2' ? MOCK_ACCOUNTS.mentee02.user : MOCK_ACCOUNTS.mentee01.user;
          set({ user: mentee, isAuthenticated: true });
        }
      },
      loginWithCredentials: async (id: string, password: string, role: UserRole) => {
        const loginId = id.trim();
        // 전체 기능은 mock이어도, Auth만 실 API로 붙일 수 있게 분리
        if (API_CONFIG.useMockAuth) {
          const account = MOCK_ACCOUNTS[loginId];
          if (!account || account.password !== password) return false;
          if (role === 'mentor' && account.user.role !== 'mentor') return false;
          if (role === 'mentee' && account.user.role !== 'mentee') return false;
          set({ user: account.user, isAuthenticated: true });
          return true;
        }

        try {
          // 백엔드 로그인
          const res = await loginApi({ loginId, password });
          if (!isApiSuccess(res) || !res.result?.accessToken) return false;

          // 백엔드 응답에 user 정보가 없어서, 최소 정보로 유지 (추후 /me 같은 API로 대체 가능)
          // 회원가입에서 저장해 둔 (loginId -> name) 매핑이 있으면 그 값을 사용
          let displayName = loginId;
          try {
            const raw = localStorage.getItem(STORAGE_KEYS.SIGNUP_NAME_BY_LOGIN_ID);
            const map = raw ? (JSON.parse(raw) as Record<string, string>) : null;
            if (map?.[loginId]) displayName = map[loginId];
          } catch {
            // ignore
          }

          set({
            accessToken: res.result.accessToken,
            refreshToken: res.result.refreshToken ?? null,
            user: { id: loginId, name: displayName, role },
            isAuthenticated: true,
          });

          return true;
        } catch {
          // 4xx/5xx는 axios가 throw하므로, 화면이 죽지 않게 false로 처리
          return false;
        }
      },
      setToken: (token: string) => {
        set({ accessToken: token });
      },
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },
      setProfileImage: (url) => {
        set((s) => (s.user ? { user: { ...s.user, profileImage: url ?? undefined } } : s));
      },
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false }),
    }),
    {
      name: STORAGE_KEYS.AUTH,
    },
  ),
);
