import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { MOCK_INCOMPLETE_ASSIGNMENTS } from "@/data/menteeDetailMock";
import { useAuthStore } from "@/stores/useAuthStore";
import { getSubmittedAssignments } from "@/lib/menteeAssignmentSubmissionStorage";
import { SubjectFilterChip } from "@/components/mentee/SubjectFilterChip"; 

// --- Types ---
type Status = "완료" | "미완료";

type Subject = "ALL" | "KOREAN" | "ENGLISH" | "MATH";

type Assignment = {
  id: string;
  subject: "국어" | "영어" | "수학" | string;
  title: string;
  description: string;
  submissionDate: string;
  status: Status;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmdKeyLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(d: Date, diff: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function formatKoreanDate(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function ymdToDot(ymd: string) {
  return ymd.replaceAll("-", ".");
}

function toSubmissionText(dateYmd: string, timeText?: string) {
  if (!timeText) return ymdToDot(dateYmd);
  return `${ymdToDot(dateYmd)} ${timeText}`;
}

function toSubjectEnum(korean: string): Exclude<Subject, "ALL"> | null {
  switch (korean) {
    case "국어":
      return "KOREAN";
    case "영어":
      return "ENGLISH";
    case "수학":
      return "MATH";
    default:
      return null;
  }
}

export function AssignmentListPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject>("ALL");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 1, 2)); // 2026-02-02

  const { user } = useAuthStore();
  const menteeId = user?.role === "mentee" && /^s\d+$/i.test(user.id) ? user.id : "s1";
  const userKey = user?.id ?? "";

  const { pending, completed } = useMemo(() => {
    const dateKey = toYmdKeyLocal(selectedDate);
    const submittedById = userKey ? getSubmittedAssignments(userKey) : {};

    const base = MOCK_INCOMPLETE_ASSIGNMENTS
      .filter((a) => a.menteeId === menteeId)
      .map((a): Assignment => {
        const dateYmd = a.completedAtDate ?? a.deadlineDate ?? dateKey;
        const isDone = a.status === "completed" || !!submittedById[a.id];

        return {
          id: a.id,
          subject: a.subject,
          title: a.title,
          description: a.description ?? "",
          submissionDate: isDone ? toSubmissionText(dateYmd, a.completedAt) : toSubmissionText(dateYmd, a.deadline),
          status: (isDone ? "완료" : "미완료") satisfies Status,
        };
      });

    const byDate = base.filter((a) => a.submissionDate.startsWith(ymdToDot(dateKey)));
    const filtered = subject === "ALL"
      ? byDate
      : byDate.filter((a) => toSubjectEnum(a.subject) === subject);

    const pending = filtered.filter((a) => a.status === "미완료");
    const completed = filtered.filter((a) => a.status === "완료");
    return { pending, completed };
  }, [menteeId, selectedDate, subject, userKey]);

  const dateText = formatKoreanDate(selectedDate);

  return (
    <div className="flex h-full flex-col gap-2 bg-white px-4 pt-5 pb-20">
      <header className="mb-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 active:scale-95"
              aria-label="이전 날짜"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900">과제</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-400">{dateText}</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 active:scale-95"
              aria-label="다음 날짜"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="mb-3 px-1">
        <SubjectFilterChip
          items={[
            { label: "전체", value: "ALL" },
            { label: "국어", value: "KOREAN" },
            { label: "영어", value: "ENGLISH" },
            { label: "수학", value: "MATH" },
          ]}
          value={subject}
          onChange={(v) => setSubject(v as Subject)}
        />
      </div>

      <div className="flex-1 space-y-4 px-1 pb-20 sm:px-2">
        {pending.length > 0 || completed.length > 0 ? (
          [...pending, ...completed].map((assignment) => (
            <button
              key={assignment.id}
              type="button"
              onClick={() => navigate(`/mentee/assignments/${assignment.id}`)}
              className="group w-full rounded-xl border-l-4 border-[hsl(var(--brand))] bg-white px-4 py-4 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="inline-flex h-5 items-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {assignment.subject}
                    </span>
                    <span
                      className={`inline-flex h-5 items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        assignment.status === "완료"
                          ? "bg-[hsl(var(--brand))] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                  <h3
                    className={`text-base font-bold leading-snug ${
                      assignment.status === "완료" ? "text-slate-400 line-through" : "text-slate-900"
                    }`}
                  >
                    {assignment.title}
                  </h3>
                  {assignment.description && (
                    <p
                      className={`mt-1 line-clamp-2 text-sm ${
                        assignment.status === "완료" ? "text-slate-500 line-through" : "text-slate-600"
                      }`}
                    >
                      {assignment.description}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-400">
                    {assignment.status === "완료"
                      ? `${assignment.submissionDate} 제출 완료`
                      : `마감 ${assignment.submissionDate}`}
                  </p>
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="mt-10 flex h-full w-full flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400">
              <BookOpen className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium text-gray-500">등록된 과제가 없습니다.</p>
            <p className="mt-1 text-sm text-gray-400">오늘은 자유로운 하루네요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
