import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { TodayFeedbackCard } from "@/components/mentee/feedbacklist/TodayFeedbackSection";
import { FeedbackSummarySection } from "@/components/mentee/feedbacklist/FeedbackSummarySection";
import { FeedbackCard, type FeedbackItem } from "@/components/mentee/feedbacklist/FeedbackCard";
import { PlannerSummaryCard } from "@/components/mentee/feedbacklist/PlannerSummaryCard";
import { twMerge } from "tailwind-merge";

type Subject = "ALL" | "KOREAN" | "ENGLISH" | "MATH";

const TABS: { label: string; value: Subject }[] = [
  { label: "전체", value: "ALL" },
  { label: "국어", value: "KOREAN" },
  { label: "영어", value: "ENGLISH" },
  { label: "수학", value: "MATH" },
];

function formatKoreanDate(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function addDays(d: Date, diff: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + diff);
  return next;
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

  const dummyFeedback = {
    id: "1",
    mentorName: "김민준 멘토",
    timeAgoText: "4시간 전",
    subject: "영어" as const,
    message: "영어 독해에서 주제로 찾기가 아직 어려워 보이네요. 내일 추가 자료를 드릴게요.",
  };

  const dummySubjectFeedbacks: FeedbackItem[] = [
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
    content:
      "시 감상에서 화자의 정서를 정확히 파악했어요.\n상징어 해석도 전반적으로 좋았습니다!",
    timeText: "13:10",
    assignmentCount: 2,
    assignmentId: "a-102",
  },
];

  return (
    <div className="px-4 py-6">
      <div className="ml-2 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">{dateText}</p>
            <h1 className="mt-1 text-xl font-extrabold tracking-tight text-gray-900">
              피드백
            </h1>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="grid h-10 w-10 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition"
              aria-label="이전 날짜"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="grid h-10 w-10 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 active:scale-95 transition"
              aria-label="다음 날짜"
            >
              <ChevronRightIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <PlannerSummaryCard
        title="플래너 총평"
        message="집중 시간이 꾸준히 늘고 있고, 과제 미루는 횟수도 줄었어요. 다음 주는 영어 독해 루틴을 하루 10분만 더 확보해보면 더 좋아질 것 같아요."
        coachName="김민준 멘토"
        updatedText="오늘"
      />

      <TodayFeedbackCard
        item={dummyFeedback}
        onClick={(it) => console.log("clicked feedback:", it.id)}
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

      <div className="px-4 -mx-4 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 py-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSubject(tab.value)}
              className={twMerge(
                "h-10 whitespace-nowrap rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-200 shadow-sm",
                subject === tab.value
                  ? "bg-[#0E9ABE] text-white shadow-[#0E9ABE]/30"
                  : "border border-gray-100 bg-white text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {dummySubjectFeedbacks.map((item) => (
          <FeedbackCard
            key={item.id}
            item={item}
            onOpenAssignment={(id) => navigate(`/mentee/assignments/${id}`)}
          />
        ))}
      </div>
    </div>
  );
}
