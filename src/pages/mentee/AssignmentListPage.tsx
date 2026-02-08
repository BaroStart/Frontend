import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { BookOpen, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { AssignmentIcon, EnglishIcon, KoreanIcon, MathIcon } from "@/components/icons";
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

  const getSubjectIcon = (s: string) => {
    switch (s) {
      case "수학":
        return <MathIcon className="h-6 w-6 text-[#0E9ABE]" />;
      case "영어":
        return <EnglishIcon className="h-6 w-6 text-[#0E9ABE]" />;
      case "국어":
        return <KoreanIcon className="h-6 w-6 text-[#0E9ABE]" />;
      default:
        return <AssignmentIcon className="h-6 w-6 text-[#0E9ABE]" />;
    }
  };

  const filteredAssignments = useMemo(() => {
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

    if (subject === "ALL") return byDate;

    return byDate.filter((a) => toSubjectEnum(a.subject) === subject);
  }, [menteeId, selectedDate, subject, userKey]);

  return (
    <div className="flex h-full flex-col gap-2 bg-white px-4 pt-4">
      <header>
        <div className="grid grid-cols-3 items-center">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="이전 날짜"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-gray-500">
              <CalendarDays className="h-4 w-4" />
              <span className="text-sm font-semibold tracking-tight">{formatKoreanDate(selectedDate)}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              aria-label="다음 날짜"
            >
              <ChevronRight className="h-6 w-6" />
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

      <div className="flex-1 space-y-5 px-6 pb-20">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            <button
              key={assignment.id}
              type="button"
              onClick={() => navigate(`/mentee/assignments/${assignment.id}`)}
              className="w-full rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100">
                  {getSubjectIcon(assignment.subject)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {assignment.subject}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        assignment.status === "완료"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>

                  <h3 className="truncate text-base font-bold text-gray-900">
                    {assignment.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                    {assignment.description}
                  </p>
                  <p className="mt-2 text-xs text-gray-400">
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
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
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
