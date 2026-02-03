import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../stores/useAuthStore';

export function MenteeLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white shadow-sm md:shadow-lg">
      <header className="sticky top-0 z-10 border-b bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <NavLink to="/mentee" className="flex items-center gap-2">
            <img src="/logo.svg" alt="설스터디" className="h-7" />
            <span className="text-lg font-bold text-slate-800">설스터디</span>
          </NavLink>
          <div className="flex items-center gap-2">
            <NavLink
              to="/mentee/notifications"
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </NavLink>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-slate-100"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t bg-white">
        <div className="flex h-16 items-center justify-around">
          <NavLink
            to="/mentee"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400'}`
            }
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-xs">홈</span>
          </NavLink>
          <NavLink
            to="/mentee/assignments"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400'}`
            }
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="text-xs">과제</span>
          </NavLink>
          <NavLink
            to="/mentee/feedback"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400'}`
            }
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <span className="text-xs">피드백</span>
          </NavLink>
          <NavLink
            to="/mentee/mypage"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 ${isActive ? 'text-slate-900' : 'text-slate-400'}`
            }
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="text-xs">MY</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
