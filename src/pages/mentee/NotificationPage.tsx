import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Bell, Clock, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  useNotificationStore,
  type NotificationItem,
  type NotificationType,
} from '@/stores/useNotificationStore';

function getTimeGroupKey(time: string): 'today' | 'yesterday' | 'older' {
  if (time === '방금 전' || /\d+분 전/.test(time) || /\d+시간 전/.test(time)) return 'today';
  if (time === '1일 전') return 'yesterday';
  return 'older';
}

const TIME_GROUP_LABELS: Record<string, string> = {
  today: '오늘',
  yesterday: '어제',
  older: '이전',
};

function groupByTime(items: NotificationItem[]) {
  const groups: Record<string, NotificationItem[]> = { today: [], yesterday: [], older: [] };
  for (const item of items) {
    const key = getTimeGroupKey(item.time);
    groups[key].push(item);
  }
  return groups;
}

/** 인스타그램 스타일: 단순한 outline 아이콘, 얇은 stroke */
function getIcon(type: NotificationType) {
  const iconClass = 'h-5 w-5 text-slate-400 stroke-[1.5]';
  switch (type) {
    case 'feedback':
      return <MessageSquare className={iconClass} />;
    case 'reminder':
      return <Clock className={iconClass} />;
    case 'system':
      return <Bell className={iconClass} />;
  }
}

/** 발신자/액터명 추출 - 인스타 알림처럼 "누가" */
function getActorName(item: NotificationItem): string {
  if (item.type === 'feedback') {
    const m = item.message.match(/([가-힣]+)\s*멘토/);
    return m ? m[1] : '멘토';
  }
  if (item.type === 'reminder') return '과제 알림';
  return '시스템';
}

export function NotificationPage() {
  const navigate = useNavigate();
  const { notifications, markAllRead, markRead } = useNotificationStore();

  const grouped = useMemo(() => groupByTime(notifications), [notifications]);

  const hasNotifications = notifications.length > 0;

  return (
    <div className="flex h-full flex-col bg-white px-4 pt-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">알림</h1>
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-semibold text-slate-600 hover:text-slate-900"
        >
          모두 읽음
        </button>
      </header>

      <div className="flex-1 space-y-8 pb-20">
        {hasNotifications ? (
          <>
            {(['today', 'yesterday', 'older'] as const).map((groupKey) => {
              const items = grouped[groupKey];
              if (items.length === 0) return null;

              return (
                <section key={groupKey}>
                  <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    {TIME_GROUP_LABELS[groupKey]}
                  </h2>
                  <ul className="space-y-0">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => {
                            markRead(item.id);
                            if (item.dateAt) {
                              navigate(`/mentee?date=${item.dateAt}`);
                            } else if (item.link) {
                              navigate(item.link);
                            }
                          }}
                          className={cn(
                            'flex w-full items-start gap-4 py-4 text-left transition-colors',
                            'border-b border-slate-100 last:border-b-0',
                            item.isRead ? 'opacity-80' : 'bg-white',
                            'hover:bg-slate-50',
                          )}
                        >
                          {/* 프로필 이미지 영역 - 인스타 댓글처럼 원형 */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                            {getIcon(item.type)}
                          </div>

                          {/* 텍스트 영역: 이름 → 내용 → 보조정보 */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={cn(
                                  'text-sm font-semibold text-slate-900',
                                  item.isRead && 'font-medium text-slate-600',
                                )}
                              >
                                {getActorName(item)}
                              </span>
                              <span className="shrink-0 text-xs text-slate-400">{item.time}</span>
                            </div>
                            <p
                              className={cn(
                                'mt-0.5 line-clamp-2 text-sm leading-relaxed',
                                item.isRead ? 'text-slate-500' : 'text-slate-700',
                              )}
                            >
                              {item.message}
                            </p>
                          </div>

                          {/* 읽지 않음 표시 - 미니멀한 점 */}
                          {!item.isRead && (
                            <span
                              className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-slate-400"
                              aria-label="읽지 않음"
                            />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white border border-slate-100">
              <Bell className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
            </div>
            <p className="text-base font-medium text-slate-600">새로운 알림이 없어요</p>
            <p className="mt-1 text-sm text-slate-400">오늘은 조용한 하루네요</p>
          </div>
        )}

        {hasNotifications && (
          <p className="text-center text-xs text-slate-400">최근 30일 동안의 알림만 보관됩니다.</p>
        )}
      </div>
    </div>
  );
}
