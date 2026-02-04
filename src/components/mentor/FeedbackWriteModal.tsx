import { X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { Calendar } from '@/components/ui/Calendar';
import { Label } from '@/components/ui/Label';
import { useMentees } from '@/hooks/useMentees';
import { useSubmittedAssignments } from '@/hooks/useSubmittedAssignments';

interface FeedbackWriteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FeedbackWriteModal({ isOpen, onClose }: FeedbackWriteModalProps) {
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

  const filteredByMentee = useMemo(
    () => (menteeId ? pendingAssignments.filter((a) => a.menteeId === menteeId) : []),
    [menteeId, pendingAssignments]
  );

  const filteredByDate = useMemo(() => {
    if (!date) return filteredByMentee;
    return filteredByMentee.filter((a) => a.submittedAt.startsWith(date.replace(/-/g, '.')));
  }, [date, filteredByMentee]);

  const filteredBySubject = useMemo(() => {
    if (!subject) return filteredByDate;
    return filteredByDate.filter((a) => a.subject === subject);
  }, [subject, filteredByDate]);

  const assignmentsToShow = filteredBySubject;

  const highlightDates = useMemo(() => {
    return filteredByMentee.map((a) => a.submittedAt.split(' ')[0].replace(/\./g, '-'));
  }, [filteredByMentee]);

  const handleMenteeChange = (id: string) => {
    setMenteeId(id);
    setDate('');
    setSubject('');
    setAssignmentId('');
    const assignments = pendingAssignments.filter((a) => a.menteeId === id);
    if (assignments.length > 0) {
      const firstDate = assignments[0].submittedAt.split(' ')[0];
      const [y, m] = firstDate.split('.').map(Number);
      setCalendarYear(y);
      setCalendarMonth(m);
    }
  };

  const handleDateChange = (d: string) => {
    setDate(d);
    setSubject('');
    setAssignmentId('');
  };

  const handleSubjectChange = (s: string) => {
    setSubject(s);
    setAssignmentId('');
  };

  const handleSubmit = () => {
    if (!menteeId || !assignmentId) return;
    onClose();
    navigate(`/mentor/mentees/${menteeId}/feedback/${assignmentId}`);
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
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
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
            <select
              value={menteeId}
              onChange={(e) => handleMenteeChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">멘티를 선택하세요</option>
              {mentees.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.grade} · {m.track})
                </option>
              ))}
            </select>
          </div>

          {/* 날짜 선택 - 달력 */}
          <div className="space-y-2">
            <Label>날짜</Label>
            <Calendar
              year={calendarYear}
              month={calendarMonth}
              selectedDate={date || null}
              highlightDates={highlightDates}
              onDateSelect={handleDateChange}
              onMonthChange={(y, m) => {
                setCalendarYear(y);
                setCalendarMonth(m);
              }}
              className={!menteeId ? 'pointer-events-none opacity-50' : ''}
            />
          </div>

          {/* 과목 선택 */}
          <div className="space-y-2">
            <Label>과목</Label>
            <select
              value={subject}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              disabled={!menteeId}
            >
              <option value="">과목을 선택하세요</option>
              {Array.from(new Set(filteredByDate.map((a) => a.subject)))
                .sort()
                .map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
            </select>
          </div>

          {/* 과제명 선택 */}
          <div className="space-y-2">
            <Label>과제명</Label>
            <select
              value={assignmentId}
              onChange={(e) => setAssignmentId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              disabled={!menteeId}
            >
              <option value="">과제를 선택하세요</option>
              {assignmentsToShow.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.submittedAt})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!menteeId || !assignmentId}>
            피드백 작성하기
          </Button>
        </div>
      </div>
    </div>
  );
}
