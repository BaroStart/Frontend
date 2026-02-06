import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';
import type { User, UserRole } from '@/types/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null; // TODO: JWT 토큰용
  isAuthenticated: boolean;
  login: (role: UserRole, userId?: string) => void;
  loginWithCredentials: (id: string, password: string, role: UserRole) => boolean;
  setToken: (token: string) => void; // TODO: JWT 토큰 설정용
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
      loginWithCredentials: (id: string, password: string, role: UserRole) => {
        const account = MOCK_ACCOUNTS[id];
        if (!account || account.password !== password) return false;
        if (role === 'mentor' && account.user.role !== 'mentor') return false;
        if (role === 'mentee' && account.user.role !== 'mentee') return false;
        set({ user: account.user, isAuthenticated: true });
        return true;
      },
      setToken: (token: string) => {
        set({ accessToken: token });
      },
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: STORAGE_KEYS.AUTH,
    },
  ),
);
