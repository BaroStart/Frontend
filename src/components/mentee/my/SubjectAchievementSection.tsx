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

      <div className="space-y-3">
        {items.map((s) => {
          const p = clampPercent(s.percent);

          return (
            <div
              key={s.id}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100">
                    {iconFor(s.name)}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{p}%</p>
                  <p className="text-xs text-gray-400">{s.progressText ?? ""}개</p>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#0E9ABE]"
                  style={{ width: `${p}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
