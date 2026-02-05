import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import { Copy, FileUp, Save } from 'lucide-react';

import { registerAssignment } from '@/api/assignments';
import { ColumnEditor } from '@/components/mentor/ColumnEditor';
import { LoadFromDateModal } from '@/components/mentor/LoadFromDateModal';
import { TempSaveListModal } from '@/components/mentor/TempSaveListModal';
import { WeekdaySelector } from '@/components/mentor/WeekdaySelector';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { TimePicker } from '@/components/ui/time-picker';
import {
  MOCK_DRAFT_ASSIGNMENTS,
  MOTIVATIONAL_COLUMN_TEMPLATES,
  SUBJECT_COLUMN_TEMPLATES,
} from '@/data/assignmentRegisterMock';
import { MOCK_MENTEE_TASKS } from '@/data/menteeDetailMock';
import { useMentee } from '@/hooks/useMentee';
import { useMenteeKpi } from '@/hooks/useMenteeDetail';
import { useMentees } from '@/hooks/useMentees';
import { cn } from '@/lib/utils';
import { useLearningGoalStore } from '@/stores/useLearningGoalStore';

const MAIN_SUBJECTS = ['국어', '영어', '수학'] as const;

interface EditAssignmentState {
  title: string;
  goal: string;
  subject: string;
  columnContent: string;
}

export function AssignmentRegisterPage() {
  const { menteeId: urlMenteeId } = useParams<{ menteeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editAssignment = (location.state as { editAssignment?: EditAssignmentState })
    ?.editAssignment;
  const { data: mentees = [] } = useMentees();
  const { data: selectedMentee } = useMentee(urlMenteeId ?? undefined);
  const { data: kpi } = useMenteeKpi(urlMenteeId ?? undefined);

  const [menteeId, setMenteeId] = useState(urlMenteeId ?? '');
  const [dateMode, setDateMode] = useState<'single' | 'recurring'>('single');
  const [singleDate, setSingleDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [recurringStartDate, setRecurringStartDate] = useState('');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [recurringEndTime, setRecurringEndTime] = useState('23:59');
  const [title, setTitle] = useState('');
  const [goal, setGoal] = useState('');
  const [subject, setSubject] = useState<(typeof MAIN_SUBJECTS)[number]>('국어');
  const [improvementPointId, setImprovementPointId] = useState('');
  const [columnContent, setColumnContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [materialTab, setMaterialTab] = useState<'column' | 'pdf'>('column');
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string }[]>(
    [],
  );

  const [tempSaveModalOpen, setTempSaveModalOpen] = useState(false);
  const [loadFromDateModalOpen, setLoadFromDateModalOpen] = useState(false);
  const [loadMessage, setLoadMessage] = useState<'success' | 'empty' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [motivationalTemplateId, setMotivationalTemplateId] = useState('');

  useEffect(() => {
    if (urlMenteeId) setMenteeId(urlMenteeId);
  }, [urlMenteeId]);

  useEffect(() => {
    if (dateMode === 'recurring' && !recurringStartDate && !recurringEndDate) {
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      setRecurringStartDate(fmt(today));
      setRecurringEndDate(fmt(nextWeek));
    }
  }, [dateMode]);

  useEffect(() => {
    if (editAssignment) {
      setTitle(editAssignment.title);
      setGoal(editAssignment.goal);
      setSubject(editAssignment.subject as (typeof MAIN_SUBJECTS)[number]);
      setColumnContent(editAssignment.columnContent);
      setEditorKey((k) => k + 1);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [editAssignment, navigate, location.pathname]);

  const displayMentee = menteeId
    ? (mentees.find((m) => m.id === menteeId) ?? selectedMentee)
    : null;

  const {
    getGoalsBySubject,
    initialize: initializeGoals,
    getMaterialsByIds,
  } = useLearningGoalStore();
  const CURRENT_MENTOR_ID = 'mentor1';

  useEffect(() => {
    initializeGoals(CURRENT_MENTOR_ID);
  }, [initializeGoals]);

  const learningGoals = useMemo(
    () => getGoalsBySubject(CURRENT_MENTOR_ID, subject),
    [getGoalsBySubject, subject],
  );

  const selectedGoal = learningGoals.find((g) => g.id === improvementPointId);

  const matchedMaterials = useMemo(() => {
    if (improvementPointId) {
      const goal = learningGoals.find((g) => g.id === improvementPointId);
      if (goal) return getMaterialsByIds(goal.materialIds || []);
    }
    return [];
  }, [improvementPointId, learningGoals, getMaterialsByIds]);

  const highlightDates = useMemo(() => {
    if (!menteeId) return [];
    return [
      ...new Set(MOCK_MENTEE_TASKS.filter((t) => t.menteeId === menteeId).map((t) => t.date)),
    ];
  }, [menteeId]);

  const handleRecurringDaysChange = (days: number[]) => {
    setRecurringDays(days);
  };

  const applyColumnTemplate = useCallback((template: string) => {
    setColumnContent(template);
    setEditorKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (improvementPointId) {
      setMotivationalTemplateId('');
      const goal = learningGoals.find((g) => g.id === improvementPointId);
      if (goal) {
        setGoal(goal.name);
        if (goal.columnTemplate) {
          applyColumnTemplate(goal.columnTemplate);
        }
      }
    }
  }, [improvementPointId, learningGoals, applyColumnTemplate]);

  const handleLoadFromDate = (dateToLoad: string) => {
    const tasks = MOCK_MENTEE_TASKS.filter((t) => t.menteeId === menteeId && t.date === dateToLoad);
    if (tasks.length > 0) {
      const first = tasks[0];
      setTitle(first.title);
      setGoal(`${first.subject} 학습`);
      const subjectMap: Record<string, (typeof MAIN_SUBJECTS)[number]> = {
        국어: '국어',
        영어: '영어',
        수학: '수학',
        과학: '수학',
        사회: '국어',
        자기주도: '국어',
      };
      const mappedSubject = subjectMap[first.subject] ?? '국어';
      setSubject(mappedSubject);
      const template = SUBJECT_COLUMN_TEMPLATES[mappedSubject] ?? SUBJECT_COLUMN_TEMPLATES.국어;
      applyColumnTemplate(`<h3>${first.title}</h3><p>과목: ${first.subject}</p>${template}`);
      setLoadMessage('success');
    } else {
      setLoadMessage('empty');
    }
    setTimeout(() => setLoadMessage(null), 3000);
  };

  const handleLoadDraft = (draft: (typeof MOCK_DRAFT_ASSIGNMENTS)[number]) => {
    setMenteeId(draft.menteeId);
    setTitle(draft.title);
    setSubject(
      (['국어', '영어', '수학'].includes(draft.subject)
        ? draft.subject
        : '국어') as (typeof MAIN_SUBJECTS)[number],
    );
    const template = SUBJECT_COLUMN_TEMPLATES[draft.subject] ?? SUBJECT_COLUMN_TEMPLATES.국어;
    applyColumnTemplate(template);
    setTempSaveModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((f) => {
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: `upload-${Date.now()}-${f.name}`,
          name: f.name,
          size: `${(f.size / 1024).toFixed(1)} KB`,
        },
      ]);
    });
    e.target.value = '';
  };

  const handleSubjectChange = (s: (typeof MAIN_SUBJECTS)[number]) => {
    setSubject(s);
    setImprovementPointId('');
    if (!columnContent.trim()) {
      const template = SUBJECT_COLUMN_TEMPLATES[s];
      if (template) applyColumnTemplate(template);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setIsSubmitting(true);

    if (!menteeId || !title.trim()) {
      setSubmitError('대상 학생과 과제 제목을 입력해 주세요.');
      setIsSubmitting(false);
      return;
    }

    if (dateMode === 'single') {
      if (!singleDate) {
        setSubmitError('과제 날짜를 선택해 주세요.');
        setIsSubmitting(false);
        return;
      }
    } else {
      if (!recurringDays.length) {
        setSubmitError('요일 반복 시 최소 1개 이상의 요일을 선택해 주세요.');
        setIsSubmitting(false);
        return;
      }
      if (!recurringStartDate) {
        setSubmitError('시작일을 선택해 주세요.');
        setIsSubmitting(false);
        return;
      }
      if (!recurringEndDate) {
        setSubmitError('종료일을 선택해 주세요.');
        setIsSubmitting(false);
        return;
      }
      if (recurringStartDate > recurringEndDate) {
        setSubmitError('시작일이 종료일보다 늦을 수 없습니다.');
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const result = await registerAssignment({
        menteeId,
        dateMode,
        singleDate: dateMode === 'single' ? singleDate : undefined,
        recurringDays: dateMode === 'recurring' ? recurringDays : undefined,
        recurringStartDate: dateMode === 'recurring' ? recurringStartDate : undefined,
        recurringEndDate: dateMode === 'recurring' ? recurringEndDate : undefined,
        recurringEndTime: dateMode === 'recurring' ? recurringEndTime : undefined,
        title: title.trim(),
        goal: goal.trim(),
        subject,
      });

      if (result.success) {
        // 캐시 즉시 갱신 후 이동 (미완료 과제에 바로 반영)
        queryClient.invalidateQueries({ queryKey: ['incompleteAssignments', menteeId] });
        await queryClient.refetchQueries({ queryKey: ['incompleteAssignments', menteeId] });
        queryClient.invalidateQueries({ queryKey: ['mentees'] });
        queryClient.invalidateQueries({ queryKey: ['submittedAssignments'] });
        const registeredDate = dateMode === 'single' ? singleDate : recurringStartDate;
        navigate(menteeId ? `/mentor/mentees/${menteeId}` : '/mentor', {
          state: { registeredDate },
        });
      } else {
        setSubmitError(result.message ?? '과제 등록에 실패했습니다.');
        setIsSubmitting(false);
      }
    } catch (err) {
      let msg = '과제 등록 중 오류가 발생했습니다. 다시 시도해 주세요.';
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response?: { data?: { message?: string } } }).response;
        if (res?.data?.message) msg = res.data.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      setSubmitError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 pb-12">
      {/* 액션 버튼 */}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" icon={Save} onClick={() => setTempSaveModalOpen(true)}>
          임시저장 목록
        </Button>
        <Button
          variant="outline"
          icon={Copy}
          onClick={() => setLoadFromDateModalOpen(true)}
          disabled={!menteeId}
        >
          이전 날짜 계획 불러오기
        </Button>
      </div>

      {loadMessage && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm',
            loadMessage === 'success' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800',
          )}
        >
          {loadMessage === 'success'
            ? '해당 날짜의 계획을 불러왔습니다.'
            : '해당 날짜에 등록된 과제가 없습니다.'}
        </div>
      )}

      {submitError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-5 text-lg font-semibold text-slate-900">기본 정보</h2>
          <div className="grid items-start gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="mentee">대상 학생 선택</Label>
              <Select value={menteeId} onValueChange={setMenteeId}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue placeholder="학생을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {mentees.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.grade} · {m.track})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>과제 날짜</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDateMode('single')}
                  className={cn(
                    'h-9 rounded-md px-3 text-sm font-medium transition-colors',
                    dateMode === 'single'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  단일 날짜
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('recurring')}
                  className={cn(
                    'h-9 rounded-md px-3 text-sm font-medium transition-colors',
                    dateMode === 'recurring'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  요일 반복
                </button>
                {dateMode === 'single' && (
                  <DatePicker value={singleDate} onChange={setSingleDate} placeholder="날짜 선택" />
                )}
              </div>
              {dateMode === 'recurring' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-600">반복 요일</p>
                    <WeekdaySelector
                      value={recurringDays}
                      onChange={handleRecurringDaysChange}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-end gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium text-slate-700">시작일</Label>
                      <DatePicker
                        value={recurringStartDate}
                        onChange={setRecurringStartDate}
                        placeholder="시작일 선택"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium text-slate-700">종료일</Label>
                      <DatePicker
                        value={recurringEndDate}
                        onChange={setRecurringEndDate}
                        placeholder="종료일 선택"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium text-slate-700">종료 시간</Label>
                      <TimePicker
                        value={recurringEndTime}
                        onChange={setRecurringEndTime}
                        placeholder="시간 선택"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {displayMentee && (
            <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4">
              <p className="text-sm font-medium text-slate-700">학생 정보 요약</p>
              <ul className="mt-2 space-y-1 text-xs text-slate-600">
                <li>현재 진도: 수학 - 미적분 2단원, 영어 - 독해 유형 2과</li>
                <li>최근 제출률: {kpi?.assignmentCompletionRate ?? 95}% (지난 20일 기준)</li>
                <li>평균 학습 시간: 4시간 30분/일</li>
              </ul>
            </div>
          )}
        </section>

        {/* 과제 상세 정보 */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">과제 상세 정보</h2>
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">과제 제목</Label>
              <Input
                id="title"
                placeholder="예: 2월 15일 수학 미적분 학습"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5 h-10"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>과목 선택</Label>
                <Select
                  value={subject}
                  onValueChange={(v) => handleSubjectChange(v as typeof subject)}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="과목을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAIN_SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>과제 목표 선택</Label>
                <Select value={improvementPointId} onValueChange={setImprovementPointId}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue placeholder="과제 목표를 선택하세요">
                      {selectedGoal && (
                        <span className="flex items-center gap-2">{selectedGoal.name}</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {learningGoals.length === 0 ? (
                      <div className="p-3 text-center text-sm text-slate-500">
                        등록된 과제 목표가 없습니다.
                        <br />
                        <span className="text-xs text-slate-400">
                          과제 관리 &gt; 과제 목표에서 추가하세요
                        </span>
                      </div>
                    ) : (
                      learningGoals.map((g) => (
                        <SelectItem key={g.id} value={g.id}>
                          <div className="flex items-center gap-2">
                            <span>{g.name}</span>
                            {g.materialIds && g.materialIds.length > 0 && (
                              <span className="text-xs text-slate-400">
                                ({g.materialIds.length}개 학습자료)
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">학습 자료</h2>
          <Tabs
            items={[
              { id: 'column' as const, label: '셀스터디 칼럼' },
              { id: 'pdf' as const, label: 'PDF 파일첨부' },
            ]}
            value={materialTab}
            onChange={setMaterialTab}
          />

          {materialTab === 'column' ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">
                  동기부여·학습법 칼럼 템플릿
                </p>
                <Select
                  value={motivationalTemplateId}
                  onValueChange={(id) => {
                    setMotivationalTemplateId(id);
                    if (id) {
                      const t = MOTIVATIONAL_COLUMN_TEMPLATES.find((m) => m.id === id);
                      if (t) applyColumnTemplate(t.content);
                    }
                  }}
                >
                  <SelectTrigger className="w-full max-w-md">
                    <SelectValue placeholder="선택 안 함 (과제 목표/과목 템플릿 또는 직접 작성)" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500">
                      생활 습관 & 동기부여
                    </div>
                    {MOTIVATIONAL_COLUMN_TEMPLATES.filter(
                      (m) => m.category === '생활 습관&동기부여',
                    ).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                    <div className="mt-1 border-t border-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-500">
                      국영수 공부법 시리즈
                    </div>
                    {MOTIVATIONAL_COLUMN_TEMPLATES.filter(
                      (m) => m.category === '국영수 공부법',
                    ).map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <ColumnEditor
                  key={editorKey}
                  defaultValue={columnContent}
                  onChange={setColumnContent}
                  placeholder="학습 가이드 내용을 입력하세요. 과목 선택 시 기본 템플릿이 표시될 수 있습니다."
                  minHeight="280px"
                />
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {matchedMaterials.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700">자동 매칭된 학습지</p>
                  <div className="space-y-2">
                    {matchedMaterials.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{m.title}</p>
                          {m.fileSize && <p className="text-xs text-slate-500">{m.fileSize}</p>}
                        </div>
                        <Button size="sm" variant="outline">
                          다운로드
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">추가 PDF 업로드</p>
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 py-8 transition-colors hover:border-slate-300 hover:bg-slate-50">
                  <FileUp className="h-10 w-10 text-slate-400" />
                  <span className="mt-2 text-sm text-slate-500">클릭하여 파일 업로드</span>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                    multiple
                  />
                </label>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                      >
                        <span className="text-sm font-medium">{f.name}</span>
                        <span className="text-xs text-slate-500">{f.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* 제출 */}
        <div className="flex justify-end gap-2">
          <Link to={menteeId ? `/mentor/mentees/${menteeId}` : '/mentor'}>
            <Button type="button" variant="outline">
              취소
            </Button>
          </Link>
          <Button type="submit" disabled={!menteeId || !title.trim() || isSubmitting}>
            {isSubmitting ? '등록 중...' : '과제 등록'}
          </Button>
        </div>
      </form>

      <LoadFromDateModal
        isOpen={loadFromDateModalOpen}
        onClose={() => setLoadFromDateModalOpen(false)}
        selectedDate={singleDate}
        highlightDates={highlightDates}
        onConfirm={handleLoadFromDate}
      />

      <TempSaveListModal
        isOpen={tempSaveModalOpen}
        onClose={() => setTempSaveModalOpen(false)}
        drafts={MOCK_DRAFT_ASSIGNMENTS}
        onLoadDraft={handleLoadDraft}
      />
    </div>
  );
}
