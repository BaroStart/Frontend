import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SubjectFilterChip } from "@/components/mentee/SubjectFilterChip";
import { FeedbackCard, type FeedbackItem } from "@/components/mentee/feedbacklist/FeedbackCard";
import { PlannerSummaryCard } from "@/components/mentee/feedbacklist/PlannerSummaryCard";
import {
  MOCK_FEEDBACK_BY_SUBJECT,
  type FeedbackSubjectItem,
} from "@/data/feedbackSubjectMock";

type Subject = "ALL" | "KOREAN" | "ENGLISH" | "MATH";

function formatKoreanDate(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function addDays(d: Date, diff: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + diff);
  return next;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmdKeyLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function ChevronLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FeedbackListPage() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject>("ALL");
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const dateText = useMemo(() => formatKoreanDate(selectedDate), [selectedDate]);
  const dateKey = useMemo(() => toYmdKeyLocal(selectedDate), [selectedDate]);

  const dummySubjectFeedbacks: FeedbackItem[] = useMemo(() => {
    const items: FeedbackSubjectItem[] = MOCK_FEEDBACK_BY_SUBJECT[dateKey] ?? [];
    return items.map((it): FeedbackItem => ({
      id: it.id,
      subject: it.subject,
      mentorName: it.mentorName,
      content: it.feedbackSummary,
      timeText: it.timeText,
      assignmentCount: it.assignmentCount,
      assignmentId: it.assignmentIds[0],
      status: it.status !== "NO_FEEDBACK" ? it.status : undefined,
      assignmentTitles: it.assignmentTitles,
    }));
  }, [dateKey]);

  const filterTabs = useMemo(() => {
    const hasAll = dummySubjectFeedbacks.length > 0;
    const hasKorean = dummySubjectFeedbacks.some((f) => f.subject === "KOREAN");
    const hasEnglish = dummySubjectFeedbacks.some((f) => f.subject === "ENGLISH");
    const hasMath = dummySubjectFeedbacks.some((f) => f.subject === "MATH");
    const items: { label: string; value: Subject }[] = [];
    if (hasAll) items.push({ label: "전체", value: "ALL" });
    if (hasKorean) items.push({ label: "국어", value: "KOREAN" });
    if (hasEnglish) items.push({ label: "영어", value: "ENGLISH" });
    if (hasMath) items.push({ label: "수학", value: "MATH" });
    return items;
  }, [dummySubjectFeedbacks]);

  const filtered = useMemo(() => {
    const s = filterTabs.some((t) => t.value === subject) ? subject : (filterTabs[0]?.value ?? "ALL");
    if (s === "ALL") return dummySubjectFeedbacks;
    return dummySubjectFeedbacks.filter((x) => x.subject === s);
  }, [dummySubjectFeedbacks, subject, filterTabs]);

  const effectiveSubject = filterTabs.some((t) => t.value === subject)
    ? subject
    : (filterTabs[0]?.value ?? "ALL");

  return (
    <div className="flex min-h-0 flex-col px-4 pt-5 pb-24">
      <header className="mb-6 shrink-0">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 active:scale-95"
              aria-label="이전 날짜"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900">피드백</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-400">{dateText}</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="grid h-10 w-10 place-items-center rounded-full text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 active:scale-95"
              aria-label="다음 날짜"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-6">
        <PlannerSummaryCard
          title="플래너 총평"
          message="집중 시간이 꾸준히 늘고 있고, 과제 미루는 횟수도 줄었어요. 다음 주는 영어 독해 루틴을 하루 10분만 더 확보해보면 더 좋아질 것 같아요."
          coachName="김민준 멘토"
          updatedText="오늘"
        />

        <div className="shrink-0 pt-2">
          <SubjectFilterChip
            items={filterTabs}
            value={effectiveSubject}
            onChange={(v) => setSubject(v as Subject)}
          />
        </div>

        <div className="mt-4 rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
          {filtered.map((item, idx) => (
            <FeedbackCard
              key={item.id}
              item={item}
              index={idx}
              onOpenAssignment={(id) => navigate(`/mentee/assignments/${id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
