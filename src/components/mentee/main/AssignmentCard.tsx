export type AssignmentStatus = "PENDING" | "DONE";

export type AssignmentItem = {
  id: string;
  title: string;
  status: AssignmentStatus;

  dueAtText?: string;

  startedAtText?: string; 
  endedAtText?: string; 
};

type Props = {
  item: AssignmentItem;
  onOpen: () => void;
};

export function AssignmentCard({ item, onOpen }: Props) {
  const isDone = item.status === "DONE";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={[
        "w-full rounded-xl border-l-4 border-[hsl(var(--brand))] bg-white px-4 py-3 text-left shadow-sm transition active:scale-[0.99]",
        isDone ? "opacity-90" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="inline-flex h-5 items-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              과제
            </span>
            <span
              className={`inline-flex h-5 items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                isDone ? "bg-[hsl(var(--brand))] text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {isDone ? "완료" : "미완료"}
            </span>
          </div>
          <div
            className={[
              "truncate text-[15px] font-bold",
              isDone ? "text-slate-400 line-through" : "text-slate-900",
            ].join(" ")}
          >
            {item.title}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {isDone ? (
              <span>{formatRange(item.startedAtText, item.endedAtText)}</span>
            ) : (
              <span>마감 {item.dueAtText ?? "-"}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function formatRange(start?: string, end?: string) {
  return `${start ?? "--:--"} ~ ${end ?? "--:--"}`;
}