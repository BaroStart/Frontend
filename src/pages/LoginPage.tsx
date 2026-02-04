import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RoleTabs } from '@/components/ui/RoleTabs';
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

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setId(newRole === 'mentor' ? 'mentor01' : 'mentee01');
    setPassword('test1234');
  };

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 py-8 sm:px-6 sm:py-12">
      <img src="/logo.svg" alt="설스터디" className="h-14 sm:h-16" />
      <h1 className="mt-3 text-xl font-bold text-slate-800 sm:text-2xl">설스터디</h1>
      <p className="mt-2 mb-8 text-slate-500 sm:mb-10">오늘도 당신의 꿈을 응원합니다</p>

      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <RoleTabs value={role} onChange={handleRoleChange} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="id"
            label="아이디"
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="아이디를 입력하세요"
            autoComplete="username"
          />

          <Input
            id="password"
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />

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

      <p className="mt-12 text-center text-xs text-slate-400">
        계정 문의는 운영자에게 문의해주세요
      </p>
    </div>
  );
}
