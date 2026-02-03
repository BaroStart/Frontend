import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from '@/components/mentor/Header';
import { Sidebar } from '@/components/mentor/Sidebar';

export function MentorLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
        <Header />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
