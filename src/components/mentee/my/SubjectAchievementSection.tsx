import { EnglishIcon, KoreanIcon, MathIcon } from "@/components/icons";

export type SubjectAchievementItem = {
  id: string;
  name: "국어" | "영어" | "수학" | string;
  percent: number;
  progressText?: string;
};

type Props = {
  title?: string;
  items: SubjectAchievementItem[];
  className?: string;
};

function iconFor(name: SubjectAchievementItem["name"]) {
  const iconClass = "h-4 w-4 text-slate-500";
  switch (name) {
    case "국어":
      return <KoreanIcon className={iconClass} />;
    case "영어":
      return <EnglishIcon className={iconClass} />;
    case "수학":
      return <MathIcon className={iconClass} />;
    default:
      return <div className="h-5 w-5" />;
  }
}

function clampPercent(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function SubjectAchievementSection({
  title = "과목별 달성률",
  items,
  className,
}: Props) {
  return (
    <section className={["", className ?? ""].join(" ").trim()}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map((s) => {
          const p = clampPercent(s.percent);

          return (
            <div
              key={s.id}
              className="flex flex-col items-center rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
            >
              <div className="relative flex h-10 w-10 items-center justify-center">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    className="stroke-slate-100"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    className="stroke-slate-300"
                    strokeWidth="3"
                    strokeDasharray={`${p * 1.0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex h-6 w-6 items-center justify-center rounded-full border border-slate-100 bg-white">
                  {iconFor(s.name)}
                </div>
              </div>
              <p className="mt-1.5 text-[11px] font-semibold text-slate-700">{s.name}</p>
              <p className="text-xs text-slate-500">{p}%</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
