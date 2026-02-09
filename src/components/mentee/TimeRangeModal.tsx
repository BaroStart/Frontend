import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Control } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type Meridiem = "AM" | "PM";

export type TimeRangeValue = {
  start: { meridiem: Meridiem; hour: number; minute: number };
  end: { meridiem: Meridiem; hour: number; minute: number };
};

type Props = {
  open: boolean;
  title?: string;
  initialValue?: TimeRangeValue;
  onClose: () => void;
  onSubmit: (value: TimeRangeValue) => void;
};

function toMinutes(m: Meridiem, hour12: number, minute: number) {
  const h = hour12 % 12; // 12 -> 0
  const h24 = m === "PM" ? h + 12 : h;
  return h24 * 60 + minute;
}

const schema = z
  .object({
    startMeridiem: z.enum(["AM", "PM"]),
    startHour: z.number().int().min(1, "1~12").max(12, "1~12"),
    startMinute: z.number().int().min(0, "0~59").max(59, "0~59"),

    endMeridiem: z.enum(["AM", "PM"]),
    endHour: z.number().int().min(1, "1~12").max(12, "1~12"),
    endMinute: z.number().int().min(0, "0~59").max(59, "0~59"),
  })
  .superRefine((v, ctx) => {
    const start = toMinutes(v.startMeridiem, v.startHour, v.startMinute);
    const end = toMinutes(v.endMeridiem, v.endHour, v.endMinute);
    if (end <= start) {
      ctx.addIssue({
        code: "custom",
        path: ["endHour"],
        message: "종료 시간이 시작 시간보다 늦어야 해요.",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function TimeRangeModal({
  open,
  title = "공부 기록 추가",
  initialValue,
  onClose,
  onSubmit,
}: Props) {
  const firstFocusRef = useRef<HTMLButtonElement | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: {
      startMeridiem: initialValue?.start.meridiem ?? "AM",
      startHour: initialValue?.start.hour ?? 5,
      startMinute: initialValue?.start.minute ?? 0,

      endMeridiem: initialValue?.end.meridiem ?? "AM",
      endHour: initialValue?.end.hour ?? 7,
      endMinute: initialValue?.end.minute ?? 53,
    },
  });

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    form.reset({
      startMeridiem: initialValue?.start.meridiem ?? "AM",
      startHour: initialValue?.start.hour ?? 5,
      startMinute: initialValue?.start.minute ?? 0,
      endMeridiem: initialValue?.end.meridiem ?? "AM",
      endHour: initialValue?.end.hour ?? 7,
      endMinute: initialValue?.end.minute ?? 53,
    });

    const t = window.setTimeout(() => firstFocusRef.current?.focus(), 0);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, initialValue, onClose, form]);

  if (!open) return null;

  const errorMsg =
    form.formState.errors.endHour?.message ||
    form.formState.errors.endMinute?.message ||
    form.formState.errors.startHour?.message ||
    form.formState.errors.startMinute?.message;

  const handleSubmit = form.handleSubmit((v) => {
    onSubmit({
      start: { meridiem: v.startMeridiem, hour: v.startHour, minute: v.startMinute },
      end: { meridiem: v.endMeridiem, hour: v.endHour, minute: v.endMinute },
    });
  });

  const modal = (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        aria-label="닫기"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-5">
        <div className="w-full max-w-[min(400px,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            <div className="text-center">
              <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
              <p className="mt-0.5 text-xs text-slate-400">시작/종료 시간을 입력해주세요</p>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
                <TimeRow
                  label="시작"
                  firstRef={firstFocusRef}
                  control={form.control}
                  hourName="startHour"
                  minuteName="startMinute"
                  meridiemName="startMeridiem"
                />
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
                <TimeRow
                  label="종료"
                  control={form.control}
                  hourName="endHour"
                  minuteName="endMinute"
                  meridiemName="endMeridiem"
                />
              </div>

              {errorMsg && (
                <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">
                  {errorMsg}
                </div>
              )}

              <div className="flex shrink-0 justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-extrabold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-[hsl(var(--brand))] px-4 py-2 text-sm font-extrabold text-white hover:opacity-90 active:scale-[0.99]"
              >
                저장
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

const ROW_HEIGHT = "h-12";

function TimeRow({
  label,
  firstRef,
  control,
  hourName,
  minuteName,
  meridiemName,
}: {
  label: string;
  firstRef?: React.RefObject<HTMLButtonElement | null>;
  control: Control<FormValues>;
  hourName: "startHour" | "endHour";
  minuteName: "startMinute" | "endMinute";
  meridiemName: "startMeridiem" | "endMeridiem";
}) {
  const inputCls =
    `${ROW_HEIGHT} w-12 sm:w-14 rounded-xl border border-slate-200 bg-white text-center text-lg font-bold text-slate-900 tabular-nums outline-none transition focus:border-[hsl(var(--brand))] focus:ring-2 focus:ring-[hsl(var(--brand))]/20 sm:text-xl [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

  return (
    <div className={`flex min-w-0 items-center gap-3 sm:gap-4 ${ROW_HEIGHT}`}>
      <span className="w-10 shrink-0 text-sm font-bold text-slate-700 sm:w-12">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:gap-4">
        <Controller
          control={control}
          name={meridiemName}
          render={({ field }) => (
            <div className={`flex ${ROW_HEIGHT} shrink-0 items-center rounded-xl border border-slate-200 bg-white p-1`}>
              <button
                ref={firstRef}
                type="button"
                onClick={() => field.onChange("AM")}
                className={[
                  "flex h-9 flex-1 min-w-0 items-center justify-center rounded-lg px-3 text-xs font-bold transition sm:h-10 sm:px-4 sm:text-sm",
                  field.value === "AM"
                    ? "bg-[hsl(var(--brand))] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100",
                ].join(" ")}
              >
                오전
              </button>
              <button
                type="button"
                onClick={() => field.onChange("PM")}
                className={[
                  "flex h-9 flex-1 min-w-0 items-center justify-center rounded-lg px-3 text-xs font-bold transition sm:h-10 sm:px-4 sm:text-sm",
                  field.value === "PM"
                    ? "bg-[hsl(var(--brand))] text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100",
                ].join(" ")}
              >
                오후
              </button>
            </div>
          )}
        />
        <div className={`flex ${ROW_HEIGHT} shrink-0 items-center gap-1.5 sm:gap-2`}>
          <Controller
            control={control}
            name={hourName}
            render={({ field }) => (
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={pad2(Number(field.value))}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const v = Number.isFinite(raw) ? Math.max(1, Math.min(12, raw)) : 1;
                  field.onChange(v);
                }}
                className={inputCls}
              />
            )}
          />
          <span className={`flex ${ROW_HEIGHT} items-center justify-center text-xl font-bold text-slate-300`}>:</span>
          <Controller
            control={control}
            name={minuteName}
            render={({ field }) => (
              <input
                type="number"
                inputMode="numeric"
                min={0}
                max={59}
                value={pad2(Number(field.value))}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const v = Number.isFinite(raw) ? Math.max(0, Math.min(59, raw)) : 0;
                  field.onChange(v);
                }}
                className={inputCls}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
