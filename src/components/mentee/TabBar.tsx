import { NavLink } from 'react-router-dom';

import {
  AssignmentIcon,
  FeedbackIcon,
  HomeIcon,
  NotificationIcon,
  UserIcon,
} from '@/components/icons';

interface TabItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}

const tabs: TabItem[] = [
  { path: '/mentee', label: '홈', icon: <HomeIcon />, end: true },
  { path: '/mentee/assignments', label: '과제', icon: <AssignmentIcon /> },
  { path: '/mentee/feedback', label: '피드백', icon: <FeedbackIcon /> },
  { path: '/mentee/notifications', label: '알림', icon: <NotificationIcon /> },
  { path: '/mentee/mypage', label: 'MY', icon: <UserIcon /> },
];

export function TabBar() {
  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 border-t border-gray-100 bg-white">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 transition-colors ${
                isActive ? 'text-[#0E9ABE]' : 'text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-[#0E9ABE]' : 'text-gray-400'}>{tab.icon}</span>
                <span
                  className={`text-xs font-medium ${isActive ? 'text-[#0E9ABE]' : 'text-gray-400'}`}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
