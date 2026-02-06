import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { TabBar } from '@/components/mentee/TabBar';

export function MenteeLayout() {
  const { pathname } = useLocation();

  const hideHeader =
    /^\/mentee\/assignments\/[^/]+$/.test(pathname); 

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-white shadow-sm sm:max-w-lg md:shadow-lg">
      {!hideHeader && (
        <header className="sticky top-0 z-10 border-b border-gray-100 bg-white">
          <div className="flex h-14 items-center justify-between px-4">
            <NavLink to="/mentee" className="flex items-center gap-2">
              <img src="/logo.svg" alt="설스터디" className="h-7" />
              <span className="text-lg font-bold text-gray-900">설스터디</span>
            </NavLink>
          </div>
        </header>
      )}

      <main className="pb-20">
        <Outlet />
      </main>

      <TabBar />
    </div>
  );
}
