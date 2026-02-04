import { Calendar, Clock, Copy, FileUp, Save, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { registerAssignment } from '@/api/assignments';

import { ColumnEditor } from '@/components/mentor/ColumnEditor';
import { DatePickerModal } from '@/components/mentor/DatePickerModal';
import { LoadFromDateModal } from '@/components/mentor/LoadFromDateModal';
import { TempSaveListModal } from '@/components/mentor/TempSaveListModal';
import { WeekdaySelector } from '@/components/mentor/WeekdaySelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  MOCK_DRAFT_ASSIGNMENTS,
  MOCK_IMPROVEMENT_POINTS,
  MOCK_LEARNING_MATERIALS,
  MOTIVATIONAL_COLUMN_TEMPLATES,
  SUBJECT_COLUMN_TEMPLATES,
  SUBJECT_SUBCATEGORIES,
} from '@/data/assignmentRegisterMock';
import { MOCK_MENTEE_TASKS } from '@/data/menteeDetailMock';
import { useMentees } from '@/hooks/useMentees';
import { useMentee } from '@/hooks/useMentee';
import { useMenteeKpi } from '@/hooks/useMenteeDetail';
import { cn } from '@/lib/utils';

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
  const editAssignment = (location.state as { editAssignment?: EditAssignmentState })?.editAssignment;
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
  const [subjectSubCategory, setSubjectSubCategory] = useState('');
  const [improvementPointId, setImprovementPointId] = useState('');
  const [improvementPointSearch, setImprovementPointSearch] = useState('');
  const [columnContent, setColumnContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const [materialTab, setMaterialTab] = useState<'column' | 'pdf'>('column');
  const [uploadedFiles, setUploadedFiles] = useState<{ id: string; name: string; size: string }[]>([]);

  const [tempSaveModalOpen, setTempSaveModalOpen] = useState(false);
  const [loadFromDateModalOpen, setLoadFromDateModalOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
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

  const displayMentee = menteeId ? mentees.find((m) => m.id === menteeId) ?? selectedMentee : null;

  const improvementPoints = useMemo(
    () => MOCK_IMPROVEMENT_POINTS.filter((ip) => ip.subject === subject),
    [subject]
  );

  const filteredImprovementPoints = useMemo(() => {
    if (!improvementPointSearch.trim()) return improvementPoints;
    const q = improvementPointSearch.toLowerCase();
    return improvementPoints.filter(
      (ip) =>
        ip.label.toLowerCase().includes(q) ||
        ip.subCategory.toLowerCase().includes(q) ||
        ip.description?.toLowerCase().includes(q)
    );
  }, [improvementPoints, improvementPointSearch]);

  const matchedMaterials = useMemo(() => {
    if (improvementPointId) {
      const ip = MOCK_IMPROVEMENT_POINTS.find((p) => p.id === improvementPointId);
      if (ip) return MOCK_LEARNING_MATERIALS.filter((m) => ip.materialIds.includes(m.id));
    }
    return [];
  }, [improvementPointId]);

  const highlightDates = useMemo(() => {
    if (!menteeId) return [];
    return [...new Set(MOCK_MENTEE_TASKS.filter((t) => t.menteeId === menteeId).map((t) => t.date))];
  }, [menteeId]);

  const handleRecurringDaysChange = (days: number[]) => {
    setRecurringDays(days);
  };

  const applyColumnTemplate = useCallback(
    (template: string) => {
      setColumnContent(template);
      setEditorKey((k) => k + 1);
    },
    []
  );

  useEffect(() => {
    if (improvementPointId) {
      setMotivationalTemplateId('');
      const ip = MOCK_IMPROVEMENT_POINTS.find((p) => p.id === improvementPointId);
      if (ip?.columnTemplate) {
        applyColumnTemplate(ip.columnTemplate);
      }
    }
  }, [improvementPointId, applyColumnTemplate]);

  const handleLoadFromDate = (dateToLoad: string) => {
    const tasks = MOCK_MENTEE_TASKS.filter(
      (t) => t.menteeId === menteeId && t.date === dateToLoad
    );
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
      (['국어', '영어', '수학'].includes(draft.subject) ? draft.subject : '국어') as (typeof MAIN_SUBJECTS)[number]
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
        { id: `upload-${Date.now()}-${f.name}`, name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` },
      ]);
    });
    e.target.value = '';
  };

  const handleSubjectChange = (s: (typeof MAIN_SUBJECTS)[number]) => {
    setSubject(s);
    setSubjectSubCategory('');
    setImprovementPointId('');
    setImprovementPointSearch('');
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

  const formatDisplayDate = (d: string) => {
    const [y, m, day] = d.split('-');
    return `${y}. ${parseInt(m, 10)}. ${parseInt(day, 10)}.`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 sm:space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">과제 등록</h1>
          <p className="mt-1 text-sm text-slate-500">
            학생들에게 학습 과제를 등록하고 커리큘럼을 관리하세요
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTempSaveModalOpen(true)}
          >
            <Save className="h-4 w-4" />
            임시저장 목록
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLoadFromDateModalOpen(true)}
            disabled={!menteeId}
          >
            <Copy className="h-4 w-4" />
            이전 날짜 계획 불러오기
          </Button>
        </div>
      </div>

      {loadMessage && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm',
            loadMessage === 'success' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'
          )}
        >
          {loadMessage === 'success'
            ? '해당 날짜의 계획을 불러왔습니다.'
            : '해당 날짜에 등록된 과제가 없습니다.'}
        </div>
      )}

      {submitError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 기본 정보 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">기본 정보</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <Label htmlFor="mentee">대상 학생 선택</Label>
              <select
                id="mentee"
                value={menteeId}
                onChange={(e) => setMenteeId(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                <option value="">학생을 선택하세요</option>
                {mentees.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.grade} · {m.track})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">현재 담당인 학생 목록이 표시됩니다</p>
            </div>

            <div>
              <Label>과제 날짜</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDateMode('single')}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    dateMode === 'single' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  단일 날짜
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode('recurring')}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    dateMode === 'recurring' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  요일 반복
                </button>
                {dateMode === 'single' && (
                  <button
                    type="button"
                    onClick={() => setDatePickerOpen(true)}
                    className="flex h-10 min-w-[140px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors hover:border-slate-300"
                  >
                    <span className="flex-1 text-left text-slate-700">
                      {singleDate ? formatDisplayDate(singleDate) : '연도-월-일'}
                    </span>
                    <Calendar className="h-5 w-5 shrink-0 text-slate-400" />
                  </button>
                )}
              </div>
              {dateMode === 'recurring' && (
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-slate-600">반복 요일</p>
                    <WeekdaySelector
                      value={recurringDays}
                      onChange={handleRecurringDaysChange}
                      className="w-full max-w-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="min-w-0">
                      <Label className="text-xs">시작일</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          type="date"
                          value={recurringStartDate}
                          onChange={(e) => setRecurringStartDate(e.target.value)}
                          className="h-10 min-w-0 flex-1"
                        />
                        <Calendar className="h-5 w-5 shrink-0 text-slate-400" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs">종료일</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          type="date"
                          value={recurringEndDate}
                          onChange={(e) => setRecurringEndDate(e.target.value)}
                          className="h-10 min-w-0 flex-1"
                        />
                        <Calendar className="h-5 w-5 shrink-0 text-slate-400" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <Label className="text-xs">종료 시간</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          type="time"
                          value={recurringEndTime}
                          onChange={(e) => setRecurringEndTime(e.target.value)}
                          className="h-10 min-w-0 flex-1"
                        />
                        <Clock className="h-5 w-5 shrink-0 text-slate-400" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    선택한 요일에 동일 과제가 자동 생성됩니다
                  </p>
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
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900 sm:text-lg">과제 상세 정보</h2>
          <div className="space-y-4">
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
            <div>
              <Label htmlFor="goal">과제 목표</Label>
              <textarea
                id="goal"
                placeholder="이번 과제를 통해 학생이 달성해야 할 구체적인 목표를 작성하세요"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                rows={3}
                className="mt-1.5 flex w-full rounded-lg border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div>
              <Label>과목 선택</Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {MAIN_SUBJECTS.map((s) => (
                  <label
                    key={s}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 transition-colors',
                      subject === s ? 'border-slate-800 bg-slate-50' : 'border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <input
                      type="radio"
                      name="subject"
                      value={s}
                      checked={subject === s}
                      onChange={() => handleSubjectChange(s)}
                      className="rounded-full border-slate-300 text-slate-800"
                    />
                    <span className="text-sm font-medium">{s}</span>
                  </label>
                ))}
              </div>
              {SUBJECT_SUBCATEGORIES[subject]?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUBJECT_SUBCATEGORIES[subject].map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setSubjectSubCategory(sub)}
                      className={cn(
                        'rounded-lg px-2.5 py-1 text-xs font-medium transition-colors',
                        subjectSubCategory === sub ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
            

          </div>
        </section>

        {/* 목표(보완점) 선택 */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">목표(보완점) 선택</h2>
          <p className="mb-4 text-sm text-slate-500">
            설스터디에서 정의한 보완점을 선택하면 연결된 학습지가 자동 매칭됩니다. 선택 시 칼럼 템플릿이 있을 경우 에디터에 자동 채워집니다.
          </p>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="보완점 검색 (예: 단어, 독해, 문법...)"
                value={improvementPointSearch}
                onChange={(e) => setImprovementPointSearch(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200">
              {filteredImprovementPoints.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">검색 결과가 없습니다</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredImprovementPoints.map((ip) => (
                    <label
                      key={ip.id}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50',
                        improvementPointId === ip.id && 'bg-slate-50'
                      )}
                    >
                      <input
                        type="radio"
                        name="improvementPoint"
                        value={ip.id}
                        checked={improvementPointId === ip.id}
                        onChange={() => setImprovementPointId(ip.id)}
                        className="mt-1 rounded-full border-slate-300 text-slate-800"
                      />
                      <div>
                        <p className="font-medium text-slate-900">{ip.label}</p>
                        <p className="text-xs text-slate-500">
                          {ip.subCategory}
                          {ip.description && ` · ${ip.description}`}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 학습 자료 & 칼럼 편집 */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-900">학습 자료</h2>
          <p className="mb-4 text-sm text-slate-500">
            셀스터디 칼럼 작성 또는 PDF 파일을 업로드하세요. 칼럼은 이미 작성된 템플릿이 있으면 자동으로 채워지며, 없으면 빈 에디터로 시작합니다.
          </p>
          <div className="flex gap-1 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setMaterialTab('column')}
              className={cn(
                'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                materialTab === 'column' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              셀스터디 칼럼
            </button>
            <button
              type="button"
              onClick={() => setMaterialTab('pdf')}
              className={cn(
                'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                materialTab === 'pdf' ? 'border-slate-800 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              PDF 파일첨부
            </button>
          </div>

          {materialTab === 'column' ? (
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium text-slate-600">동기부여·학습법 칼럼 템플릿</p>
                <p className="mb-2 text-xs text-slate-500">
                  [설스터디] 서울대쌤 칼럼 형식으로 동기부여 또는 학습법 칼럼을 추가할 수 있습니다.
                </p>
                <select
                  value={motivationalTemplateId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setMotivationalTemplateId(id);
                    if (id) {
                      const t = MOTIVATIONAL_COLUMN_TEMPLATES.find((m) => m.id === id);
                      if (t) applyColumnTemplate(t.content);
                    }
                  }}
                  className="h-10 w-full max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="">선택 안 함 (보완점/과목 템플릿 또는 직접 작성)</option>
                  <optgroup label="생활 습관&동기부여">
                    {MOTIVATIONAL_COLUMN_TEMPLATES.filter((m) => m.category === '생활 습관&동기부여').map(
                      (m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      )
                    )}
                  </optgroup>
                  <optgroup label="국영수 공부법 시리즈">
                    {MOTIVATIONAL_COLUMN_TEMPLATES.filter((m) => m.category === '국영수 공부법').map(
                      (m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      )
                    )}
                  </optgroup>
                </select>
              </div>
              <div>
                <p className="mb-2 text-xs text-slate-500">
                  {columnContent
                    ? '칼럼 내용이 입력되어 있습니다. 수정하거나 추가로 작성해 보세요.'
                    : '과목 또는 보완점을 선택하면 템플릿이 표시될 수 있습니다. 직접 작성해도 됩니다.'}
                </p>
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
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} multiple />
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

      <DatePickerModal
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        selectedDate={singleDate}
        highlightDates={highlightDates}
        onDateSelect={(d) => {
          setSingleDate(d);
          setDatePickerOpen(false);
        }}
      />

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
