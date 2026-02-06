type Props = {
  title?: string;
  message: string;
  coachName?: string;
  updatedText?: string;
  className?: string;
};

export function PlannerSummaryCard({
  title = "플래너 총평",
  message,
  coachName,
  updatedText,
  className,
}: Props) {
  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
        {(coachName || updatedText) && (
          <span className="text-[11px] font-semibold text-slate-400">
            {updatedText ?? ""}
          </span>
        )}
      </div>

      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">{message}</p>

      {(coachName || updatedText) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          {coachName && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
              {coachName}
            </span>
          )}
        </div>
      )}
    </section>
  );
}
