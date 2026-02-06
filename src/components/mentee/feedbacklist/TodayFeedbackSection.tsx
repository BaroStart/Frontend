import { UserIcon } from "@/components/icons";

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
    <section className={["w-full mt-5", className ?? ""].join(" ").trim()}>
      <h2 className="mb-3 text-base font-semibold text-slate-900">
        오늘의 피드백
      </h2>

      {!item ? (
        <div className="rounded-2xl border border-[#E2F1F6] bg-[#F2FBFD] p-4 text-sm text-slate-500">
          오늘은 아직 받은 피드백이 없어요.
        </div>
      ) : (
        <button
          type="button"
          disabled={!clickable}
          onClick={() => item && onClick?.(item)}
          className={[
            "relative w-full overflow-hidden rounded-3xl border border-[#D7EDF4] bg-white p-5 text-left shadow-sm transition",
            "hover:shadow-md active:scale-[0.99]",
            clickable ? "" : "cursor-default",
          ].join(" ")}
        >
          <div className="absolute left-0 top-0 h-full w-1 bg-[#0E9ABE]" />

          <div className="flex items-start gap-4 pl-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-3xl bg-gray-200 text-black-100">
              <UserIcon className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-bold text-black">{item.mentorName}</span>
                <span className="text-slate-300">·</span>
                <span>{item.timeAgoText}</span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-900">
                {item.message}
              </p>
            </div>
          </div>
        </button>
      )}
    </section>
  );
}
