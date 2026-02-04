import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Bell, LogOut, Menu } from 'lucide-react';

import { useAuthStore } from '@/stores/useAuthStore';

interface HeaderProps {
  onMenuClick?: () => void;
}

const MOCK_NOTIFICATIONS = [
  { id: '1', title: '피드백 작성 필요', message: '박지민님이 영어 독해 과제를 제출했습니다.', time: '10분 전' },
  { id: '2', title: '새 과제 제출', message: '이서연님이 수학 미적분 과제를 제출했습니다.', time: '1시간 전' },
  { id: '3', title: '학습 인증 업로드', message: '박지민님이 오늘의 학습 인증을 업로드했습니다.', time: '2시간 전' },
];

const pageTitles: Record<string, string> = {
  '/mentor': '멘토 대시보드',
  '/mentor/assignments': '과제 관리',
  '/mentor/feedback': '피드백 관리',
  '/mentor/materials': '자료 관리',
  '/mentor/templates': '템플릿',
};

export function Header({ onMenuClick }: HeaderProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationOpen((prev) => !prev)}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-expanded={notificationOpen}
            aria-label="알림"
          >
            <Bell size={20} />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>
          {notificationOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setNotificationOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-slate-900">알림</h3>
                <p className="text-xs text-slate-500">최근 알림을 확인하세요</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {MOCK_NOTIFICATIONS.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">알림이 없습니다.</p>
                ) : (
                  MOCK_NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className="border-b border-slate-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-slate-50"
                    >
                      <p className="text-sm font-medium text-slate-900">{n.title}</p>
                      <p className="mt-0.5 text-xs text-slate-600">{n.message}</p>
                      <p className="mt-1 text-xs text-slate-400">{n.time}</p>
                    </div>
                  ))
                )}
              </div>
              </div>
            </>
          )}
        </div>

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
