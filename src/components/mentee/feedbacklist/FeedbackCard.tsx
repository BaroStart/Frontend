import React from "react";
import { useNavigate } from "react-router-dom";

import { EnglishIcon, KoreanIcon, MathIcon, UserIcon } from "@/components/icons";

export type Subject = "KOREAN" | "ENGLISH" | "MATH" | "ETC";

export type FeedbackItem = {
  id: string;
  subject: Subject;
  mentorName: string;
  content: string;
  timeText?: string;
  assignmentCount?: number;
  assignmentId?: string;
};

type Props = {
  item: FeedbackItem;
  className?: string;
  onOpenAssignment?: (assignmentId: string) => void;
};

const SUBJECT_META: Record<Subject, { label: string; icon: React.ReactNode }> = {
  KOREAN: { label: "국어", icon: <KoreanIcon className="h-6 w-6 text-[#0E9ABE]" /> },
  ENGLISH: { label: "영어", icon: <EnglishIcon className="h-6 w-6 text-[#0E9ABE]" /> },
  MATH: { label: "수학", icon: <MathIcon className="h-6 w-6 text-[#0E9ABE]" /> },
  ETC: { label: "기타", icon: <UserIcon className="h-6 w-6 text-[#0E9ABE]" /> },
};

export function FeedbackCard({ item, className, onOpenAssignment }: Props) {
  const meta = SUBJECT_META[item.subject];
  const navigate = useNavigate();
  const canOpen = Boolean(item.assignmentId);

  return (
    <div
      className={[
        "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm",
        "transition hover:bg-slate-50 hover:shadow-md",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0E9ABE]/10 text-slate-700">
          {meta.icon}
        </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-slate-900">{meta.label}</span>
              {item.assignmentCount != null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  과제 {item.assignmentCount}개
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="truncate">{item.mentorName} 멘토</span>
              {item.timeText && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="shrink-0 text-slate-400">{item.timeText}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-slate-100 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          피드백
        </span>
      </div>

      <p className="mt-2.5 line-clamp-4 whitespace-pre-wrap break-keep text-sm leading-6 text-slate-700">
        {item.content}
      </p>

      <div className="mt-3 flex items-center justify-end">
        <button
          type="button"
          disabled={!canOpen}
          onClick={() => {
            if (!item.assignmentId) return;
            if (onOpenAssignment) {
              onOpenAssignment(item.assignmentId);
              return;
            }
            navigate(`/mentee/assignments/${item.assignmentId}`);
          }}
          className={[
            "rounded-xl px-3 py-2 text-sm font-extrabold transition",
            canOpen ? "text-[#0E9ABE] hover:bg-[#0E9ABE]/10" : "cursor-default text-slate-300",
          ].join(" ")}
        >
          과제 보기 <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
