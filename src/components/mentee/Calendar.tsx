import React, { useMemo, useState } from "react";

type YYYYMMDD = string;

export type DayMeta = {
  assignmentCount?: number;
  todoCount?: number;
};

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  metaByDate?: Record<YYYYMMDD, DayMeta>;
  defaultExpanded?: boolean;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toKeyLocal(d: Date): YYYYMMDD {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${pad2(m)}-${pad2(day)}`;
}

function addMonths(d: Date, diff: number) {
  return new Date(d.getFullYear(), d.getMonth() + diff, 1);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getWeekStartSunday(d: Date) {
  const day = d.getDay();
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildWeekRow(selected: Date) {
  const start = getWeekStartSunday(selected);
  const days: Date[] = [];
  const cur = new Date(start);
  for (let i = 0; i < 7; i++) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

type Cell = { date: Date; inMonth: boolean };

function buildMonthCells(monthRef: Date): Cell[] {
  const y = monthRef.getFullYear();
  const m = monthRef.getMonth();

  const first = new Date(y, m, 1);
  const last = new Date(y, m + 1, 0);

  const daysInMonth = last.getDate();
  const leading = first.getDay();
  const prevLast = new Date(y, m, 0).getDate();

  const cells: Cell[] = [];

  for (let i = 0; i < leading; i++) {
    const day = prevLast - (leading - 1 - i);
    cells.push({ date: new Date(y, m - 1, day), inMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(y, m, d), inMonth: true });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    cells.push({ date: new Date(y, m + 1, i), inMonth: false });
  }

  return cells;
}

// 과제랑 할일 있을 때 각각 점 1개로 표시함
function DotIndicator({ a, t }: { a: number; t: number }) {
  const hasA = a > 0;
  const hasT = t > 0;

  return (
    <div className="mt-2 flex h-3 items-center justify-center gap-1">
      {hasA && <span className="h-1.5 w-1.5 rounded-full bg-gray-900" />}
      {hasT && <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />}
    </div>
  );
}


function DayCell({
  date,
  inMonth,
  selected,
  a,
  t,
  onPick,
}: {
  date: Date;
  inMonth: boolean;
  selected: boolean;
  a: number;
  t: number;
  onPick: () => void;
}) {
  const base =
    "relative flex min-h-[82px] flex-col items-center justify-start rounded-2xl p-2 transition";

  // ✅ 공통: 날짜가 들어가는 자리(원형)의 크기/정렬을 항상 동일하게
  const DateCircle = ({
    children,
    circleClassName = "",
  }: {
    children: React.ReactNode;
    circleClassName?: string;
  }) => (
    <div className="mt-2 flex h-14 w-14 items-center justify-center rounded-3xl">
      <div
        className={[
          "flex h-full w-full items-center justify-center rounded-3xl transition",
          circleClassName,
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );

  if (!inMonth) {
    // ✅ 회색 날짜도 동일한 원형 자리 안에 넣어서 위치 완벽히 정렬
    return (
      <button
        type="button"
        onClick={onPick}
        className={`${base} bg-white hover:bg-gray-50`}
      >
        <DateCircle circleClassName="group-hover:bg-gray-100">
          <span className="text-base font-medium text-gray-300">
            {date.getDate()}
          </span>
        </DateCircle>

        {/* ✅ 회색 날짜에는 점 안 보이게 하려면 아래는 비워두기(높이는 유지) */}
        <div className="mt-2 h-3" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onPick}
      className={[
        base,
        selected ? "bg-transparent" : "bg-white",
        "focus:outline-none",
      ].join(" ")}
    >
      {/* ✅ 선택/호버 동일 크기 원형 하이라이트 */}
      <div className="group mt-2 flex h-14 w-14 items-center justify-center rounded-3xl">
        <div
          className={[
            "flex h-full w-full items-center justify-center rounded-3xl transition",
            selected ? "bg-gray-900" : "bg-transparent",
            !selected ? "group-hover:bg-gray-100" : "",
          ].join(" ")}
        >
          <span
            className={[
              "text-base font-medium transition",
              selected ? "text-white font-semibold" : "text-gray-800",
            ].join(" ")}
          >
            {date.getDate()}
          </span>
        </div>
      </div>

      {/* ✅ selected여도 점은 항상 보임 */}
      <DotIndicator a={a} t={t} />
    </button>
  );
}

export function Calendar({
  value,
  onChange,
  metaByDate = {},
  defaultExpanded = false,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const [monthRef, setMonthRef] = useState<Date>(
    new Date(value.getFullYear(), value.getMonth(), 1)
  );

  const monthCells = useMemo(() => buildMonthCells(monthRef), [monthRef]);
  const week = useMemo(() => buildWeekRow(value), [value]);

  const monthLabel = `${monthRef.getFullYear()}년 ${monthRef.getMonth() + 1}월`;

  const cells = expanded
    ? monthCells
    : week.map((d) => ({
        date: d,
        inMonth:
          d.getFullYear() === monthRef.getFullYear() &&
          d.getMonth() === monthRef.getMonth(),
      }));

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthRef(addMonths(monthRef, -1))}
          className="rounded-2xl px-3 py-2 text-2xl font-semibold text-gray-500 hover:bg-gray-50"
          aria-label="이전 달"
        >
          ‹
        </button>

        <div className="text-lg font-bold text-gray-900">{monthLabel}</div>

        <button
          type="button"
          onClick={() => setMonthRef(addMonths(monthRef, 1))}
          className="rounded-2xl px-3 py-2 text-2xl font-semibold text-gray-500 hover:bg-gray-50"
          aria-label="다음 달"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-gray-400">
        {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {cells.map(({ date, inMonth }) => {
          const key = toKeyLocal(date);

          const meta = metaByDate[key] ?? {};
          const a = meta.assignmentCount ?? 0;
          const t = meta.todoCount ?? 0;

          const selected = isSameDay(date, value);

          return (
            <DayCell
              key={key}
              date={date}
              inMonth={inMonth}
              selected={selected}
              a={a}
              t={t}
              onPick={() => {
                onChange(date);
                if (
                  date.getFullYear() !== monthRef.getFullYear() ||
                  date.getMonth() !== monthRef.getMonth()
                ) {
                  setMonthRef(new Date(date.getFullYear(), date.getMonth(), 1));
                }
              }}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-center">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-50"
        >
          {expanded ? "주간 캘린더 보기" : "월간 캘린더 보기"}
          <span className="text-xs">{expanded ? "▴" : "▾"}</span>
        </button>
      </div>
    </section>
  );
}
