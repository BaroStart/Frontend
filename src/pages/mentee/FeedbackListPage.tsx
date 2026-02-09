import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyDocIcon } from '@/components/icons';
import { FeedbackCard, type FeedbackItem } from '@/components/mentee/feedbacklist/FeedbackCard';
import { PlannerSummaryCard } from '@/components/mentee/feedbacklist/PlannerSummaryCard';
import { Calendar, type DayMeta } from '@/components/mentee/main/Calendar';
import { type Subject, SubjectTabs } from '@/components/mentee/SubjectTabs';
import { type FeedbackSubjectItem, MOCK_FEEDBACK_BY_SUBJECT } from '@/data/feedbackSubjectMock';
import { toYmdLocal } from '@/lib/dateUtils';
import { toSubjectEnum } from '@/lib/subjectUtils';

const SUBJECT_ENUM_TO_LABEL: Record<string, string> = {
  KOREAN: '국어',
  ENGLISH: '영어',
  MATH: '수학',
  ETC: '기타',
};

export function FeedbackListPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject>('ALL');
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const dateKey = useMemo(() => toYmdLocal(selectedDate), [selectedDate]);

  const feedbacks: FeedbackItem[] = useMemo(() => {
    const items: FeedbackSubjectItem[] = MOCK_FEEDBACK_BY_SUBJECT[dateKey] ?? [];
    return items.map(
      (it): FeedbackItem => ({
        id: it.id,
        subject: it.subject,
        mentorName: it.mentorName,
        content: it.feedbackSummary,
        timeText: it.timeText,
        assignmentCount: it.assignmentCount,
        assignmentId: it.assignmentIds[0],
        status: it.status !== 'NO_FEEDBACK' ? it.status : undefined,
        assignmentTitles: it.assignmentTitles,
      }),
    );
  }, [dateKey]);

  const filtered = useMemo(() => {
    if (subject === 'ALL') return feedbacks;
    return feedbacks.filter((x) => {
      const subjectLabel = SUBJECT_ENUM_TO_LABEL[x.subject];
      return toSubjectEnum(subjectLabel ?? '') === subject;
    });
  }, [feedbacks, subject]);

  const metaByDate = useMemo(() => {
    const meta: Record<string, DayMeta> = {};
    for (const [dk, items] of Object.entries(MOCK_FEEDBACK_BY_SUBJECT)) {
      if (items.length > 0) {
        meta[dk] = { assignmentCount: items.length };
      }
    }
    return meta;
  }, []);

  return (
    <div className="flex flex-1 flex-col bg-slate-50/50 pb-6">
      <div className="px-4 pt-4">
        <Calendar value={selectedDate} onChange={setSelectedDate} metaByDate={metaByDate} defaultExpanded={false} />
      </div>
      <div className="mt-3">
        <SubjectTabs value={subject} onChange={setSubject} />
      </div>

      <div className="flex flex-1 flex-col px-4 pt-4">
        <PlannerSummaryCard
          title="플래너 총평"
          message="집중 시간이 꾸준히 늘고 있고, 과제 미루는 횟수도 줄었어요. 다음 주는 영어 독해 루틴을 하루 10분만 더 확보해보면 더 좋아질 것 같아요."
          coachName="김민준 멘토"
          updatedText="오늘"
        />

        {filtered.length > 0 ? (
          <div className="mt-4 space-y-3">
            {filtered.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                onClick={() => {
                  if (item.assignmentId) {
                    navigate(`/mentee/assignments/${item.assignmentId}`);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <EmptyDocIcon className="mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm text-slate-400">등록된 피드백이 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
