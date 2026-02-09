import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { TodoCard, type TodoItem } from "./TodoCard";
import { PlusIcon } from "@/components/icons";
import type { TimeRangeValue } from "../TimeRangeModal";

const schema = z.object({
  title: z.string().trim().min(1, "할 일을 입력해주세요.").max(40, "40자 이내로 입력해주세요."),
});
type FormValues = z.infer<typeof schema>;

type Props = {
  items: TodoItem[];
  onAddAtTop: (title: string) => void | Promise<void>;
  onToggleDone: (id: number, args?: { timeRange?: TimeRangeValue }) => void | Promise<void>;
  onUpdateTitle: (id: number, title: string) => void | Promise<void>;
  onDelete: (id: number) => void | Promise<void>;
};

export function TodoList({ items, onAddAtTop, onToggleDone, onUpdateTitle, onDelete }: Props) {
  const [isAdding, setIsAdding] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
    mode: "onSubmit",
  });

  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      if (a.done === b.done) return 0;
      return a.done ? 1 : -1;     // 미완료 먼저, 완료 아래로
    });
    return copy;
  }, [items]);

  const pendingCount = sorted.filter((x) => !x.done).length;

  const submitAdd = form.handleSubmit(({ title }) => {
    onAddAtTop(title.trim());
    form.reset({ title: "" });
    setIsAdding(false);
  });

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">할 일</h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            미완료 {pendingCount}개 / 전체 {sorted.length}개
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsAdding((v) => !v);
            form.reset({ title: "" });
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--brand))] text-white shadow-sm active:scale-[0.98]"
          aria-label="할 일 추가"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-2">
        {isAdding && (
          <form onSubmit={submitAdd}>
            <div className="relative w-full rounded-xl border border-slate-100 border-l-4 border-l-[hsl(var(--brand))] bg-white text-left shadow-sm">
              <div className="flex items-start gap-2.5 px-4 py-3">
                <div className="pointer-events-none mt-0.5">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-slate-300 bg-white" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-flex h-5 items-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      할 일
                    </span>
                    <span className="inline-flex h-5 items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      신규
                    </span>
                  </div>

                  <input
                    {...form.register("title")}
                    placeholder="할 일 이름 입력"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-[15px] font-bold outline-none placeholder:text-slate-400 focus:border-[hsl(var(--brand))] focus:ring-1 focus:ring-[hsl(var(--brand))]"
                  />

                  {form.formState.errors.title?.message && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {form.formState.errors.title.message}
                    </p>
                  )}

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="rounded-xl bg-[hsl(var(--brand))] px-3 py-2 text-sm font-extrabold text-white active:scale-[0.99]"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdding(false);
                        form.reset({ title: "" });
                      }}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-700 active:scale-[0.99]"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {sorted.length === 0 && !isAdding ? (
          <div className="rounded-xl border border-slate-100 bg-white p-4 text-sm font-semibold text-slate-500">
            할 일이 없습니다.
          </div>
        ) : (
          sorted.map((it) => (
            <TodoCard
              key={it.id}
              item={it}
              onToggleDone={(args) => onToggleDone(it.id, args)}
              onUpdateTitle={(title) => onUpdateTitle(it.id, title)}
              onDelete={() => onDelete(it.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
