import { useNavigate } from "react-router-dom";

export type Subject = "KOREAN" | "ENGLISH" | "MATH" | "ETC";

export type FeedbackItem = {
  id: string;
  subject: Subject;
  mentorName: string;
  content: string;
  timeText?: string;
  assignmentCount?: number;
  assignmentId?: string;
  status?: "NEW" | "READ";
  assignmentTitles?: string[];
};

type Props = {
  item: FeedbackItem;
  index?: number;
  className?: string;
  onOpenAssignment?: (assignmentId: string) => void;
};

const SUBJECT_LABELS: Record<Subject, string> = {
  KOREAN: "국어",
  ENGLISH: "영어",
  MATH: "수학",
  ETC: "기타",
};

export function FeedbackCard({ item, index = 0, className, onOpenAssignment }: Props) {
  const navigate = useNavigate();
  const canOpen = Boolean(item.assignmentId);
  const label = SUBJECT_LABELS[item.subject] ?? item.subject;
  const isNew = item.status === "NEW";
  const isFirst = index === 0;

  // 리듬감: 첫 카드·NEW 카드는 살짝 강조
  const isFeatured = isFirst || isNew;

  return (
    <div
      className={[
        "flex items-start gap-4 border-b border-slate-100 last:border-b-0",
        isFeatured ? "py-6 px-5 bg-white" : "py-5 px-5",
        className ?? "",
      ].join(" ")}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--brand))] opacity-70"
            aria-hidden
          />
          <span className={isFeatured ? "text-base font-bold text-slate-900" : "text-sm font-bold text-slate-800"}>
            {item.mentorName} 멘토
          </span>
          {isNew && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]">
              NEW
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] font-medium text-slate-500">
          {label}
          {item.timeText && ` · ${item.timeText}`}
        </p>

        <blockquote className="mt-3 rounded-xl border-l-[3px] border-[hsl(var(--brand))] bg-[hsl(var(--brand-light))]/30 border border-slate-100 px-4 py-3">
          <p className="text-sm leading-[1.6] text-slate-700 whitespace-pre-wrap break-keep line-clamp-4">
            {item.content}
          </p>
        </blockquote>

        {item.assignmentTitles && item.assignmentTitles.length > 0 && (
          <p className="mt-2 text-xs text-slate-500">
            {item.assignmentTitles.slice(0, 2).join(" · ")}
            {item.assignmentTitles.length > 2 && ` 외 ${item.assignmentTitles.length - 2}개`}
          </p>
        )}

        {canOpen && (
          <button
            type="button"
            onClick={() => {
              if (onOpenAssignment) {
                onOpenAssignment(item.assignmentId!);
              } else {
                navigate(`/mentee/assignments/${item.assignmentId}`);
              }
            }}
            className="mt-3 text-sm font-semibold text-slate-900 hover:text-slate-700 hover:underline"
          >
            과제 보기 →
          </button>
        )}
      </div>
    </div>
  );
}
