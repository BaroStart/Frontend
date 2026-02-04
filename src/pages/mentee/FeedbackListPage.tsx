import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { TodayFeedbackCard } from "@/components/mentee/feedbacklist/TodayFeedbackSection";
import { FeedbackSummarySection } from "@/components/mentee/feedbacklist/FeedbackSummarySection";
import { SubjectFilter } from "@/components/mentee/feedbacklist/SubjectFilter";
import { FeedbackCard } from "@/components/mentee/feedbacklist/FeedbackCard";

type Subject = "ALL" | "KOREAN" | "ENGLISH" | "MATH";

export function FeedbackListPage() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject>("ALL");

  const dummyFeedback = {
    id: "1",
    mentorName: "김민준",
    timeAgoText: "4시간 전",
    subject: "ENGLISH" as const, 
    message: "영어 독해에서 주제로 찾기가 아직 어려워 보이네요. 내일 추가 자료를 드릴게요.",
  };

  return (
    <div className="px-4 py-6">
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
            subject: "MATH" as any, 
          },
          {
            id: "2",
            mentorName: "김민준",
            timeAgoText: "4시간 전",
            message: "영어 독해에서 주제문 찾기가 아직 어려워 보여요.",
            subject: "ENGLISH" as any,
          },
        ]}
        onClickItem={(it) => console.log("open assignment for:", it.id)}
      />

      <SubjectFilter value={subject} onChange={setSubject} />

      <div className="mt-4">
        <FeedbackCard
          item={{
            id: "1",
            subject: "ENGLISH", 
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