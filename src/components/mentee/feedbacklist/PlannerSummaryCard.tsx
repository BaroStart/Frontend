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
        "relative overflow-hidden rounded-3xl border border-[#BFE6F1] bg-gradient-to-br from-[#DFF5FB] via-white to-white p-5 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#0E9ABE]/10" />
      <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-[#0E9ABE]/5" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h2 className="mt-2 text-lg font-extrabold text-slate-900">
            {title}
          </h2>
        </div>
      </div>

      <p className="relative mt-3 text-sm leading-6 text-slate-900">
        {message}
      </p>

      {(coachName || updatedText) && (
        <div className="relative mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {coachName && <span className="font-semibold">{coachName}</span>}
          {coachName && updatedText && <span className="text-slate-300">·</span>}
          {updatedText && <span>{updatedText}</span>}
        </div>
      )}
    </section>
  );
}
