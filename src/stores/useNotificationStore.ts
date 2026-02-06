import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';

export type NotificationType = 'reminder' | 'feedback' | 'system';

export type NotificationItem = {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  link?: string;
};

type NotificationState = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: number) => void;
  upsertMany: (items: NotificationItem[]) => void;
};

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 1,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '방금 전',
    isRead: false,
    link: '/mentee/feedback',
  },
  {
    id: 2,
    type: 'reminder',
    title: '미완료 과제 알림',
    message: '어제 마감된 [국어 - 고전시가] 과제가 제출되지 않았습니다.',
    time: '1일 전',
    isRead: false,
    link: '/mentee/assignments',
  },
  {
    id: 3,
    type: 'reminder',
    title: '미완료 과제 알림',
    message: '어제 마감된 [국어 - 고전시가] 과제가 제출되지 않았습니다.',
    time: '1일 전',
    isRead: false,
    link: '/mentee/assignments',
  },
  {
    id: 4,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
    link: '/mentee/feedback',
  },
  {
    id: 5,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
    link: '/mentee/feedback',
  },
  {
    id: 6,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
    link: '/mentee/feedback',
  },
  {
    id: 7,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
    link: '/mentee/feedback',
  },
  {
    id: 8,
    type: 'feedback',
    title: '새로운 피드백 도착',
    message: '김민준 멘토님이 [영어 독해 - 주제문 찾기] 과제에 피드백을 남겼습니다.',
    time: '2일 전',
    isRead: true,
    link: '/mentee/feedback',
  },
];

function computeUnreadCount(items: NotificationItem[]) {
  return items.reduce((sum, n) => sum + (n.isRead ? 0 : 1), 0);
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: INITIAL_NOTIFICATIONS,
      unreadCount: computeUnreadCount(INITIAL_NOTIFICATIONS),
      markAllRead: () => {
        const next = get().notifications.map((n) => ({ ...n, isRead: true }));
        set({ notifications: next, unreadCount: 0 });
      },
      markRead: (id) => {
        const next = get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        set({ notifications: next, unreadCount: computeUnreadCount(next) });
      },
      upsertMany: (items) => {
        const byId = new Map(get().notifications.map((n) => [n.id, n] as const));
        for (const item of items) {
          byId.set(item.id, item);
        }
        const next = Array.from(byId.values()).sort((a, b) => b.id - a.id);
        set({ notifications: next, unreadCount: computeUnreadCount(next) });
      },
    }),
    {
      name: STORAGE_KEYS.NOTIFICATIONS,
      partialize: (state) => ({ notifications: state.notifications }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // persist된 notifications만 복원되므로 unreadCount를 재계산
        state.unreadCount = computeUnreadCount(state.notifications);
      },
    },
  ),
);

