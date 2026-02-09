import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

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
  const isHome = pathname === '/mentee';
  const hideHeader = /^\/mentee\/assignments\/[^/]+$/.test(pathname);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.role !== 'mentee') return;
    markAttendance(user.id);
  }, [user?.id, user?.role]);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-background sm:max-w-lg">
      {isHome && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-brand/5 blur-3xl" />
          <div className="absolute -left-20 top-1/3 h-48 w-48 rounded-full bg-brand/3 blur-3xl" />
        </div>
      )}

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
          </div>
        </header>
      )}

      <main className="relative z-10 pb-24">
        <Outlet />
      </main>

      <TabBar />
      <BadgeCelebrationOverlay />
    </div>
  );
}
