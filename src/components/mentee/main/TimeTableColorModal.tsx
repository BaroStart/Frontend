import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  type TimetablePaletteId,
  TIMETABLE_PALETTES,
  getTimetablePaletteId,
  setTimetablePaletteId,
} from "@/lib/timetableColorStorage";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect?: () => void;
};

export function TimeTableColorModal({ open, onClose, onSelect }: Props) {
  const current = getTimetablePaletteId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSelect = (id: TimetablePaletteId) => {
    setTimetablePaletteId(id);
    onSelect?.();
    onClose();
  };

  const modal = (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="닫기"
        onClick={onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl">
          <h2 className="text-base font-bold text-gray-900">타임테이블 색상</h2>
          <p className="mt-1 text-xs text-gray-500">블록에 적용할 팔레트를 선택하세요</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {(Object.entries(TIMETABLE_PALETTES) as [TimetablePaletteId, (typeof TIMETABLE_PALETTES)[TimetablePaletteId]][]).map(
              ([id, { name, colors }]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  className={[
                    "flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition",
                    current === id ? "border-gray-900" : "border-gray-100 hover:border-gray-200",
                  ].join(" ")}
                >
                  <div className="flex gap-1">
                    {colors.slice(0, 6).map((c, i) => (
                      <div
                        key={i}
                        className="h-5 w-5 shrink-0 rounded"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{name}</span>
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
