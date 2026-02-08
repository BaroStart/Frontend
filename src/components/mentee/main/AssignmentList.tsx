import { useMemo } from "react";
import { AssignmentCard, type AssignmentItem } from "./AssignmentCard";

type Props = {
  items: AssignmentItem[];
  onOpen: (assignmentId: string) => void;
};

export function AssignmentList({ items, onOpen }: Props) {
  const sorted = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      if (a.status === b.status) return 0;
      return a.status === "PENDING" ? -1 : 1; 
    });
    return copy;
  }, [items]);

  const pendingCount = sorted.filter((x) => x.status === "PENDING").length;

  return (
    <section className="mt-4">
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            과제
          </h2>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            미완료 {pendingCount}개 / 전체 {sorted.length}개
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-[#E2F1F6] bg-white p-3 text-sm font-semibold text-slate-500">
            해당 날짜에 과제가 없습니다.
          </div>
        ) : (
          sorted.map((it) => (
            <AssignmentCard
              key={it.id}
              item={it}
              onOpen={() => onOpen(it.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
