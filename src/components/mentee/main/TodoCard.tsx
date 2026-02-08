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
          "relative w-full rounded-2xl border bg-white p-3 text-left shadow-sm",
          isDone ? "border-gray-200" : "border-gray-100",
        ].join(" ")}
      >
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={handleClickCheck}
            className="mt-0.5"
            aria-label={isDone ? "완료 해제" : "완료 체크"}
          >
            <div
              className={[
                "flex h-5 w-5 items-center justify-center rounded-md border-2 transition",
                isDone ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white",
              ].join(" ")}
            >
              {isDone && <span className="text-xs font-extrabold text-white">✓</span>}
            </div>
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-lg bg-[#0E9ABE] px-2 py-0.5 text-xs font-bold text-white">
                할 일
              </span>

              {isDone ? (
                <span className="rounded-lg bg-gray-900 text-white px-2 py-0.5 text-xs font-bold text-gray-700">
                  완료
                </span>
              ) : (
                <span className="rounded-lg bg-gray-50 px-2 py-0.5 text-xs font-bold text-gray-700">
                  미완료
                </span>
              )}

              {!isEditing && (
                <div className="ml-auto" data-todo-menu>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-50 active:scale-[0.98]"
                    aria-label="메뉴"
                  >
                    <span className="text-lg text-gray-600">⋮</span>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-4 top-12 z-10 w-28 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={startEdit}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onDelete();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-50"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isEditing ? (
              <div
                className={[
                  "truncate text-[15px] font-extrabold",
                  isDone ? "text-gray-400 line-through" : "text-gray-900",
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
                    "border-gray-200 focus:border-gray-400",
                  ].join(" ")}
                />
                {errorMsg && <p className="mt-1 text-xs font-semibold text-red-500">{errorMsg}</p>}

                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="submit"
                    className="rounded-xl bg-gray-900 px-3 py-2 text-sm font-extrabold text-white active:scale-[0.99]"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-extrabold text-gray-700 active:scale-[0.99]"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>
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