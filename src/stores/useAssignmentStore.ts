import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { STORAGE_KEYS } from '@/constants';
import type { IncompleteAssignment, MenteeTask } from '@/types';

/**
 * 과제 등록 시 Mock 모드에서 메모리/로컬스토리지에 저장.
 * 백엔드 연동 시 API가 소스가 되며 이 store는 Mock 모드에서만 사용됨.
 */
interface AssignmentStoreState {
  /** 등록된 학습 일정 (캘린더/To-Do) */
  registeredTasks: MenteeTask[];
  /** 등록된 미완료 과제 */
  registeredIncomplete: IncompleteAssignment[];
  addTasks: (tasks: MenteeTask[]) => void;
  addIncomplete: (assignments: IncompleteAssignment[]) => void;
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useAssignmentStore = create<AssignmentStoreState>()(
  persist(
    (set) => ({
      registeredTasks: [],
      registeredIncomplete: [],
      addTasks: (tasks) =>
        set((s) => ({
          registeredTasks: [...s.registeredTasks, ...tasks],
        })),
      addIncomplete: (assignments) =>
        set((s) => ({
          registeredIncomplete: [...s.registeredIncomplete, ...assignments],
        })),
    }),
    { name: STORAGE_KEYS.ASSIGNMENTS }
  ),
);
