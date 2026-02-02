import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import type { UserRole } from '../types/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const { loginWithCredentials } = useAuthStore();
  const [role, setRole] = useState<UserRole>('mentee');
  const [id, setId] = useState(() => localStorage.getItem('savedId') ?? '');
  const [password, setPassword] = useState('');
  const [rememberId, setRememberId] = useState(() => !!localStorage.getItem('savedId'));
  const [error, setError] = useState('');

  useEffect(() => {
    if (rememberId && id) {
      localStorage.setItem('savedId', id);
    } else {
      localStorage.removeItem('savedId');
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
      <h1 className="mb-2 text-3xl font-bold text-slate-800">설스터디</h1>
      <p className="mb-12 text-slate-500">오늘도 당신의 꿈을 응원합니다</p>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        {/* Role Tabs */}
        <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRole('mentee')}
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
            onClick={() => setRole('mentor')}
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
          <div>
            <label htmlFor="id" className="mb-1.5 block text-sm font-medium text-slate-700">
              아이디
            </label>
            <input
              id="id"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="아이디를 입력하세요"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
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

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-700 py-3.5 font-semibold text-white transition hover:bg-slate-800"
          >
            로그인
          </button>
        </form>
      </div>

      {/* Test Accounts */}
      <div className="mt-8 w-full max-w-md space-y-3 text-center">
        <p className="text-sm text-slate-500">테스트 계정으로 접속 가능합니다</p>
        <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4 text-left">
          <p className="mb-2 text-sm font-medium text-slate-600">멘티 계정</p>
          <p className="text-sm text-slate-500">ID: mentee01 / PW: test1234</p>
          <p className="text-sm text-slate-500">ID: mentee02 / PW: test1234</p>
          <p className="mt-3 text-sm font-medium text-slate-600">멘토 계정</p>
          <p className="text-sm text-slate-500">ID: mentor01 / PW: test1234</p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-12 text-center text-xs text-slate-400">
        계정 문의는 운영자에게 문의해주세요
      </p>
    </div>
  );
}
