import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  getMaterialsMeta,
  initializeSeolstudyMaterials,
  type MaterialMeta,
} from '@/lib/materialStorage';

export interface LearningGoal {
  id: string;
  mentorId: string;
  name: string;
  subject: '국어' | '영어' | '수학';
  description?: string;
  materialIds: string[];
  columnTemplate?: string;
  createdAt: string;
}

interface LearningGoalStore {
  goals: LearningGoal[];

  addGoal: (goal: Omit<LearningGoal, 'id' | 'createdAt'>) => string;
  updateGoal: (id: string, data: Partial<LearningGoal>) => void;
  deleteGoal: (id: string) => void;

  getGoalsByMentor: (mentorId: string) => LearningGoal[];
  getGoalsBySubject: (mentorId: string, subject: string) => LearningGoal[];
  getGoalById: (id: string) => LearningGoal | undefined;

  getMaterials: () => MaterialMeta[];
  getMaterialById: (id: string) => MaterialMeta | undefined;
  getMaterialsByIds: (ids: string[]) => MaterialMeta[];

  initialize: (mentorId: string) => void;
}

export const useLearningGoalStore = create<LearningGoalStore>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (goal) => {
        const id = `goal-${Date.now()}`;
        const newGoal: LearningGoal = {
          ...goal,
          id,
          createdAt: new Date().toISOString().split('T')[0],
        };
        set((state) => ({
          goals: [...state.goals, newGoal],
        }));
        return id;
      },

      updateGoal: (id, data) => {
        set((state) => ({
          goals: state.goals.map((g) => (g.id === id ? { ...g, ...data } : g)),
        }));
      },

      deleteGoal: (id) => {
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        }));
      },

      getGoalsByMentor: (mentorId) => {
        return get().goals.filter((g) => g.mentorId === mentorId);
      },

      getGoalsBySubject: (mentorId, subject) => {
        return get().goals.filter(
          (g) => g.mentorId === mentorId && (subject === '전체' || g.subject === subject),
        );
      },

      getGoalById: (id) => {
        return get().goals.find((g) => g.id === id);
      },

      getMaterials: () => {
        return getMaterialsMeta();
      },

      getMaterialById: (id) => {
        return getMaterialsMeta().find((m) => m.id === id);
      },

      getMaterialsByIds: (ids) => {
        return getMaterialsMeta().filter((m) => ids.includes(m.id));
      },

      initialize: (_mentorId) => {
        initializeSeolstudyMaterials();
      },
    }),
    {
      name: 'learning-goal-storage',
    },
  ),
);
