import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { TodayFeedbackCard } from "@/components/mentee/feedbacklist/TodayFeedbackSection";
import { FeedbackSummarySection } from "@/components/mentee/feedbacklist/FeedbackSummarySection";
import { SubjectFilter } from "@/components/mentee/feedbacklist/SubjectFilter";
import { FeedbackCard, type FeedbackItem } from "@/components/mentee/feedbacklist/FeedbackCard";

type Subject = "ALL" | "KOREAN" | "ENGLISH" | "MATH" | "ETC";

export function FeedbackListPage() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject>("ALL");

  const dummyFeedback = {
    id: "1",
    mentorName: "김민준",
    timeAgoText: "4시간 전",
    subject: "영어" as const,
    message: "영어 독해에서 주제로 찾기가 아직 어려워 보이네요. 내일 추가 자료를 드릴게요.",
  };

  const item: FeedbackItem = {
    id: "fb-1",
    subject: "ENGLISH",
    unitTitle: "독해",
    content: "영어 독해에서 주제문 찾기가 아직 어려워 보여요. 내일 추가 자료를 드릴게요.",
    mentorName: "김민준",
    createdAtText: "14:30",
    assignmentCount: 3,
    assignmentId: "a-1",
  };

  return (
    <div className="px-4 py-6">
      <TodayFeedbackCard
        item={dummyFeedback}
        onClick={(it) => {
          console.log("clicked feedback:", it.id);
        }}
      />

      <FeedbackSummarySection
        items={[
          {
            id: "1",
            mentorName: "김민준",
            timeAgoText: "2시간 전",
            message: "오늘 수학 문제 풀이 속도가 많이 개선되었습니다! 특히 미적분 파트에서 실수가 줄었어요. 👍",
            subject: "수학",
          },
          {
            id: "2",
            mentorName: "김민준",
            timeAgoText: "4시간 전",
            message: "영어 독해에서 주제문 찾기가 아직 어려워 보여요. 내일 추가 자료를 드릴게요.",
            subject: "영어",
          },
        ]}
        onClickItem={(it) => {
          console.log("open assignment for:", it.id);
        }}
      />

      <SubjectFilter value={subject} onChange={setSubject} />

      <div className="mt-4">
        <FeedbackCard
          item={{
            id: "1",
            subject: "영어",
            mentorName: "김민준",
            content: "영어 독해에서 주제문 찾기가 아직 어려워 보여요.",
            timeText: "4시간 전",
            assignmentId: "a-123",
          }}
          onOpenAssignment={(id) => navigate(`/assignments/${id}`)}
        />
      </div>
    </div>
  );
}
