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
        "rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {(coachName || updatedText) && (
          <span className="text-[11px] font-semibold text-slate-400">
            {updatedText ?? ""}
          </span>
        )}
      </div>

      <blockquote className="mt-3 rounded-xl border-l-[3px] border-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]/30 border border-slate-100 px-4 py-3">
        <p className="line-clamp-4 text-sm leading-[1.6] text-slate-700">{message}</p>
      </blockquote>

      {coachName && (
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[hsl(var(--brand-light))] px-2.5 py-1 text-[11px] font-bold text-[hsl(var(--brand))]">
            {coachName}
          </span>
        </div>
      )}
    </section>
  );
}
