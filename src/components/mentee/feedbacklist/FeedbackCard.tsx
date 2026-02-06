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

const SUBJECT_META: Record<
  Subject,
  { label: string; icon: React.ReactNode }
> = {
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
        "w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0E9ABE]/10 text-slate-700">
          {meta.icon}
        </div>

        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900">{meta.label}</div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-4">
        <div className="flex gap-3">
          <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-black-100 text-slate-500 ring-1 ring-slate-200">
            <UserIcon className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-500">
              {item.mentorName} 멘토
            </div>

            <p className="mt-1 whitespace-pre-wrap break-keep text-sm font-medium leading-7 text-slate-700">
              {item.content}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          {item.timeText && (
            <span className="inline-flex items-center gap-1">
              {item.timeText}
            </span>
          )}
        </div>

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
          className={
            canOpen
              ? "font-bold text-slate-700 hover:text-slate-900"
              : "font-bold text-slate-300 cursor-default"
          }
        >
          과제 보기 <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
