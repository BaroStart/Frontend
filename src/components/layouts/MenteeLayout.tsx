import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

export function MenteeLayout() {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-amber-50/50 md:max-w-lg md:mx-auto md:shadow-lg">
      <header className="sticky top-0 z-10 border-b bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <Link to="/mentee" className="text-lg font-semibold text-slate-800">
            설스터디
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/mentee/mypage"
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              aria-label="마이페이지"
            >
              <span className="text-lg">👤</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md px-2 py-1 text-sm text-slate-600"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>
      <main className="pb-20">
        <Outlet />
      </main>
    </div>
  );
}
