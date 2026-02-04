import React, { useMemo } from "react";

export type TimelineItemType = "task" | "assignment";

export type TimelineItem = {
  id: string;
  type: TimelineItemType;
  title: string;
  start: string;
  end: string;
  showTitle?: boolean;
};

type TimeTableProps = {
  items: TimelineItem[];
  startHour?: number; 
  endHour?: number;
  className?: string;
  rowHeightPx?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function parseHHMM(hhmm: string) {
  const [h, m] = hhmm.split(":").map((v) => Number(v));
  return h * 60 + m;
}

function hashString(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pastelColorFromKey(key: string) {
  const h = hashString(key) % 360;
  const s = 75;
  const l = 75;
  return `hsl(${h} ${s}% ${l}% / 0.85)`;
}

function splitIntoHourSegments(params: {
  startMin: number;
  endMin: number;
  startHour: number;
  endHour: number; 
}) {
  const { startMin, endMin, startHour, endHour } = params;

  const gridStart = startHour * 60;
  const gridEnd =
    endHour > startHour ? endHour * 60 : (24 + endHour) * 60; 

  let s0 = startMin;
  let e0 = endMin;
  if (e0 <= s0) e0 += 24 * 60;

  const s = clamp(s0, gridStart, gridEnd);
  const e = clamp(e0, gridStart, gridEnd);
  if (e <= s) return [];

  const segments: Array<{
    hour: number;
    colStart: number;
    colEnd: number;
    isFirst: boolean;
    isLast: boolean;
  }> = [];

  const startHAbs = Math.floor(s / 60);
  const endHAbs = Math.floor((e - 1) / 60);

  for (let hAbs = startHAbs; hAbs <= endHAbs; hAbs++) {
    const hourStart = hAbs * 60;
    const hourEnd = hourStart + 60;

    const segStart = Math.max(s, hourStart);
    const segEnd = Math.min(e, hourEnd);

    const startInHour = segStart - hourStart;
    const endInHour = segEnd - hourStart; 

    const colStart = clamp(startInHour + 1, 1, 60);
    const colEnd = clamp(endInHour + 1, 2, 61);

    segments.push({
      hour: hAbs,
      colStart,
      colEnd,
      isFirst: hAbs === startHAbs,
      isLast: hAbs === endHAbs,
    });
  }

  return segments;
}

export function TimeTable({
  items,
  startHour = 5,
  endHour = 24,
  className,
  rowHeightPx = 40,
}: TimeTableProps) {
  const hourRows = useMemo(() => {
    const rows: number[] = [];

    const totalHours =
        endHour > startHour ? endHour - startHour : 24 - startHour + endHour;

    for (let i = 0; i < totalHours; i++) {
        rows.push(startHour + i);
    }
    return rows;
    }, [startHour, endHour]);

  const blocks = useMemo(() => {
    const out: Array<{
      key: string;
      hour: number;
      colStart: number;
      colEnd: number;
      title?: string;
      bg: string;
      isFirst: boolean;
      isLast: boolean;
    }> = [];

    for (const it of items) {
      const startMin = parseHHMM(it.start);
      const endMin = parseHHMM(it.end);

      const segs = splitIntoHourSegments({
        startMin,
        endMin,
        startHour,
        endHour,
      });

      const bg = pastelColorFromKey(`${it.title}-${it.id}`);

      segs.forEach((seg, idx) => {
        out.push({
          key: `${it.id}-${seg.hour}-${idx}`,
          hour: seg.hour,
          colStart: seg.colStart,
          colEnd: seg.colEnd,
          title: it.showTitle !== false && seg.isFirst ? it.title : undefined,
          bg,
          isFirst: seg.isFirst,
          isLast: seg.isLast,
        });
      });
    }

    return out;
  }, [items, startHour, endHour]);

  const gridBgStyle: React.CSSProperties = {
    backgroundImage: `
      repeating-linear-gradient(
        to right,
        rgba(226,232,240,0.9) 0px,
        rgba(226,232,240,0.9) 1px,
        transparent 1px,
        transparent calc((100% / 6))
      )
    `,
  };

  return (
    <div
      className={[
        "w-full overflow-hidden rounded-2xl border border-slate-200 bg-white",
        className ?? "",
      ].join(" ")}
    >
      <div className="px-4 pt-4">
        <div className="text-xs font-semibold tracking-wide text-slate-500">
          TIMELINE
        </div>
      </div>

      <div className="flex gap-3 px-4 pb-4 pt-3">
        <div className="flex flex-col">
          {hourRows.map((h) => (
            <div
                key={h}
                style={{ height: rowHeightPx }}
                className="pr-1 text-right text-xs font-medium text-slate-400"
                >
                {h % 24}
            </div>
          ))}
        </div>

        <div className="relative flex-1">
          <div className="relative rounded-lg">
            {hourRows.map((h) => (
              <div
                key={h}
                style={{ height: rowHeightPx, ...gridBgStyle }}
                className="border-t border-slate-100"
              />
            ))}
            <div className="absolute inset-y-0 left-0 w-px bg-slate-100" />
            <div className="absolute inset-y-0 right-0 w-px bg-slate-100" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-slate-100" />
          </div>

          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{
              gridTemplateColumns: "repeat(60, minmax(0, 1fr))",
              gridTemplateRows: `repeat(${hourRows.length}, ${rowHeightPx}px)`,
            }}
          >
            {blocks.map((b) => {
              const rowIndex = b.hour - startHour + 1;

              const rounding =
                b.isFirst && b.isLast
                  ? "rounded-lg"
                  : b.isFirst
                    ? "rounded-t-lg"
                    : b.isLast
                      ? "rounded-b-lg"
                      : "rounded-none";

              return (
                <div
                  key={b.key}
                  className={[
                    "mx-[2px] my-[2px] flex items-center shadow-sm",
                    rounding,
                  ].join(" ")}
                  style={{
                    gridRowStart: rowIndex,
                    gridRowEnd: rowIndex + 1,
                    gridColumnStart: b.colStart,
                    gridColumnEnd: b.colEnd,
                    background: b.bg,
                    border: "1px solid rgba(255,255,255,0.35)",
                  }}
                >
                  {b.title ? (
                    <span className="px-2 text-[11px] font-semibold text-white/95">
                      {b.title}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
