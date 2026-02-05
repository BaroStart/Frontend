type BreakdownItem = {
  label: string;
  valueText: string; 
};

export type SubjectAchievementItem = {
  id: string;
  name: '국어' | '영어' | '수학' | string;
  percent: number; 
  weekTotalText?: string;
  weekDoneText?: string;
  breakdown?: BreakdownItem[];
};

type Props = {  
  title?: string;
  items: SubjectAchievementItem[];
  className?: string;
};

function iconFor(name: SubjectAchievementItem['name']) {
  if (name === '국어') return '📘';
  if (name === '영어') return '🗣️';
  if (name === '수학') return '📐';
  return '📚';
}

function clampPercent(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function SubjectAchievementSection({ title = '과목별 달성률', items, className }: Props) {
  return (
    <section className={['', className ?? ''].join(' ').trim()}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="space-y-3">
        {items.map((s) => {
          const p = clampPercent(s.percent);
          return (
            <div key={s.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-sm">
                    {iconFor(s.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.weekTotalText ?? ''}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{p}%</p>
                  <p className="text-xs text-gray-400">{s.weekDoneText ?? ''}</p>
                </div>
              </div>

              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-gray-800" style={{ width: `${p}%` }} />
              </div>

              {s.breakdown && s.breakdown.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 px-3 py-3">
                  {s.breakdown.map((b) => (
                    <div key={b.label} className="text-center">
                      <p className="text-[11px] text-gray-400">{b.label}</p>
                      <p className="mt-1 text-xs font-semibold text-gray-900">{b.valueText}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
