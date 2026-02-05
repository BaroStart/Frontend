import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Label } from '@/components/ui/Label';
import { DefaultSelect } from '@/components/ui/select';
import { useMentees } from '@/hooks/useMentees';
import { useSubmittedAssignments } from '@/hooks/useSubmittedAssignments';

interface FeedbackWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMenteeId?: string;
  initialAssignmentId?: string;
}

export function FeedbackWriteModal({
  isOpen,
  onClose,
  initialMenteeId,
  initialAssignmentId,
}: FeedbackWriteModalProps) {
  const navigate = useNavigate();
  const [menteeId, setMenteeId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [assignmentId, setAssignmentId] = useState<string>('');
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth() + 1);

  const { data: mentees = [] } = useMentees();
  const { data: submittedAssignments = [] } = useSubmittedAssignments();

  const pendingAssignments = useMemo(
    () => submittedAssignments.filter((a) => !a.feedbackDone),
    [submittedAssignments]
  );

  const filteredAssignments = useMemo(() => {
    let result = pendingAssignments;
    if (menteeId) {
      result = result.filter((a) => a.menteeId === menteeId);
    }
    if (date) {
      result = result.filter((a) => a.submittedAt.startsWith(date.replace(/-/g, '.')));
    }
    if (subject) {
      result = result.filter((a) => a.subject === subject);
    }
    return result;
  }, [pendingAssignments, menteeId, date, subject]);

  // 과제 목록에서 캘린더 하이라이트할 날짜 추출 (멘티 필터 적용)
  const highlightDates = useMemo(() => {
    const assignments = menteeId
      ? pendingAssignments.filter((a) => a.menteeId === menteeId)
      : pendingAssignments;
    return assignments.map((a) => a.submittedAt.split(' ')[0].replace(/\./g, '-'));
  }, [pendingAssignments, menteeId]);

  const subjectOptions = useMemo(() => {
    const assignments = menteeId
      ? pendingAssignments.filter((a) => a.menteeId === menteeId)
      : pendingAssignments;
    const subjects = Array.from(new Set(assignments.map((a) => a.subject))).sort();
    return subjects.map((s) => ({ value: s, label: s }));
  }, [pendingAssignments, menteeId]);

  const menteeOptions = useMemo(
    () =>
      mentees.map((m) => ({
        value: m.id,
        label: `${m.name} (${m.grade} · ${m.track})`,
      })),
    [mentees]
  );

  const assignmentOptions = useMemo(
    () =>
      filteredAssignments.map((a) => ({
        value: a.id,
        label: `${a.title} (${a.submittedAt})`,
      })),
    [filteredAssignments]
  );

  useEffect(() => {
    if (!isOpen) {
      setMenteeId('');
      setDate('');
      setSubject('');
      setAssignmentId('');
      return;
    }

    if (initialMenteeId) {
      setMenteeId(initialMenteeId);
      const assignments = pendingAssignments.filter((a) => a.menteeId === initialMenteeId);
      if (assignments.length > 0) {
        const firstDate = assignments[0].submittedAt.split(' ')[0];
        const [y, m] = firstDate.split('.').map(Number);
        setCalendarYear(y);
        setCalendarMonth(m);
      }
    }

    if (initialAssignmentId) {
      const assignment = pendingAssignments.find((a) => a.id === initialAssignmentId);
      if (assignment) {
        setAssignmentId(initialAssignmentId);
        setMenteeId(assignment.menteeId);
        setSubject(assignment.subject);
        const dateStr = assignment.submittedAt.split(' ')[0].replace(/\./g, '-');
        setDate(dateStr);
      }
    }
  }, [isOpen, initialMenteeId, initialAssignmentId, pendingAssignments]);

  const handleSubmit = () => {
    if (!assignmentId) return;
    const assignment = pendingAssignments.find((a) => a.id === assignmentId);
    if (!assignment) return;
    onClose();
    navigate(`/mentor/mentees/${assignment.menteeId}/feedback/${assignmentId}`);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">피드백 작성</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* 멘티 선택 */}
          <div className="space-y-2">
            <Label>멘티</Label>
            <DefaultSelect
              value={menteeId}
              onValueChange={setMenteeId}
              options={menteeOptions}
              placeholder="멘티를 선택하세요"
            />
          </div>

          {/* 날짜 선택 - 달력 */}
          <div className="space-y-2">
            <Label>날짜</Label>
            <Calendar
              year={calendarYear}
              month={calendarMonth}
              selectedDate={date || null}
              highlightDates={highlightDates}
              onDateSelect={setDate}
              onMonthChange={(y, m) => {
                setCalendarYear(y);
                setCalendarMonth(m);
              }}
            />
          </div>

          {/* 과목 선택 */}
          <div className="space-y-2">
            <Label>과목</Label>
            <DefaultSelect
              value={subject}
              onValueChange={setSubject}
              options={subjectOptions}
              placeholder="과목을 선택하세요"
            />
          </div>

          {/* 과제명 선택 */}
          <div className="space-y-2">
            <Label>과제명</Label>
            <DefaultSelect
              value={assignmentId}
              onValueChange={setAssignmentId}
              options={assignmentOptions}
              placeholder="과제를 선택하세요"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!assignmentId}>
            피드백 작성하기
          </Button>
        </div>
      </div>
    </div>
  );
}
