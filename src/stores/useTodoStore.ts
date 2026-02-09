import { create } from 'zustand';

import { API_CONFIG } from '@/api/config';
import { isApiSuccess } from '@/api/response';
import { changeTodoStatus, createTodo, deleteTodo, fetchTodos, updateTodo } from '@/api/todos';
import { toast } from '@/components/ui/Toast';
import { STORAGE_KEYS } from '@/constants';
import type { ToDoRes } from '@/generated';

type TimeSlot = { startTime: string; endTime: string };

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
  todosByDate: API_CONFIG.useMock ? (readMockTodosByDate() ?? MOCK_TODOS_BY_DATE) : {},
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
      try {
        await get().loadSelectedDate();
      } catch {
        const fromLocal = readMockTodosByDate();
        const forDate = fromLocal?.[dateKey] ?? [];
        set({ todos: forDate });
      }
    }
  },

  loadSelectedDate: async () => {
    if (API_CONFIG.useMock) return;

    const dateKey = get().selectedDate;
    if (!isTodayKey(dateKey)) {
      set({ todos: [] });
      return;
    }
    try {
      const res = await fetchTodos();
      if (!isApiSuccess(res)) {
        set({ todos: [] });
        return;
      }

      const items = (res.result ?? []) as (ToDoRes & { id?: number })[];
      const mapped: TodoItem[] = items.map((t, idx) => ({
        // swagger 스키마엔 id가 없지만, 실제 서버에선 내려올 가능성이 커서 optional로 뒀음
        // id가 없으면 임시로 음수 id를 만들어 표시만 하고(수정/삭제는 동작 보장 X)
        id: typeof t.id === 'number' ? t.id : -(idx + 1),
        title: t.title ?? '',
        done: t.status === 'COMPLETED',
        timeList: t.startTime && t.endTime ? [{ startTime: t.startTime, endTime: t.endTime }] : undefined,
      }));

      // API가 빈 배열을 반환해도, 로컬에 저장된 데이터가 있으면 우선 사용 (다른 페이지 갔다 와도 유지)
      if (mapped.length === 0) {
        const fromLocal = readMockTodosByDate();
        const forDate = fromLocal?.[dateKey] ?? [];
        if (forDate.length > 0) {
          set({ todos: forDate });
          return;
        }
      }

      set({ todos: mapped });
    } catch {
      const fromLocal = readMockTodosByDate();
      const forDate = fromLocal?.[dateKey] ?? [];
      set({ todos: forDate });
    }
  },

  addAtTop: async (title) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    if (API_CONFIG.useMock) {
      const dateKey = get().selectedDate;
      set((s) => {
        const next = [
          { id: Date.now(), title: trimmed, done: false },
          ...(s.todosByDate[dateKey] ?? []),
        ];
        const nextByDate = { ...s.todosByDate, [dateKey]: next };
        writeMockTodosByDate(nextByDate);
        return {
          todosByDate: nextByDate,
          todos: next,
        };
      });
      return;
    }

    try {
      await createTodo({ title: trimmed });
      await get().loadSelectedDate();
    } catch {
      const dateKey = get().selectedDate;
      const fromLocal = readMockTodosByDate() ?? {};
      const current = fromLocal[dateKey] ?? [];
      const newTodo: TodoItem = { id: Date.now(), title: trimmed, done: false };
      const next = [newTodo, ...current];
      const nextByDate = { ...fromLocal, [dateKey]: next };
      writeMockTodosByDate(nextByDate);
      set({ todos: next });
      toast.warning('서버에 저장할 수 없습니다. 로컬에 임시 저장됩니다.');
    }
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

    try {
      await changeTodoStatus(id, { id, status, startTime: timeList?.[0]?.startTime, endTime: timeList?.[0]?.endTime });
      await get().loadSelectedDate();
    } catch {
      const dateKey = get().selectedDate;
      const fromLocal = readMockTodosByDate() ?? {};
      const next = get().todos;
      const nextByDate = { ...fromLocal, [dateKey]: next };
      writeMockTodosByDate(nextByDate);
      toast.warning('서버에 반영할 수 없습니다. 로컬에 저장됩니다.');
    }
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

    try {
      await updateTodo({ id, title: trimmed, startTime: timeList?.[0]?.startTime, endTime: timeList?.[0]?.endTime });
      await get().loadSelectedDate();
    } catch {
      const dateKey = get().selectedDate;
      const fromLocal = readMockTodosByDate() ?? {};
      const next = get().todos;
      const nextByDate = { ...fromLocal, [dateKey]: next };
      writeMockTodosByDate(nextByDate);
      toast.warning('서버에 반영할 수 없습니다. 로컬에 저장됩니다.');
    }
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

    try {
      await deleteTodo(id);
      await get().loadSelectedDate();
    } catch {
      const dateKey = get().selectedDate;
      const fromLocal = readMockTodosByDate() ?? {};
      const next = get().todos;
      const nextByDate = { ...fromLocal, [dateKey]: next };
      writeMockTodosByDate(nextByDate);
      toast.warning('서버에서 삭제할 수 없습니다. 로컬에서 제거됩니다.');
    }
  },
}));
