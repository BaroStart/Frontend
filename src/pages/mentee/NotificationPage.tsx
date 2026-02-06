import { useNavigate } from 'react-router-dom';

import { Bell, Clock, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useNotificationStore, type NotificationType } from '@/stores/useNotificationStore';

export function NotificationPage() {
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead } = useNotificationStore();

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'feedback':
        return <MessageSquare className="h-5 w-5 text-[#0E9ABE]" />;
      case 'reminder':
        return <Clock className="h-5 w-5 text-rose-500" />;
      case 'system':
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case 'feedback':
        return 'bg-[#0E9ABE]/10';
      case 'reminder':
        return 'bg-rose-500/10';
      case 'system':
        return 'bg-slate-200/60';
    }
  };

  return (
    <div className="flex h-full flex-col bg-white px-4 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="ml-1 text-xl font-extrabold tracking-tight text-slate-900">알림</h1>
        <button
          type="button"
          onClick={markAllRead}
          className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700"
        >
          모두 읽음
        </button>
      </header>

      <div className="flex-1 space-y-3 pb-20">
        {notifications.length > 0 ? (
          notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                markRead(item.id);
                if (item.link) navigate(item.link);
              }}
              className={cn(
                'group w-full rounded-2xl border bg-white px-4 py-3.5 text-left shadow-sm transition-all duration-200 hover:shadow-md',
                item.isRead
                  ? 'border-gray-100 hover:bg-gray-50'
                  : 'border-[#0E9ABE]/25 bg-[#0E9ABE]/[0.05] hover:bg-[#0E9ABE]/[0.08]',
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                    getIconBg(item.type),
                  )}
                >
                  {getIcon(item.type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3
                      className={cn(
                        'truncate pr-2 text-sm leading-5',
                        item.isRead ? 'font-semibold text-slate-700' : 'font-extrabold text-slate-900',
                      )}
                    >
                      {item.title}
                    </h3>

                    <div className="flex items-center gap-2">
                      {!item.isRead && <span className="h-2 w-2 rounded-full bg-[#0E9ABE]" aria-label="안 읽음" />}
                      <span className="whitespace-nowrap text-xs text-slate-400">{item.time}</span>
                    </div>
                  </div>

                  <p
                    className={cn(
                      'mt-1.5 line-clamp-2 text-sm leading-relaxed',
                      item.isRead ? 'text-slate-500' : 'font-medium text-slate-700',
                    )}
                  >
                    {item.message}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
              <Bell className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium text-gray-500">새로운 알림이 없습니다.</p>
            <p className="mt-1 text-sm text-gray-400">오늘은 조용한 하루네요!</p>
          </div>
        )}

        <div className="pt-2 text-center">
          <p className="text-xs text-slate-400">최근 30일 동안의 알림만 보관됩니다.</p>
        </div>
      </div>
    </div>
  );
}
