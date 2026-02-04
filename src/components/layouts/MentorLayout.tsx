import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '@/components/mentor/Header';
import { Sidebar } from '@/components/mentor/Sidebar';

export function MentorLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  const handleMobileSidebarToggle = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 모바일: 오버레이 / 데스크톱: 고정 사이드바 */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleToggleSidebar}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* 모바일: 전체 너비 / 데스크톱: 사이드바 너비만큼 margin */}
      <div
        className={`min-w-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-60'}`}
      >
        <Header onMenuClick={handleMobileSidebarToggle} />

        <main className="min-w-0 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      {/* 모바일 사이드바 오버레이 배경 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[15] bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
