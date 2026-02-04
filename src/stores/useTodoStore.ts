import { create } from "zustand";

export type TodoItem = {
  id: string;
  title: string;
  done: boolean;
};

type TodoState = {
  todos: TodoItem[];
  addAtTop: (title: string) => void;
  toggleDone: (id: string) => void;
  updateTitle: (id: string, title: string) => void;
  remove: (id: string) => void;
};

export const useTodoStore = create<TodoState>((set) => ({
  todos: [
    { id: "t1", title: "영어 듣기 연습 30분", done: false },
    { id: "t2", title: "역사 교과서 읽기", done: true },
  ],

  addAtTop: (title) =>
    set((s) => ({
      todos: [{ id: crypto.randomUUID(), title, done: false }, ...s.todos],
    })),

  toggleDone: (id) =>
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      ),
    })),

  updateTitle: (id, title) =>
    set((s) => ({
      todos: s.todos.map((t) =>
        t.id === id ? { ...t, title } : t
      ),
    })),

  remove: (id) =>
    set((s) => ({
      todos: s.todos.filter((t) => t.id !== id),
    })),
}));
