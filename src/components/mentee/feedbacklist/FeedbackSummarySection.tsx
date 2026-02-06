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
  emptyText = "받은 피드백이 없습니다.",
}: Props) {
  return (
    <section className={["w-full mt-5 mb-5", className ?? ""].join(" ").trim()}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400">{items.length}개</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-500 shadow-sm">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-3">
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
        "w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left",
        "transition hover:shadow-sm active:scale-[0.99]",
        clickable ? "" : "cursor-default",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-slate-100 bg-slate-100">
          {item.mentorAvatar ? (
            <img
              src={item.mentorAvatar}
              alt={item.mentorName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-200 text-black-100 text-slate-400">
              <UserIcon className="h-6 w-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-900">
              {item.mentorName} 멘토
            </span>
            <span className="text-xs font-normal text-slate-400">
              {item.timeAgoText}
            </span>
          </div>

          <p className="mt-2 text-sm font-medium leading-7 text-slate-600 whitespace-pre-wrap break-keep">
            {item.message}
          </p>
        </div>
      </div>
    </button>
  );
}
