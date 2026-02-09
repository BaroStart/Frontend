import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmptyDocIcon } from '@/components/icons';
import { AssignmentCard } from '@/components/mentee/AssignmentCard';
import { ProgressBar } from '@/components/mentee/ProgressBar';
import { type Subject, SubjectTabs } from '@/components/mentee/SubjectTabs';
import { WeekCalendar } from '@/components/mentee/WeekCalendar';
import { useMenteeAssignments } from '@/hooks/useMenteeAssignments';
import { mapListRes } from '@/lib/assignmentMapper';
import { toYmdLocal } from '@/lib/dateUtils';
import { toSubjectEnum } from '@/lib/subjectUtils';

export function AssignmentListPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject>('ALL');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const dueDate = toYmdLocal(selectedDate);
  const { data: rawList, isLoading, isError } = useMenteeAssignments({ dueDate });

  const allForDate = useMemo(() => {
    if (!rawList) return [];
    return rawList.map(mapListRes);
  }, [rawList]);

  const filtered = useMemo(() => {
    if (subject === 'ALL') return allForDate;
    return allForDate.filter((a) => toSubjectEnum(a.subject) === subject);
  }, [allForDate, subject]);

  const doneCount = allForDate.filter((a) => a.status === '완료').length;
  const total = allForDate.length;

  return (
    <div className="flex flex-1 flex-col bg-slate-50/50 pb-6">
      <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />
      <SubjectTabs value={subject} onChange={setSubject} />

      <div className="flex flex-1 flex-col px-4 pt-4">
        <ProgressBar doneCount={doneCount} total={total} />

        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
            <p className="text-sm text-slate-400">과제를 불러오는 중...</p>
          </div>
        ) : isError ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <EmptyDocIcon className="mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm text-slate-400">과제를 불러오지 못했어요</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-3">
            {filtered.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                onClick={() => navigate(`/mentee/assignments/${a.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center px-4">
            <EmptyDocIcon className="mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm text-slate-400">등록된 과제가 없어요</p>
          </div>
        )}
      </div>
    </div>
  );
}
