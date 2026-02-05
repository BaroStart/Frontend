import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import type { MenteeScores, MenteeSummary, SubjectScores } from '@/types';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentee: MenteeSummary | undefined;
  onSave: (data: Partial<MenteeSummary>) => void;
}

const SUBJECTS = ['korean', 'english', 'math'] as const;
const SUBJECT_LABELS: Record<(typeof SUBJECTS)[number], string> = {
  korean: '국어',
  english: '영어',
  math: '수학',
};

function numberToString(v: number | undefined): string {
  return v != null ? String(v) : '';
}

function stringToNumber(s: string): number | undefined {
  const n = parseFloat(s);
  return s.trim() && !Number.isNaN(n) ? n : undefined;
}

export function ProfileEditModal({ isOpen, onClose, mentee, onSave }: ProfileEditModalProps) {
  const [name, setName] = useState(mentee?.name ?? '');
  const [school, setSchool] = useState(mentee?.school ?? '');
  const [grade, setGrade] = useState(mentee?.grade ?? '');
  const [track, setTrack] = useState<MenteeSummary['track']>(mentee?.track ?? '이과');
  const [desiredMajor, setDesiredMajor] = useState(mentee?.desiredMajor ?? '');

  const [naesin, setNaesin] = useState<SubjectScores>({});
  const [mockExam, setMockExam] = useState<SubjectScores>({});

  const setNaesinScore = (subject: keyof SubjectScores, value: string) => {
    setNaesin((prev) => ({ ...prev, [subject]: stringToNumber(value) }));
  };
  const setMockExamScore = (subject: keyof SubjectScores, value: string) => {
    setMockExam((prev) => ({ ...prev, [subject]: stringToNumber(value) }));
  };

  const handleReset = () => {
    if (mentee) {
      setName(mentee.name);
      setSchool(mentee.school);
      setGrade(mentee.grade);
      setTrack(mentee.track);
      setDesiredMajor(mentee.desiredMajor ?? '');
      setNaesin(mentee.scores?.naesin ?? {});
      setMockExam(mentee.scores?.mockExam ?? {});
    }
  };

  useEffect(() => {
    if (isOpen && mentee) {
      setName(mentee.name);
      setSchool(mentee.school);
      setGrade(mentee.grade);
      setTrack(mentee.track);
      setDesiredMajor(mentee.desiredMajor ?? '');
      setNaesin(mentee.scores?.naesin ?? {});
      setMockExam(mentee.scores?.mockExam ?? {});
    }
  }, [isOpen, mentee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const scores: MenteeScores = {};
    if (Object.keys(naesin).some((k) => naesin[k as keyof SubjectScores] != null)) {
      scores.naesin = naesin;
    }
    if (Object.keys(mockExam).some((k) => mockExam[k as keyof SubjectScores] != null)) {
      scores.mockExam = mockExam;
    }
    onSave({
      name,
      school,
      grade,
      track,
      desiredMajor: desiredMajor || undefined,
      scores: Object.keys(scores).length > 0 ? scores : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">프로필 수정</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="profile-name"
            label="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            id="profile-school"
            label="학교"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="예: 서울 소재 일반고"
          />
          <Input
            id="profile-grade"
            label="학년"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="예: 고3"
          />
          <div className="space-y-2">
            <Label htmlFor="profile-track">계열</Label>
            <select
              id="profile-track"
              value={track}
              onChange={(e) => setTrack(e.target.value as MenteeSummary['track'])}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="이과">이과</option>
              <option value="문과">문과</option>
            </select>
          </div>
          <Input
            id="profile-major"
            label="희망 진로"
            value={desiredMajor}
            onChange={(e) => setDesiredMajor(e.target.value)}
            placeholder="예: 의학계열"
          />

          {/* 내신 성적 */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <Label className="mb-2 block text-sm font-medium text-slate-700">내신 (국영수)</Label>
            <div className="grid grid-cols-3 gap-2">
              {SUBJECTS.map((sub) => (
                <div key={sub}>
                  <Label htmlFor={`naesin-${sub}`} className="text-xs text-slate-500">
                    {SUBJECT_LABELS[sub]}
                  </Label>
                  <Input
                    id={`naesin-${sub}`}
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={numberToString(naesin[sub])}
                    onChange={(e) => setNaesinScore(sub, e.target.value)}
                    placeholder="-"
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 모의고사 성적 */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
            <Label className="mb-2 block text-sm font-medium text-slate-700">
              모의고사 (국영수)
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {SUBJECTS.map((sub) => (
                <div key={sub}>
                  <Label htmlFor={`mock-${sub}`} className="text-xs text-slate-500">
                    {SUBJECT_LABELS[sub]}
                  </Label>
                  <Input
                    id={`mock-${sub}`}
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={numberToString(mockExam[sub])}
                    onChange={(e) => setMockExamScore(sub, e.target.value)}
                    placeholder="-"
                    className="mt-0.5"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              초기화
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
