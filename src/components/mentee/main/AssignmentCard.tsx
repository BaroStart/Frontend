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
        "w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.99]",
        isDone ? "border-gray-200" : "border-gray-100",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="pointer-events-none mt-0.5">
          <div
            className={[
              "flex h-5 w-5 items-center justify-center rounded-md border-2",
              isDone ? "border-gray-900 bg-gray-900" : "border-gray-300 bg-white",
            ].join(" ")}
          >
            {isDone && <span className="text-xs font-extrabold text-white">✓</span>}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-lg bg-gray-900 px-2 py-0.5 text-xs font-bold text-white">
              과제
            </span>

            {isDone ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
                완료
              </span>
            ) : (
              <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs font-bold text-gray-700">
                미완료
              </span>
            )}
          </div>

          <div
            className={[
                "truncate text-[15px] font-extrabold",
                isDone
                ? "text-gray-400 line-through"
                : "text-gray-900",
            ].join(" ")}
            >
            {item.title}
          </div>
          
          <div className="mt-1 text-xs font-medium text-gray-600">
            {isDone ? (
              <span>{formatRange(item.startedAtText, item.endedAtText)}</span>
            ) : (
              <span>마감: {item.dueAtText ?? "-"}</span>
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
