import { UserIcon } from "@/components/icons";

export type FeedbackSummaryItem = {
  id: string;
  mentorName: string;
  timeAgoText: string;
  message: string;
  subject?: string;
  mentorAvatar?: string;
};

type Props = {
  items?: FeedbackSummaryItem[];
  onClickItem?: (item: FeedbackSummaryItem) => void;
  className?: string;
  title?: string;
  emptyText?: string;
};

export function FeedbackSummarySection({
  items = [],
  onClickItem,
  className,
  title = "피드백 요약",
  emptyText = "아직 피드백이 없습니다.",
}: Props) {
  return (
    <section className={["w-full", className ?? ""].join(" ").trim()}>
      <div className="mb-2 flex items-end justify-between">
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
        <span className="text-[11px] font-semibold text-slate-400">{items.length}개</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.id}>
              <FeedbackSummaryCard item={it} onClick={onClickItem} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type CardProps = {
  item: FeedbackSummaryItem;
  onClick?: (item: FeedbackSummaryItem) => void;
  className?: string;
};

function FeedbackSummaryCard({ item, onClick, className }: CardProps) {
  const clickable = Boolean(onClick);

  return (
    <button
      type="button"
      disabled={!clickable}
      onClick={() => onClick?.(item)}
      className={[
        "w-full rounded-2xl border border-l-4 border-slate-200 border-l-[#0E9ABE] bg-white px-4 py-3.5 text-left shadow-sm",
        "transition hover:bg-slate-50 hover:shadow-md active:scale-[0.99]",
        clickable ? "" : "cursor-default",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
          {item.mentorAvatar ? (
            <img src={item.mentorAvatar} alt={item.mentorName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-black-100 text-slate-400">
              <UserIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-bold text-slate-900">{item.mentorName} 멘토</span>
            <span className="shrink-0 text-[11px] font-medium text-slate-400">{item.timeAgoText}</span>
          </div>

          <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-slate-600 whitespace-pre-wrap break-keep">
            {item.message}
          </p>
        </div>
      </div>
    </button>
  );
}
