import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { TimeRangeModal, type TimeRangeValue } from "../TimeRangeModal";

export type TodoItem = {
  id: number;
  title: string;
  done: boolean;
};

type Props = {
  item: TodoItem;
  onToggleDone: (args?: { timeRange?: TimeRangeValue }) => void | Promise<void>;
  onUpdateTitle: (title: string) => void | Promise<void>;
  onDelete: () => void | Promise<void>;
};

const schema = z.object({
  title: z.string().trim().min(1, "할 일을 입력해주세요.").max(40, "40자 이내로 입력해주세요."),
});
type FormValues = z.infer<typeof schema>;

export function TodoCard({
  item,
  onToggleDone,
  onUpdateTitle,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [timeModalOpen, setTimeModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: item.title },
    mode: "onSubmit",
  });

  const errorMsg = form.formState.errors.title?.message;

  useEffect(() => {
    form.reset({ title: item.title });
  }, [item.title, form]);

  useEffect(() => {
    if (isEditing) setTimeout(() => inputRef.current?.focus(), 0);
  }, [isEditing]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("[data-todo-menu]")) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  const submitEdit = form.handleSubmit(({ title }) => {
    onUpdateTitle(title.trim());
    setIsEditing(false);
  });

  const startEdit = () => {
    setMenuOpen(false);
    setIsEditing(true);
    form.reset({ title: item.title });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    form.reset({ title: item.title });
  };

  const handleClickCheck = () => {
    if (item.done) {
      setMenuOpen(false);
      if (isEditing) cancelEdit();
      onToggleDone();
      return;
    }
    setTimeModalOpen(true);
  };

  const isDone = item.done;

  return (
    <>
      <div
        className={[
          "relative w-full rounded-xl border-l-4 border-l-[hsl(var(--brand))] border border-slate-100 bg-white text-left shadow-sm",
        ].join(" ")}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          <button
            type="button"
            onClick={handleClickCheck}
            className="flex h-6 w-6 shrink-0 items-center justify-center"
            aria-label={isDone ? "완료 해제" : "완료 체크"}
          >
            <div
              className={[
                "flex h-5 w-5 items-center justify-center rounded-md border-2 transition",
                isDone ? "border-slate-400 bg-slate-400" : "border-slate-300 bg-white",
              ].join(" ")}
            >
              {isDone && <span className="text-xs font-extrabold text-white">✓</span>}
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2 flex-wrap">
              <span className="inline-flex h-5 items-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                할 일
              </span>
              {isDone ? (
                <span className="inline-flex h-5 items-center justify-center rounded-md bg-[hsl(var(--brand))] px-2 py-0.5 text-[10px] font-bold text-white">
                  완료
                </span>
              ) : (
                <span className="inline-flex h-5 items-center justify-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                  미완료
                </span>
              )}
            </div>

            {!isEditing ? (
              <div
                className={[
                "truncate text-[15px] font-bold",
                isDone ? "text-slate-400 line-through" : "text-slate-900",
                ].join(" ")}
              >
                {item.title}
              </div>
            ) : (
              <form onSubmit={submitEdit} className="relative">
                <input
                  {...form.register("title")}
                  ref={(e) => {
                    form.register("title").ref(e);
                    inputRef.current = e;
                  }}
                    className={[
                      "w-full rounded-xl border px-3 py-2 text-[15px] font-extrabold outline-none",
                      "border-slate-200 focus:border-[hsl(var(--brand))] focus:ring-1 focus:ring-[hsl(var(--brand))]",
                    ].join(" ")}
                />
                {errorMsg && <p className="mt-1 text-xs font-semibold text-red-500">{errorMsg}</p>}

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-[hsl(var(--brand))] px-3 py-2 text-sm font-extrabold text-white active:scale-[0.99]"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 active:scale-[0.99]"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>

          {!isEditing && (
            <div className="shrink-0" data-todo-menu>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100 active:scale-[0.98]"
                aria-label="메뉴"
              >
                <span className="text-lg leading-none text-slate-600">⋮</span>
              </button>

              {menuOpen && (
                <div className="absolute right-4 top-12 z-10 w-28 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={startEdit}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-slate-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
        </div>
      </div>

      <TimeRangeModal
        open={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
        onSubmit={(value: TimeRangeValue) => {
          setTimeModalOpen(false);
          onToggleDone({ timeRange: value });
        }}
      />
    </>
  );
}