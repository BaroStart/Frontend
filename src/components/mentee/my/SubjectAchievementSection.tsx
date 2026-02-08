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
  switch (name) {
    case "국어":
      return <KoreanIcon className="h-6 w-6 text-gray-500" />;
    case "영어":
      return <EnglishIcon className="h-6 w-6 text-gray-500" />;
    case "수학":
      return <MathIcon className="h-6 w-6 text-gray-500" />;
    default:
      return <div className="h-6 w-6" />;
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
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {items.map((s) => {
          const p = clampPercent(s.percent);

          return (
            <div
              key={s.id}
              className="flex flex-col items-center rounded-xl bg-gray-50 p-4"
            >
              <div className="relative flex h-14 w-14 items-center justify-center">
                <svg className="h-14 w-14 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="rgb(229 231 235)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="rgb(30 41 59)"
                    strokeWidth="3"
                    strokeDasharray={`${p * 1.0} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-white">
                  {iconFor(s.name)}
                </div>
              </div>
              <p className="mt-2 text-xs font-bold text-gray-900">{s.name}</p>
              <p className="text-sm font-extrabold text-gray-700">{p}%</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
