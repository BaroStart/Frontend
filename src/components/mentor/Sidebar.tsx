import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { AssignmentIcon, FeedbackIcon, UserIcon } from '@/components/icons';
import { useMentees } from '@/hooks/useMentees';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const quickMenu: MenuItem[] = [
  {
    label: '과제 관리',
    path: '/mentor/assignments',
    icon: <AssignmentIcon className="h-[18px] w-[18px]" />,
  },
  {
    label: '피드백 관리',
    path: '/mentor/feedback',
    icon: <FeedbackIcon className="h-[18px] w-[18px]" />,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  collapsed = false,
  onToggle,
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: mentees = [] } = useMentees();
  const isDashboard = location.pathname === '/mentor';
  const pathMenteeId = location.pathname.match(/\/mentor\/mentees\/([^/]+)/)?.[1];
  // 대시보드에서는 선택된 멘티 없음, 멘티 상세 페이지에서만 선택 표시
  const selectedMenteeId = isDashboard ? null : pathMenteeId ?? null;

  const handleMenteeClick = (menteeId: string) => {
    navigate(`/mentor/mentees/${menteeId}`);
    onMobileClose?.();
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-20 flex h-screen w-60 flex-col border-r border-slate-200 bg-white shadow-lg transition-all duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:shadow-none
        ${collapsed ? 'md:w-16' : ''}`}
    >
      <div className="flex h-14 items-center justify-between px-3">
        <Link
          to="/mentor"
          onClick={() => onMobileClose?.()}
          className="flex items-center gap-2 overflow-hidden transition-colors hover:opacity-80"
        >
          <img src="/logo.svg" alt="설스터디" className="h-7 shrink-0" />
          <span
            className={`whitespace-nowrap text-lg font-bold text-slate-800 transition-all duration-300 ${
              collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            }`}
          >
            설스터디
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className="hidden h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:flex"
            title={collapsed ? '펼치기' : '접기'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
          <button
            onClick={onMobileClose}
            className="flex h-7 w-7 items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 md:hidden"
            aria-label="메뉴 닫기"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {!collapsed ? (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-3">
              <p className="text-xs font-semibold text-slate-500">멘티 목록</p>
            </div>

            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="멘티 검색..."
                  className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-slate-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="px-2">
              {mentees.map((mentee) => (
                <button
                  key={mentee.id}
                  onClick={() => handleMenteeClick(mentee.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                    selectedMenteeId === mentee.id
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      selectedMenteeId === mentee.id ? 'bg-white/25' : 'bg-slate-200'
                    }`}
                  >
                    <UserIcon
                      className={`h-4 w-4 ${
                        selectedMenteeId === mentee.id ? 'text-white' : 'text-slate-500'
                      }`}
                    />
                  </div>
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-sm font-medium ${
                          selectedMenteeId === mentee.id ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {mentee.name}
                      </span>
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          selectedMenteeId === mentee.id ? 'bg-white/80' : 'bg-slate-400'
                        }`}
                        title="활동 중"
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        selectedMenteeId === mentee.id ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {mentee.grade} · {mentee.track}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-4 px-3 py-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">메인 메뉴</p>
              <div className="space-y-1">
                {quickMenu.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => onMobileClose?.()}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span className={isActive ? 'text-white' : 'text-slate-400'}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>

          {/* 하단 진행률 */}
          <div className="border-t border-slate-200 p-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-600">이번 주 진행률</span>
                <span className="text-sm font-bold text-slate-900">73%</span>
              </div>
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full w-[73%] rounded-full bg-slate-700" />
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>완료된 피드백</span>
                  <span className="font-medium text-slate-700">22/30</span>
                </div>
                <div className="flex justify-between">
                  <span>확인한 과제</span>
                  <span className="font-medium text-slate-700">18/25</span>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <div className="space-y-2">
            {mentees.map((mentee) => (
              <button
                key={mentee.id}
                onClick={() => handleMenteeClick(mentee.id)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 transition-colors hover:bg-slate-300"
                title={`${mentee.name} (${mentee.grade} · ${mentee.track})`}
              >
                <UserIcon className="h-[18px] w-[18px] text-slate-500" />
              </button>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <div className="space-y-2">
              {quickMenu.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                    className={({ isActive }) =>
                      `flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                      }`
                    }
                  title={item.label}
                >
                  {item.icon}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      )}
    </aside>
  );
}
