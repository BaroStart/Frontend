import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Bell, LogOut, Menu } from 'lucide-react';

import { MOCK_NOTIFICATIONS } from '@/data/menteeDetailMock';
import { useAuthStore } from '@/stores/useAuthStore';

interface HeaderProps {
  onMenuClick?: () => void;
}

const pageTitles: Record<string, { title: string }> = {
  '/mentor': { title: '멘토 대시보드' },
  '/mentor/assignments': { title: '과제 관리' },
  '/mentor/assignments/new': { title: '과제 등록' },
  '/mentor/planner': { title: '플래너 관리' },
  '/mentor/feedback': { title: '피드백 관리' },
  '/mentor/templates': { title: '템플릿' },
};

export function Header({ onMenuClick }: HeaderProps) {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const getPageInfo = () => {
    if (location.pathname.includes('/assignments/new')) {
      return { title: '과제 등록' };
    }
    if (location.pathname.includes('/feedback/')) {
      return { title: '피드백 등록' };
    }
    if (location.pathname.startsWith('/mentor/mentees/')) {
      return { title: '멘티 상세' };
    }
    return pageTitles[location.pathname] ?? { title: '멘토 대시보드' };
  };
  const { title } = getPageInfo();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 sm:h-16 sm:px-6">
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
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {/* 알림 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationOpen((prev) => !prev);
              setProfileMenuOpen(false);
            }}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-expanded={notificationOpen}
            aria-label="알림"
          >
            <Bell size={20} />
            {MOCK_NOTIFICATIONS.length > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
            )}
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

        {/* 프로필 드롭다운 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileMenuOpen((prev) => !prev);
              setNotificationOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100"
            aria-expanded={profileMenuOpen}
            aria-label="프로필 메뉴"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-200">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-slate-600">
                  {user?.name?.charAt(0) ?? 'M'}
                </span>
              )}
            </div>
          </button>

          {profileMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setProfileMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="font-medium text-slate-900">{user?.name ?? '멘토'}</p>
                  <p className="text-xs text-slate-500">{user?.school ?? '소속 없음'}</p>
                </div>
                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <LogOut size={16} className="text-slate-400" />
                    로그아웃
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
