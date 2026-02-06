import { create } from 'zustand';

import { API_CONFIG } from '@/api/config';
import {
  changeTodoStatus,
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
  type TimeSlot,
} from '@/api/todos';
import { isApiSuccess } from '@/api/response';
import { STORAGE_KEYS } from '@/constants';

export type TodoItem = {
  id: number;
  title: string;
  done: boolean;
  timeList?: TimeSlot[];
  /** mock에서 streak/뱃지 계산용 */
  doneAt?: string; // ISO
};

type TodoState = {
  selectedDate: string; // YYYY-MM-DD (local)
  todosByDate: Record<string, TodoItem[]>; // mock용 (날짜별)
  todos: TodoItem[];
  setSelectedDate: (date: string) => Promise<void>;
  loadSelectedDate: () => Promise<void>;
  addAtTop: (title: string) => Promise<void>;
  toggleDone: (id: number, opts?: { timeList?: TimeSlot[] }) => Promise<void>;
  updateTitle: (id: number, title: string) => Promise<void>;
  remove: (id: number) => Promise<void>;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toYmdLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function isTodayKey(dateKey: string) {
  return dateKey === toYmdLocal(new Date());
}

const MOCK_TODOS_BY_DATE: Record<string, TodoItem[]> = {
  '2026-02-02': [
    { id: 1, title: '영어 듣기 연습 30분', done: false },
    { id: 2, title: '역사 교과서 읽기', done: true },
  ],
  '2026-02-03': [
    { id: 3, title: '수학 오답노트 20분', done: false },
    { id: 4, title: '국어 비문학 2지문', done: false },
  ],
  '2026-02-04': [{ id: 5, title: '영단어 50개', done: false }],
};

function readMockTodosByDate(): Record<string, TodoItem[]> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MENTEE_TODOS_BY_DATE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, TodoItem[]>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeMockTodosByDate(v: Record<string, TodoItem[]>) {
  try {
    localStorage.setItem(STORAGE_KEYS.MENTEE_TODOS_BY_DATE, JSON.stringify(v));
  } catch {
    // ignore
  }
}

export const useTodoStore = create<TodoState>((set, get) => ({
  selectedDate: API_CONFIG.useMock ? '2026-02-02' : toYmdLocal(new Date()),
  todosByDate: API_CONFIG.useMock ? readMockTodosByDate() ?? MOCK_TODOS_BY_DATE : {},
  todos: API_CONFIG.useMock ? (MOCK_TODOS_BY_DATE['2026-02-02'] ?? []) : [],

  setSelectedDate: async (date) => {
    const dateKey = date;

    if (API_CONFIG.useMock) {
      const next = get().todosByDate[dateKey] ?? [];
      set({ selectedDate: dateKey, todos: next });
      return;
    }

    // 실서버는 "오늘의 할 일"만 제공(명세 기준)이므로,
    // 오늘이 아닌 날짜를 선택하면 리스트를 비워 UX 혼란을 줄입니다.
    set({ selectedDate: dateKey, todos: [] });
    if (isTodayKey(dateKey)) {
      await get().loadSelectedDate();
    }
  },

  loadSelectedDate: async () => {
    if (API_CONFIG.useMock) return;

    const dateKey = get().selectedDate;
    if (!isTodayKey(dateKey)) {
      set({ todos: [] });
      return;
    }
    const res = await fetchTodos();
    if (!isApiSuccess(res)) return;

    const mapped: TodoItem[] = (res.result ?? []).map((t, idx) => ({
      // swagger 스키마엔 id가 없지만, 실제 서버에선 내려올 가능성이 커서 optional로 뒀음
      // id가 없으면 임시로 음수 id를 만들어 표시만 하고(수정/삭제는 동작 보장 X)
      id: typeof t.id === 'number' ? t.id : -(idx + 1),
      title: t.title,
      done: t.status === 'COMPLETED',
      timeList: t.timeList ?? undefined,
    }));

    set({ todos: mapped });
  },

  addAtTop: async (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (API_CONFIG.useMock) {
      const dateKey = get().selectedDate;
      set((s) => {
        const next = [{ id: Date.now(), title: trimmed, done: false }, ...(s.todosByDate[dateKey] ?? [])];
        const nextByDate = { ...s.todosByDate, [dateKey]: next };
        writeMockTodosByDate(nextByDate);
        return {
          todosByDate: nextByDate,
          todos: next,
        };
      });
      return;
    }

    await createTodo({ title: trimmed });
    // 생성 응답에 id가 없어서 재조회로 동기화
    await get().loadSelectedDate();
  },

  toggleDone: async (id, opts) => {
    if (API_CONFIG.useMock) {
      const dateKey = get().selectedDate;
      set((s) => {
        const cur = s.todosByDate[dateKey] ?? [];
        const nowIso = new Date().toISOString();
        const next = cur.map((t) => {
          if (t.id !== id) return t;
          const nextDone = !t.done;
          return {
            ...t,
            done: nextDone,
            timeList: opts?.timeList ?? t.timeList,
            doneAt: nextDone ? nowIso : undefined,
          };
        });
        const nextByDate = { ...s.todosByDate, [dateKey]: next };
        writeMockTodosByDate(nextByDate);
        return {
          todosByDate: nextByDate,
          todos: next,
        };
      });
      return;
    }

    if (!Number.isFinite(id) || id <= 0) return;

    const cur = useTodoStore.getState().todos.find((t) => t.id === id);
    const nextDone = !(cur?.done ?? false);
    const status = nextDone ? 'COMPLETED' : 'NOT_COMPLETED';
    const timeList = opts?.timeList ?? cur?.timeList;

    // optimistic
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, done: nextDone, timeList: timeList ?? t.timeList } : t,
      ),
    }));

    await changeTodoStatus(id, { id, status, timeList });
    await get().loadSelectedDate();
  },

  updateTitle: async (id, title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (API_CONFIG.useMock) {
      const dateKey = get().selectedDate;
      set((s) => {
        const cur = s.todosByDate[dateKey] ?? [];
        const next = cur.map((t) => (t.id === id ? { ...t, title: trimmed } : t));
        const nextByDate = { ...s.todosByDate, [dateKey]: next };
        writeMockTodosByDate(nextByDate);
        return {
          todosByDate: nextByDate,
          todos: next,
        };
      });
      return;
    }

    if (!Number.isFinite(id) || id <= 0) return;

    const cur = useTodoStore.getState().todos.find((t) => t.id === id);
    const timeList = cur?.timeList;

    // optimistic
    set((s) => ({
      todos: s.todos.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
    }));

    await updateTodo({ id, title: trimmed, timeList });
    await get().loadSelectedDate();
  },

  remove: async (id) => {
    if (API_CONFIG.useMock) {
      const dateKey = get().selectedDate;
      set((s) => {
        const cur = s.todosByDate[dateKey] ?? [];
        const next = cur.filter((t) => t.id !== id);
        const nextByDate = { ...s.todosByDate, [dateKey]: next };
        writeMockTodosByDate(nextByDate);
        return {
          todosByDate: nextByDate,
          todos: next,
        };
      });
      return;
    }

    if (!Number.isFinite(id) || id <= 0) return;

    // optimistic
    set((s) => ({ todos: s.todos.filter((t) => t.id !== id) }));
    await deleteTodo(id);
    await get().loadSelectedDate();
  },
}));
