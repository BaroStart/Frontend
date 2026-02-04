import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { SUBJECTS } from '@/data/menteeDetailMock';

interface ScheduleAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string;
  onSubmit: (data: { title: string; subject: string; date: string }) => void;
}

const SUBJECT_OPTIONS = SUBJECTS.filter((s) => s !== '전체');

export function ScheduleAddModal({
  isOpen,
  onClose,
  defaultDate,
  onSubmit,
}: ScheduleAddModalProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [date, setDate] = useState(defaultDate);

  useEffect(() => {
    if (isOpen) {
      setDate(defaultDate);
      setTitle('');
    }
  }, [isOpen, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit({ title: trimmed, subject, date });
    setTitle('');
    setSubject(SUBJECT_OPTIONS[0]);
    setDate(defaultDate);
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} aria-hidden />
      <div className="relative z-10 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">학습 일정 추가</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="schedule-title">제목</Label>
            <Input
              id="schedule-title"
              placeholder="예: 수학 미적분 연습문제"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="schedule-subject">과목</Label>
            <select
              id="schedule-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value as (typeof SUBJECT_OPTIONS)[number])}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              {SUBJECT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="schedule-date">날짜</Label>
            <Input
              id="schedule-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={!title.trim()}>
              추가
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
