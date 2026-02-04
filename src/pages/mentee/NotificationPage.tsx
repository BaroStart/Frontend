import { Bell, Clock, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';

type NotificationType = 'reminder' | 'feedback' | 'system';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
}

// --- Mock Data ---
const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '방금 전',
    isRead: false,
  },
  {
    id: 2,
    type: 'reminder',
    title: '미완료 과제 알림',
    message: '어제 마감된 [국어 - 고전시가] 과제가 제출되지 않았습니다.',
    time: '1일 전',
    isRead: false,
  },
  {
    id: 3,
    type: 'reminder',
    title: '미완료 과제 알림',
    message: '어제 마감된 [국어 - 고전시가] 과제가 제출되지 않았습니다.',
    time: '1일 전',
    isRead: false,
  },
  {
    id: 4,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
  },
  {
    id: 4,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
  },
  {
    id: 4,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
  },
  {
    id: 4,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
  },
  {
    id: 4,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
  },
];

export default function NotificationPage() {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'feedback':
        return <MessageSquare className="w-5 h-5 text-white" />;
      case 'reminder':
        return <Clock className="w-5 h-5 text-white" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'feedback':
        return 'bg-[#0E9ABE]';
      case 'reminder':
        return 'bg-rose-500';
    }
  };

  return (
    <div className="w-full">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
        <h1 className="text-xl font-bold text-slate-900">알림</h1>
        <button className="text-xs font-bold text-slate-400 hover:text-slate-600">모두 읽음</button>
      </header>

      {/* 알림 리스트 */}
      <div className="px-6">
        {NOTIFICATIONS.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {NOTIFICATIONS.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'py-5 flex gap-4 group cursor-pointer transition-colors hover:bg-slate-50/50 -mx-6 px-6',
                  !item.isRead && 'bg-blue-50/30',
                )}
              >
                {/* 아이콘 */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm',
                    getIconBg(item.type),
                  )}
                >
                  {getIcon(item.type)}
                </div>

                {/* 텍스트 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3
                      className={cn(
                        'text-sm mb-0.5 truncate pr-2',
                        item.isRead ? 'text-slate-700 font-semibold' : 'text-slate-900 font-bold',
                      )}
                    >
                      {item.title}
                    </h3>
                    <span className="flex-shrink-0 text-xs text-slate-400 whitespace-nowrap">
                      {item.time}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm leading-relaxed line-clamp-2',
                      item.isRead ? 'text-slate-500' : 'text-slate-600 font-medium',
                    )}
                  >
                    {item.message}
                  </p>
                </div>

                {/* 읽지 않은 알림 표시 */}
                <div className="flex flex-col items-center justify-center">
                  {!item.isRead && <div className="w-2 h-2 bg-[#0E9ABE] rounded-full mb-2"></div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-50 text-slate-300">
              <Bell className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium text-slate-500">새로운 알림이 없습니다.</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="px-5 py-6 mt-4 text-center border-t bg-slate-50 border-slate-100">
        <p className="text-xs text-slate-400">최근 30일 동안의 알림만 보관됩니다.</p>
      </div>
    </div>
  );
}
