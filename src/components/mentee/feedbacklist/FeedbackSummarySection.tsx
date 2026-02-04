import React from "react";

export type FeedbackSummaryItem = {
  id: string;
  mentorName: string;
  timeAgoText: string;
  message: string;
  subject: string; 
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
    <section className={["w-full", className ?? ""].join(" ").trim()}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400">{items.length}개</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-b from-gray-50 to-white p-5 text-sm text-gray-500 shadow-sm">
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
        "group relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition",
        "hover:-translate-y-[1px] hover:shadow-md active:translate-y-0 active:scale-[0.99]",
        clickable ? "" : "cursor-default",
        className ?? "",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-50/60 via-white to-white opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="pointer-events-none absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#0585D7] to-[#046fb3] opacity-80" />

      <div className="relative p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-semibold text-gray-900">{item.mentorName} 멘토</span>
              <span className="text-gray-300">·</span>
              <span className="whitespace-nowrap">{item.timeAgoText}</span>
            </div>

            <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-800">
              {item.message}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-100 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />{item.subject}</span>
          <div className="h-px flex-1 bg-gradient-to-r from-gray-100 via-gray-100 to-transparent" />
        </div>
      </div>
    </button>
  );
}
