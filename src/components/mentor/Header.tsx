import { useLocation, useNavigate } from 'react-router-dom';

import { Bell, LogOut, Menu } from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';

interface HeaderProps {
  onMenuClick?: () => void;
}

const pageTitles: Record<string, string> = {
  '/mentor': '멘토 대시보드',
  '/mentor/assignments': '과제 관리',
  '/mentor/feedback': '피드백 관리',
  '/mentor/materials': '자료 관리',
  '/mentor/templates': '템플릿',
};

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();
  const getTitle = () => {
    if (location.pathname.startsWith('/mentor/mentees/')) return '멘티 상세';
    return pageTitles[location.pathname] ?? '멘토 대시보드';
  };
  const title = getTitle();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 오늘 날짜 포맷팅
  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 sm:h-16 sm:px-6">
      {/* 왼쪽: 햄버거(모바일) + 페이지 제목 + 날짜 */}
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
          <span className="hidden text-sm text-slate-500 sm:inline">{formattedDate}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell size={20} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="h-8 w-px bg-slate-200" />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{user?.name ?? '멘토'}</p>
            <p className="text-xs text-slate-500">{user?.school ?? '소속 없음'}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-200">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-slate-600">
                {user?.name?.charAt(0) ?? 'M'}
              </span>
            )}
          </div>
        </div>

        {/* 로그아웃 버튼 */}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title="로그아웃"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
