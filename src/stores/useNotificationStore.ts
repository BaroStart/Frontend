import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { API_CONFIG } from '@/api/config';
import { fetchRecentNotifications, markNotificationRead } from '@/api/notifications';
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
  /** 알림에 해당하는 날짜 (YYYY-MM-DD). 클릭 시 해당 날짜로 이동 */
  dateAt?: string;
};

/** Mock 모드/API 실패 시 개발용 샘플 알림 */
const FALLBACK_MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, type: 'feedback', title: '피드백', message: '김멘토 멘토님이 국어 과제에 피드백을 남겼어요.', time: '5분 전', isRead: false },
  { id: 2, type: 'reminder', title: '과제', message: '수학 과제 제출 마감이 3시간 남았어요.', time: '1시간 전', isRead: false },
  { id: 3, type: 'system', title: '알림', message: '이번 주 학습 목표 80% 달성했어요!', time: '어제', isRead: true },
];

type NotificationState = {
  notifications: NotificationItem[];
  unreadCount: number;
  loadNotifications: () => Promise<void>;
  markAllRead: () => void;
  markRead: (id: number) => void;
  upsertMany: (items: NotificationItem[]) => void;
};

function computeUnreadCount(items: NotificationItem[]) {
  return items.reduce((sum, n) => sum + (n.isRead ? 0 : 1), 0);
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      loadNotifications: async () => {
        try {
          const items = await fetchRecentNotifications();
          const useFallback = items.length === 0 && API_CONFIG.useMock;
          const final = useFallback ? FALLBACK_MOCK_NOTIFICATIONS : items;
          set({ notifications: final, unreadCount: computeUnreadCount(final) });
        } catch {
          if (API_CONFIG.useMock || get().notifications.length === 0) {
            set({ notifications: FALLBACK_MOCK_NOTIFICATIONS, unreadCount: computeUnreadCount(FALLBACK_MOCK_NOTIFICATIONS) });
          }
        }
      },
      markAllRead: () => {
        const unreadIds = get().notifications.filter((n) => !n.isRead).map((n) => n.id);
        const next = get().notifications.map((n) => ({ ...n, isRead: true }));
        set({ notifications: next, unreadCount: 0 });
        // 서버에도 읽음 처리
        for (const id of unreadIds) {
          markNotificationRead(id).catch(() => {});
        }
      },
      markRead: (id) => {
        const next = get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
        set({ notifications: next, unreadCount: computeUnreadCount(next) });
        markNotificationRead(id).catch(() => {});
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
        state.unreadCount = computeUnreadCount(state.notifications);
      },
    },
  ),
);
