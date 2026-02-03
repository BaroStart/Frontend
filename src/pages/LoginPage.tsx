import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STORAGE_KEYS } from '@/constants';
import { useAuthStore } from '@/stores/useAuthStore';
import type { UserRole } from '@/types/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuthStore();
  const [role, setRole] = useState<UserRole>('mentee');
  const [id, setId] = useState('mentee01');
  const [password, setPassword] = useState('test1234');
  const [rememberId, setRememberId] = useState(() => !!localStorage.getItem(STORAGE_KEYS.SAVED_ID));
  const [error, setError] = useState('');

  useEffect(() => {
    if (rememberId && id) {
      localStorage.setItem(STORAGE_KEYS.SAVED_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SAVED_ID);
    }
  }, [rememberId, id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = loginWithCredentials(id, password, role);
    if (success) {
      navigate(role === 'mentor' ? '/mentor' : '/mentee', { replace: true });
    } else {
      setError('아이디 또는 비밀번호를 확인해주세요.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      {/* Header */}
      <img src="/logo.svg" alt="설스터디" className="h-16" />
      <h1 className="mt-3 text-2xl font-bold text-slate-800">설스터디</h1>
      <p className="mt-2 mb-10 text-slate-500">오늘도 당신의 꿈을 응원합니다</p>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Role Tabs */}
        <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => {
              setRole('mentee');
              setId('mentee01');
              setPassword('test1234');
            }}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
              role === 'mentee'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            멘티로 시작하기
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('mentor');
              setId('mentor01');
              setPassword('test1234');
            }}
            className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
              role === 'mentor'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            멘토로 관리하기
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="id">아이디</Label>
            <Input
              id="id"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={rememberId}
              onChange={(e) => setRememberId(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-600 focus:ring-slate-400"
            />
            <span className="text-sm text-slate-700">아이디 저장하기</span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full">
            로그인
          </Button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-12 text-center text-xs text-slate-400">
        계정 문의는 운영자에게 문의해주세요
      </p>
    </div>
  );
}
