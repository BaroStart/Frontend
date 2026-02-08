import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { SubjectFilterChip } from "@/components/mentee/SubjectFilterChip";
import { FeedbackSummarySection } from "@/components/mentee/feedbacklist/FeedbackSummarySection";
import { FeedbackCard, type FeedbackItem } from "@/components/mentee/feedbacklist/FeedbackCard";
import { PlannerSummaryCard } from "@/components/mentee/feedbacklist/PlannerSummaryCard";

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
    const byDate: Record<string, FeedbackItem[]> = {
      "2026-02-06": [
        {
          id: "f1",
          subject: "MATH",
          mentorName: "김민준",
          content:
            "오늘 풀이한 적분 문제에서 치환적분 활용이 정말 좋았습니다!\n다만 부호 실수가 2문제에서 보였어요.\n검산 습관을 들이면 충분히 줄일 수 있을 것 같아요.",
          timeText: "14:30",
          assignmentCount: 3,
          assignmentId: "a-101",
        },
        {
          id: "f2",
          subject: "KOREAN",
          mentorName: "김민준",
          content: "시 감상에서 화자의 정서를 정확히 파악했어요.\n상징어 해석도 전반적으로 좋았습니다!",
          timeText: "13:10",
          assignmentCount: 2,
          assignmentId: "a-102",
        },
      ],
      "2026-02-07": [
        {
          id: "f3",
          subject: "ENGLISH",
          mentorName: "김민준",
          content: "문단별 요약이 좋아요. 근거 문장 표시를 한 번 더 해보면 정확도가 더 올라갑니다.",
          timeText: "11:05",
          assignmentCount: 1,
          assignmentId: "a-201",
        },
      ],
    };
    return byDate[dateKey] ?? [];
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
    <div className="px-4 pt-4 pb-24">
      <header className="mb-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
              aria-label="이전 날짜"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center">
            <h1 className="text-lg font-extrabold tracking-tight text-gray-900">피드백</h1>
            <p className="mt-0.5 text-xs font-medium text-gray-400">{dateText}</p>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="grid h-9 w-9 place-items-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
              aria-label="다음 날짜"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <PlannerSummaryCard
          title="플래너 총평"
          message="집중 시간이 꾸준히 늘고 있고, 과제 미루는 횟수도 줄었어요. 다음 주는 영어 독해 루틴을 하루 10분만 더 확보해보면 더 좋아질 것 같아요."
          coachName="김민준 멘토"
          updatedText="오늘"
        />

        <FeedbackSummarySection
          items={[
            {
              id: "1",
              mentorName: "김민준",
              timeAgoText: "2시간 전",
              message: "오늘 수학 문제 풀이 속도가 많이 개선되었습니다!",
              subject: "수학" as any,
            },
            {
              id: "2",
              mentorName: "김민준",
              timeAgoText: "4시간 전",
              message: "영어 독해에서 주제문 찾기가 아직 어려워 보여요.",
              subject: "영어" as any,
            },
          ]}
          onClickItem={(it) => console.log("open assignment for:", it.id)}
        />

        <div className="mb-2">
          <SubjectFilterChip
            items={filterTabs}
            value={effectiveSubject}
            onChange={(v) => setSubject(v as Subject)}
          />
        </div>

        <div className="space-y-3">
          {filtered.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onOpenAssignment={(id) => navigate(`/mentee/assignments/${id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
