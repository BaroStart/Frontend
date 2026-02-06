import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getMaterialsMeta, initializeSeolstudyMaterials } from '@/lib/materialStorage';

export interface LearningGoal {
  id: string;
  mentorId: string;
  name: string;
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
  getGoalById: (id: string) => LearningGoal | undefined;

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

      getGoalById: (id) => {
        return get().goals.find((g) => g.id === id);
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

export function getMaterialsByIds(ids: string[]) {
  return getMaterialsMeta().filter((m) => ids.includes(m.id));
}
