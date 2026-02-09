import { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';

import { BadgeCelebrationOverlay } from '@/components/mentee/my/BadgeCelebrationOverlay';
import { TabBar } from '@/components/mentee/TabBar';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useSSE } from '@/hooks/useSSE';
import { markAttendance } from '@/lib/menteeActivityStorage';
import { useAuthStore } from '@/stores/useAuthStore';

export function MenteeLayout() {
  useDocumentTitle('설스터디 | 멘티 페이지');
  useSSE();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const hideHeader = /^\/mentee\/assignments\/[^/]+$/.test(pathname);
  const isMyPage = pathname === '/mentee/mypage';
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'mentee') return;
    markAttendance(user.id);
  }, [user?.id, user?.role]);

  return (
    <div className="min-h-screen bg-white sm:bg-[linear-gradient(165deg,#f8fafc_0%,#ffffff_35%,#f0f9ff_70%,#e0f2fe_100%)]">
      <div className="relative mx-auto min-h-screen w-full max-w-md bg-white sm:max-w-lg sm:shadow-xl sm:shadow-slate-200/20">
        {!hideHeader && (
          <header className="sticky top-0 z-40 border-b border-border/50 bg-white/70 backdrop-blur-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <NavLink to="/mentee" className="flex items-center gap-1">
                <img
                  src="/logo.svg"
                  alt="SeolStudy"
                  className="h-6 w-6 shrink-0 rounded-lg object-contain"
                />
                <span className="font-plus-jakarta text-base font-bold tracking-tight text-foreground">
                  SeolStudy
                </span>
              </NavLink>
              {isMyPage && (
                <button
                  type="button"
                  onClick={() => navigate('/mentee/mypage/settings')}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
                  aria-label="설정"
                >
                  <Settings className="h-5 w-5" strokeWidth={2} />
                </button>
              )}
            </div>
          </header>
        )}

        <main className="relative z-10 pb-24">
          <Outlet />
        </main>

        <TabBar />
        <BadgeCelebrationOverlay />
      </div>
    </div>
  );
}
