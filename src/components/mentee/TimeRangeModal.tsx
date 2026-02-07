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

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-[360px] overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="px-6 pt-6">
            <h2 className="text-center text-[18px] font-extrabold text-gray-900">{title}</h2>
            <p className="mt-1 text-center text-xs text-gray-400">시작/종료 시간을 입력해주세요</p>
          </div>

          <div className="space-y-5 px-6 pb-5 pt-6">
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <Row label="시작">
                <MeridiemToggle
                  firstRef={firstFocusRef}
                  valueName="startMeridiem"
                  control={form.control}
                />
                <TimeBoxes control={form.control} hourName="startHour" minuteName="startMinute" />
              </Row>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
              <Row label="종료">
                <MeridiemToggle valueName="endMeridiem" control={form.control} />
                <TimeBoxes control={form.control} hourName="endHour" minuteName="endMinute" />
              </Row>
            </div>

            {errorMsg && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-500">
                {errorMsg}
              </div>
            )}

            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-extrabold text-gray-700 hover:bg-gray-50 active:scale-[0.99]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-extrabold text-white hover:bg-gray-800 active:scale-[0.99]"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="w-10 text-sm font-semibold text-gray-500">{label}</span>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}

function MeridiemToggle({
  control,
  valueName,
  firstRef,
}: {
  control: Control<FormValues>;
  valueName: "startMeridiem" | "endMeridiem";
  firstRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Controller
      control={control}
      name={valueName}
      render={({ field }) => (
        <div className="flex flex-col text-xs">
          <button
            ref={firstRef}
            type="button"
            onClick={() => field.onChange("AM")}
            className={[
              "px-1 text-left font-semibold",
              field.value === "AM" ? "text-blue-600" : "text-gray-400",
            ].join(" ")}
          >
            오전
          </button>
          <button
            type="button"
            onClick={() => field.onChange("PM")}
            className={[
              "px-1 text-left font-semibold",
              field.value === "PM" ? "text-blue-600" : "text-gray-400",
            ].join(" ")}
          >
            오후
          </button>
        </div>
      )}
    />
  );
}

function TimeBoxes({
  control,
  hourName,
  minuteName,
}: {
  control: Control<FormValues>;
  hourName: "startHour" | "endHour";
  minuteName: "startMinute" | "endMinute";
}) {
  const inputCls =
    "h-14 w-16 rounded-2xl border border-gray-200 bg-white text-center text-3xl font-extrabold text-gray-900 outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-900/10";
  return (
    <div className="flex items-center gap-2">
      <Controller
        control={control}
        name={hourName}
        render={({ field }) => (
          <input
            type="number"
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
      <span className="text-2xl text-gray-400">:</span>
      <Controller
        control={control}
        name={minuteName}
        render={({ field }) => (
          <input
            type="number"
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
  );
}
