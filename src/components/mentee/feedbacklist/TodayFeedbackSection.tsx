import React from "react";

export type TodayFeedback = {
  id: string;
  mentorName: string;
  timeAgoText: string;
  message: string;
};

type Props = {
  item?: TodayFeedback | null;
  onClick?: (item: TodayFeedback) => void;
  className?: string;
};

export function TodayFeedbackCard({ item, onClick, className }: Props) {
  const clickable = Boolean(item && onClick);

  return (
    <section className={["w-full", className ?? ""].join(" ").trim()}>
      <h2 className="mb-3 text-base font-semibold text-gray-900">
        오늘의 코멘트 💬
      </h2>

      {!item ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-500">
          오늘 도착한 코멘트가 없어요.
        </div>
      ) : (
        <button
          type="button"
          disabled={!clickable}
          onClick={() => item && onClick?.(item)}
          className={[
            "relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-5 text-left shadow-sm transition",
            clickable ? "active:scale-[0.98]" : "cursor-default",
          ].join(" ")}
        >
          <div className="absolute left-0 top-0 h-full w-1.5 bg-[#0585D7]" />

          <div className="pl-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-bold">
                {item.mentorName} 멘토
              </span>
              <span>·</span>
              <span>{item.timeAgoText}</span>
            </div>

            <p className="mt-3 text-sm leading-6 text-gray-900">
              {item.message}
            </p>
          </div>
        </button>
      )}
    </section>
  );
}
