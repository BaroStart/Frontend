import { useEffect, useMemo, useState } from 'react';

import { BarChart3, Download, Edit, FileText, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { DefaultSelect } from '@/components/ui/select';
import { type AnalysisType, useComputedAnalysis } from '@/hooks/useComputedAnalysis';
import { useSubjectStudyTimes, useWeeklyPatterns } from '@/hooks/useLearningAnalysis';
import { useFeedbackItems, useIncompleteAssignments, useMenteeKpi } from '@/hooks/useMenteeDetail';
import { useMentees } from '@/hooks/useMentees';
import { exportToPdf, exportToWord } from '@/lib/reportExport';

type EditingState = {
  section: 'overall' | 'subject' | 'guidance' | null;
  data: Partial<AnalysisType> | null;
};

export function LearningAnalyticsSection() {
  const [selectedMenteeId, setSelectedMenteeId] = useState('');
  const [editing, setEditing] = useState<EditingState>({ section: null, data: null });
  const [analysis, setAnalysis] = useState<AnalysisType | null>(null);

  const { data: mentees = [] } = useMentees();
  const { data: kpi } = useMenteeKpi(selectedMenteeId || undefined);
  const selectedMentee = mentees.find((m) => m.id === selectedMenteeId);

  const { data: feedbackItems = [] } = useFeedbackItems(selectedMenteeId || undefined);
  const { data: incompleteAssignments = [] } = useIncompleteAssignments(
    selectedMenteeId || undefined,
  );
  const { data: subjectStudyTimes = [] } = useSubjectStudyTimes(selectedMenteeId || undefined);
  const { data: weeklyPatterns = [] } = useWeeklyPatterns(selectedMenteeId || undefined);

  const computedAnalysis = useComputedAnalysis({
    menteeId: selectedMenteeId,
    kpi,
    feedbackItems,
    incompleteAssignments,
    subjectStudyTimes,
    weeklyPatterns,
  });

  useEffect(() => {
    if (computedAnalysis) {
      setAnalysis(computedAnalysis);
      setEditing({ section: null, data: null });
    } else {
      setAnalysis(null);
    }
  }, [computedAnalysis]);

  const displayAnalysis = useMemo(
    () => (editing.data && editing.section ? { ...analysis!, ...editing.data } : analysis),
    [analysis, editing],
  );

  const startEditing = (section: EditingState['section']) => {
    if (!displayAnalysis) return;
    setEditing({
      section,
      data: {
        overallAnalysis:
          section === 'overall'
            ? { ...displayAnalysis.overallAnalysis }
            : displayAnalysis.overallAnalysis,
        subjectDetailedAnalysis:
          section === 'subject'
            ? { ...displayAnalysis.subjectDetailedAnalysis }
            : displayAnalysis.subjectDetailedAnalysis,
        overallGuidance:
          section === 'guidance'
            ? [...displayAnalysis.overallGuidance]
            : displayAnalysis.overallGuidance,
      },
    });
  };

  const saveEditing = () => {
    if (!analysis || !editing.data) return;
    const { section, data } = editing;
    if (section === 'overall' && data.overallAnalysis) {
      setAnalysis({ ...analysis, overallAnalysis: data.overallAnalysis });
    } else if (section === 'subject' && data.subjectDetailedAnalysis) {
      setAnalysis({ ...analysis, subjectDetailedAnalysis: data.subjectDetailedAnalysis });
    } else if (section === 'guidance' && data.overallGuidance) {
      setAnalysis({ ...analysis, overallGuidance: data.overallGuidance });
    }
    setEditing({ section: null, data: null });
  };

  const cancelEditing = () => setEditing({ section: null, data: null });

  const updateEditingData = (partial: Partial<AnalysisType>) => {
    setEditing((prev) => ({ ...prev, data: { ...prev.data, ...partial } }));
  };

  const handlePdfDownload = async () => {
    if (editing.section) {
      alert('편집 모드를 종료한 후 PDF를 다운로드해주세요.');
      return;
    }
    const reportContent = document.getElementById('analysis-report');
    if (!reportContent) return;
    try {
      await exportToPdf({
        reportElement: reportContent,
        menteeName: selectedMentee?.name || '학생',
      });
    } catch (err) {
      console.error(err);
      alert('PDF 다운로드 중 오류가 발생했습니다.');
    }
  };

  const handleWordDownload = async () => {
    if (!selectedMentee || !displayAnalysis || !kpi) return;
    try {
      await exportToWord({
        mentee: selectedMentee,
        kpi,
        analysis: displayAnalysis,
        weeklyPatterns,
        subjectStudyTimes,
      });
    } catch (err) {
      console.error(err);
      alert('Word 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <MenteeSelector
        mentees={mentees}
        selectedMenteeId={selectedMenteeId}
        onSelect={setSelectedMenteeId}
      />

      {selectedMenteeId && analysis && displayAnalysis ? (
        <>
          <div className="flex justify-end gap-2">
            <Button onClick={handlePdfDownload} className="no-print" icon={Download}>
              PDF 다운로드
            </Button>
            <Button
              onClick={handleWordDownload}
              variant="outline"
              className="no-print"
              icon={FileText}
            >
              Word 다운로드
            </Button>
          </div>

          <div
            id="analysis-report"
            className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-8 shadow-lg"
          >
            <ReportHeader mentee={selectedMentee} />
            <KpiSummary kpi={kpi} />
            <WeeklyPatternsChart weeklyPatterns={weeklyPatterns} />
            <SubjectStudyTimesChart subjectStudyTimes={subjectStudyTimes} />

            <StudyStyleSection
              displayAnalysis={displayAnalysis}
              isEditing={editing.section === 'overall'}
              editedData={editing.data?.overallAnalysis}
              onEdit={() => startEditing('overall')}
              onSave={saveEditing}
              onCancel={cancelEditing}
              onUpdate={(overallAnalysis) => updateEditingData({ overallAnalysis })}
            />

            <SubjectAnalysisSection
              displayAnalysis={displayAnalysis}
              isEditing={editing.section === 'subject'}
              editedData={editing.data?.subjectDetailedAnalysis}
              onEdit={() => startEditing('subject')}
              onSave={saveEditing}
              onCancel={cancelEditing}
              onUpdate={(subjectDetailedAnalysis) => updateEditingData({ subjectDetailedAnalysis })}
            />

            <TotalEvaluationSection
              displayAnalysis={displayAnalysis}
              isEditing={editing.section === 'guidance'}
              editedData={editing.data?.overallGuidance}
              onEdit={() => startEditing('guidance')}
              onSave={saveEditing}
              onCancel={cancelEditing}
              onUpdate={(overallGuidance) => updateEditingData({ overallGuidance })}
            />
          </div>
        </>
      ) : selectedMenteeId ? (
        <EmptyState message="데이터를 불러오는 중..." />
      ) : (
        <EmptyState message="멘티를 선택하면 학습 스타일, 강점, 약점, 개선점을 분석해드립니다." />
      )}
    </div>
  );
}

/* -------------------- 공통 컴포넌트 -------------------- */

function EditButtons({
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const btnClass =
    'flex items-center gap-1 rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100';
  if (!isEditing) {
    return (
      <button type="button" onClick={onEdit} className={btnClass}>
        <Edit className="h-3 w-3" /> 편집
      </button>
    );
  }
  return (
    <div className="flex gap-1">
      <button type="button" onClick={onSave} className={btnClass}>
        <Save className="h-3 w-3" /> 저장
      </button>
      <button type="button" onClick={onCancel} className={btnClass}>
        <X className="h-3 w-3" /> 취소
      </button>
    </div>
  );
}

function MenteeSelector({
  mentees,
  selectedMenteeId,
  onSelect,
}: {
  mentees: { id: string; name: string; grade: string; track: string }[];
  selectedMenteeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <label className="mb-2 block text-sm font-medium text-slate-700">분석할 멘티 선택</label>
      <DefaultSelect
        value={selectedMenteeId}
        onValueChange={onSelect}
        placeholder="멘티를 선택하세요"
        className="sm:max-w-xs"
        options={mentees.map((m) => ({
          value: m.id,
          label: `${m.name} (${m.grade} · ${m.track})`,
        }))}
      />
    </div>
  );
}

function ReportHeader({
  mentee,
}: {
  mentee: { name: string; grade: string; track: string } | null | undefined;
}) {
  return (
    <div className="mb-6 border-b-2 border-slate-800 pb-4">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">학생 학습 분석 리포트</h1>
      <div className="text-sm text-slate-600">
        <p>
          학생명: <span className="font-semibold">{mentee?.name}</span> | 학년: {mentee?.grade} |
          과정: {mentee?.track}
        </p>
        <p>
          작성일:{' '}
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
      <BarChart3 className="h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-lg font-semibold text-slate-800">학습 리포트</h3>
      <p className="mt-2 max-w-md text-center text-sm text-slate-500">{message}</p>
    </div>
  );
}

/* -------------------- KPI / 차트 -------------------- */

interface KpiData {
  totalStudyHours: number;
  studyHoursChange: number;
  assignmentCompletionRate: number;
  completionRateChange: number;
  averageScore: number;
  scoreChange: number;
  attendanceRate: number;
  attendanceChange: number;
}

function KpiSummary({ kpi }: { kpi: KpiData | null | undefined }) {
  if (!kpi) return null;
  return (
    <div className="mb-6 grid grid-cols-2 gap-3">
      <KpiCard
        title="총 학습 시간"
        value={`${kpi.totalStudyHours}시간`}
        change={kpi.studyHoursChange}
        suffix="시간"
      />
      <KpiCard
        title="과제 완료율"
        value={`${kpi.assignmentCompletionRate}%`}
        change={kpi.completionRateChange}
        suffix="%p"
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  change,
  suffix,
}: {
  title: string;
  value: string;
  change: number;
  suffix: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center">
      <p className="mb-1 text-xs text-slate-600">{title}</p>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      {change !== 0 && (
        <p className="mt-1 text-xs text-slate-600">
          {change > 0 ? '+' : ''}
          {change}
          {suffix}
        </p>
      )}
    </div>
  );
}

function WeeklyPatternsChart({
  weeklyPatterns,
}: {
  weeklyPatterns: { day: string; hours?: number }[];
}) {
  if (weeklyPatterns.length === 0) return null;
  const maxH = Math.max(...weeklyPatterns.map((p) => p.hours || 0), 1);
  const totalHours = weeklyPatterns.reduce((s, p) => s + (p.hours || 0), 0);
  const activeDays = weeklyPatterns.filter((p) => (p.hours || 0) > 0).length || 1;

  return (
    <div className="mb-6">
      <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">
        생활패턴 분석
      </h2>
      <div className="grid grid-cols-7 gap-2">
        {weeklyPatterns.map((pattern) => {
          const h = ((pattern.hours || 0) / maxH) * 100;
          return (
            <div key={pattern.day} className="text-center">
              <div className="mb-2 text-xs font-medium text-slate-600">{pattern.day}</div>
              <div className="relative mx-auto h-20 w-full rounded-t bg-slate-100">
                <div
                  className="absolute bottom-0 w-full rounded-t bg-slate-600"
                  style={{ height: `${Math.max(h, 5)}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-slate-700">{pattern.hours || 0}h</div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-1 font-semibold text-slate-700">주간 총 학습 시간</p>
          <p className="text-lg font-bold text-slate-900">{totalHours}시간</p>
        </div>
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="mb-1 font-semibold text-slate-700">평균 일일 학습 시간</p>
          <p className="text-lg font-bold text-slate-900">
            {(totalHours / activeDays).toFixed(1)}시간
          </p>
        </div>
      </div>
    </div>
  );
}

function SubjectStudyTimesChart({
  subjectStudyTimes,
}: {
  subjectStudyTimes: { subject: string; hours: number }[];
}) {
  if (subjectStudyTimes.length === 0) return null;
  const maxH = Math.max(...subjectStudyTimes.map((s) => s.hours), 1);

  return (
    <div className="mb-6">
      <h2 className="mb-3 border-b-2 border-slate-200 pb-2 text-base font-bold text-slate-900">
        과목별 학습 시간
      </h2>
      <div className="space-y-2">
        {subjectStudyTimes
          .sort((a, b) => b.hours - a.hours)
          .map((item) => (
            <div key={item.subject} className="flex items-center gap-3">
              <div className="w-20 text-sm font-medium text-slate-700">{item.subject}</div>
              <div className="flex-1">
                <div className="h-6 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-600"
                    style={{ width: `${(item.hours / maxH) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm font-semibold text-slate-900">
                {item.hours}시간
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* -------------------- 분석 섹션들 -------------------- */

interface SectionProps<T> {
  displayAnalysis: AnalysisType;
  isEditing: boolean;
  editedData: T | undefined;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onUpdate: (data: T) => void;
}

function StudyStyleSection({
  displayAnalysis,
  isEditing,
  editedData,
  onEdit,
  onSave,
  onCancel,
  onUpdate,
}: SectionProps<AnalysisType['overallAnalysis']>) {
  const data = displayAnalysis.overallAnalysis;
  if (!data || data.summary.length === 0) return null;

  const handleTextChange = (
    field: keyof typeof data,
    value: string,
    separator: ',' | '\n' = '\n',
  ) => {
    if (!editedData) return;
    onUpdate({
      ...editedData,
      [field]: value
        .split(separator)
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  return (
    <div className="mb-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-2">
        <h2 className="text-base font-bold text-slate-900">전반적인 학습 태도 및 공부 스타일</h2>
        <EditButtons isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} />
      </div>

      {isEditing && editedData ? (
        <div className="space-y-4">
          <TextareaField
            label="요약"
            value={editedData.summary.join('\n')}
            rows={4}
            onChange={(v) => handleTextChange('summary', v)}
          />
          <div className="grid grid-cols-2 gap-4">
            <TextareaField
              label="장점 (쉼표로 구분)"
              value={editedData.strengths.join(', ')}
              rows={2}
              onChange={(v) => handleTextChange('strengths', v, ',')}
            />
            <TextareaField
              label="약점 (쉼표로 구분)"
              value={editedData.weaknesses.join(', ')}
              rows={2}
              onChange={(v) => handleTextChange('weaknesses', v, ',')}
            />
          </div>
          <TextareaField
            label="지도 포인트 (쉼표로 구분)"
            value={editedData.guidancePoints.join(', ')}
            rows={2}
            onChange={(v) => handleTextChange('guidancePoints', v, ',')}
          />
        </div>
      ) : (
        <>
          <div className="space-y-3 text-sm leading-relaxed text-slate-700">
            {data.summary.map((text, idx) => (
              <p key={idx}>{text}</p>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {data.strengths.length > 0 && <TagList title="장점" items={data.strengths} />}
            {data.weaknesses.length > 0 && <TagList title="약점" items={data.weaknesses} />}
          </div>
          {data.guidancePoints.length > 0 && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold text-slate-700">지도 포인트</p>
              <p className="text-sm text-slate-800">{data.guidancePoints.join(', ')}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubjectAnalysisSection({
  displayAnalysis,
  isEditing,
  editedData,
  onEdit,
  onSave,
  onCancel,
  onUpdate,
}: SectionProps<AnalysisType['subjectDetailedAnalysis']>) {
  const data = displayAnalysis.subjectDetailedAnalysis;
  if (!data || Object.keys(data).length === 0) return null;

  return (
    <div className="mb-6" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
      <div className="mb-3 flex items-center justify-between border-b-2 border-slate-200 pb-2">
        <h2 className="text-base font-bold text-slate-900">과목별 상세 분석</h2>
        <EditButtons isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(data).map(([subject, details]) => (
          <div
            key={subject}
            className="rounded-lg border border-slate-200 bg-white p-4"
            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
          >
            <h3 className="mb-3 text-sm font-bold text-slate-900">{subject} 과목 분석</h3>
            {isEditing && editedData ? (
              <SubjectEditForm
                data={editedData[subject]}
                onUpdate={(newData) => onUpdate({ ...editedData, [subject]: newData })}
              />
            ) : (
              <SubjectDisplay data={details} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TotalEvaluationSection({
  displayAnalysis,
  isEditing,
  editedData,
  onEdit,
  onSave,
  onCancel,
  onUpdate,
}: SectionProps<string[]>) {
  const data = displayAnalysis.overallGuidance;
  if (!data || data.length === 0) return null;

  return (
    <div className="rounded-lg border-2 border-slate-300 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">종합 평가 및 상담 마무리 멘트</h2>
        <EditButtons isEditing={isEditing} onEdit={onEdit} onSave={onSave} onCancel={onCancel} />
      </div>
      {isEditing && editedData ? (
        <textarea
          value={editedData.join('\n')}
          onChange={(e) => onUpdate(e.target.value.split('\n').filter((t) => t.trim()))}
          rows={6}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      ) : (
        <div className="space-y-2 text-sm leading-relaxed text-slate-700">
          {data.map((g, idx) => (
            <p key={idx}>{g}</p>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------- 유틸 컴포넌트 -------------------- */

function TextareaField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="mb-2 text-xs font-semibold text-slate-700">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((s, idx) => (
          <span
            key={idx}
            className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

interface SubjectData {
  studyStyle: string[];
  weakAreas: string[];
  mistakeTypes: string[];
  guidanceDirection: string[];
}

function SubjectEditForm({
  data,
  onUpdate,
}: {
  data: SubjectData;
  onUpdate: (d: SubjectData) => void;
}) {
  const fields: { key: keyof SubjectData; label: string }[] = [
    { key: 'studyStyle', label: '학습 스타일' },
    { key: 'weakAreas', label: '취약한 부분' },
    { key: 'mistakeTypes', label: '실수 유형' },
    { key: 'guidanceDirection', label: '지도 방향' },
  ];

  return (
    <div className="space-y-3">
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-semibold text-slate-600">{label}</label>
          <textarea
            value={data?.[key]?.join('\n') || ''}
            onChange={(e) =>
              onUpdate({ ...data, [key]: e.target.value.split('\n').filter((t) => t.trim()) })
            }
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
          />
        </div>
      ))}
    </div>
  );
}

function SubjectDisplay({ data }: { data: SubjectData }) {
  const sections: { key: keyof SubjectData; label: string; bullet?: boolean }[] = [
    { key: 'studyStyle', label: '학습 스타일' },
    { key: 'weakAreas', label: '취약한 부분', bullet: true },
    { key: 'mistakeTypes', label: '실수 유형' },
    { key: 'guidanceDirection', label: '지도 방향' },
  ];

  return (
    <>
      {sections.map(({ key, label, bullet }) =>
        data[key]?.length > 0 ? (
          <div key={key} className="mb-3 last:mb-0">
            <p className="mb-1 text-xs font-semibold text-slate-600">{label}</p>
            {bullet ? (
              <ul className="space-y-0.5">
                {data[key].map((item, i) => (
                  <li key={i} className="text-xs text-slate-700">
                    • {item}
                  </li>
                ))}
              </ul>
            ) : (
              data[key].map((item, i) => (
                <p key={i} className="text-xs leading-relaxed text-slate-700">
                  {item}
                </p>
              ))
            )}
          </div>
        ) : null,
      )}
    </>
  );
}
