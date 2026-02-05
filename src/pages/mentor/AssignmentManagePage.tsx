import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  BookOpen,
  Calendar,
  Edit2,
  File,
  FileText,
  FolderOpen,
  Image,
  Layers,
  Plus,
  Search,
  Target,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { DefaultSelect } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { SUBJECT_SUBCATEGORIES } from '@/data/assignmentRegisterMock';
import {
  formatPlannerDuration,
  getPlannerRecordsByMenteeAndDate,
  type PlannerRecord,
} from '@/data/plannerMock';
import { useMentees } from '@/hooks/useMentees';
import { getTodayDateStr } from '@/lib/dateUtils';
import {
  deleteMaterial,
  getMaterialsMeta,
  initializeSeolstudyMaterials,
  type MaterialMeta,
  saveMaterial,
} from '@/lib/materialStorage';
import { getPlannerFeedback, savePlannerFeedback } from '@/lib/plannerFeedbackStorage';
import {
  getMaterialsByIds,
  type LearningGoal,
  useLearningGoalStore,
} from '@/stores/useLearningGoalStore';

type TabType = 'materials' | 'goals' | 'planner' | 'templates';
const CURRENT_MENTOR_ID = 'mentor1';
const TABS = [
  { id: 'materials' as TabType, label: '학습 자료', icon: FolderOpen },
  { id: 'goals' as TabType, label: '과제 목표', icon: Target },
  { id: 'planner' as TabType, label: '플래너 관리', icon: Calendar },
  { id: 'templates' as TabType, label: '과제 템플릿', icon: Layers },
];

export function AssignmentManagePage() {
  const [searchParams] = useSearchParams();
  const { data: mentees = [] } = useMentees();
  const { getGoalsByMentor, addGoal, updateGoal, deleteGoal, initialize } = useLearningGoalStore();

  // 탭 상태
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get('tab') as TabType | null;
    return tab && TABS.some((t) => t.id === tab) ? tab : 'materials';
  });

  // 학습 자료 상태
  const [materials, setMaterials] = useState<MaterialMeta[]>([]);
  const [materialFilter, setMaterialFilter] = useState({
    subject: '전체',
    subCategory: '전체',
    search: '',
  });
  const [uploadModal, setUploadModal] = useState<{
    open: boolean;
    files: { file: File; meta: Partial<MaterialMeta> }[];
  }>({ open: false, files: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 과제 목표 상태
  const [goalSearch, setGoalSearch] = useState('');
  const [goalModal, setGoalModal] = useState<{ open: boolean; editing: LearningGoal | null }>({
    open: false,
    editing: null,
  });

  // 플래너 상태
  const [planner, setPlanner] = useState({ menteeId: '', date: getTodayDateStr(), feedback: '' });

  // 초기화 + URL 탭 파라미터 동기화
  useEffect(() => {
    initializeSeolstudyMaterials();
    initialize(CURRENT_MENTOR_ID);
    setMaterials(getMaterialsMeta().map((m) => ({ ...m, subCategory: m.subCategory || '기타' })));

    const tab = searchParams.get('tab') as TabType | null;
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, [initialize, searchParams]);

  // 플래너 피드백 로드
  useEffect(() => {
    if (planner.menteeId && planner.date) {
      const saved = getPlannerFeedback(planner.menteeId, planner.date);
      setPlanner((prev) => ({ ...prev, feedback: saved?.feedbackText ?? '' }));
    }
  }, [planner.menteeId, planner.date]);

  // 파생 데이터
  const goals = useMemo(() => getGoalsByMentor(CURRENT_MENTOR_ID), [getGoalsByMentor]);
  const filteredGoals = useMemo(
    () =>
      goals.filter((g) => !goalSearch || g.name.toLowerCase().includes(goalSearch.toLowerCase())),
    [goals, goalSearch],
  );
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      const matchSubject =
        materialFilter.subject === '전체' || m.subject === materialFilter.subject;
      const matchSubCategory =
        materialFilter.subCategory === '전체' || m.subCategory === materialFilter.subCategory;
      const matchSearch =
        !materialFilter.search ||
        m.title.toLowerCase().includes(materialFilter.search.toLowerCase()) ||
        m.fileName.toLowerCase().includes(materialFilter.search.toLowerCase());
      return matchSubject && matchSubCategory && matchSearch;
    });
  }, [materials, materialFilter]);

  // 핸들러
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadModal({
      open: true,
      files: files.map((file) => ({
        file,
        meta: {
          title: file.name,
          fileName: file.name,
          fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
          fileType: file.type.includes('pdf')
            ? 'pdf'
            : file.type.startsWith('image/')
              ? 'image'
              : 'document',
          subject: '국어',
          subCategory: '비문학',
          uploadedAt: getTodayDateStr(),
          source: 'mentor' as const,
        },
      })),
    });
    e.target.value = '';
  };

  const handleUploadConfirm = async (items: { file: File; meta: MaterialMeta }[]) => {
    for (const { file, meta } of items) {
      const fullMeta = {
        ...meta,
        id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };
      await saveMaterial(fullMeta, file);
      setMaterials((prev) => [fullMeta, ...prev]);
    }
    setUploadModal({ open: false, files: [] });
  };

  const handleDeleteMaterial = async (material: MaterialMeta) => {
    if (!window.confirm(`"${material.title}" 자료를 삭제하시겠습니까?`)) return;
    await deleteMaterial(material.id);
    setMaterials((prev) => prev.filter((m) => m.id !== material.id));
  };

  const handleSaveGoal = (data: Omit<LearningGoal, 'id' | 'createdAt'>) => {
    if (goalModal.editing) {
      updateGoal(goalModal.editing.id, data);
    } else {
      addGoal(data);
    }
    setGoalModal({ open: false, editing: null });
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('이 과제 목표를 삭제하시겠습니까?')) deleteGoal(id);
  };

  const handleSavePlannerFeedback = () => {
    if (!planner.menteeId || !planner.date) return;
    savePlannerFeedback({
      id: `pf-${planner.menteeId}-${planner.date}`,
      menteeId: planner.menteeId,
      date: planner.date,
      feedbackText: planner.feedback,
      createdAt: new Date().toISOString(),
    });
    alert('피드백이 저장되었습니다.');
  };

  return (
    <div className="min-w-0 space-y-6">
      <Tabs
        items={TABS}
        value={activeTab}
        onChange={setActiveTab}
        rightContent={
          <Link to="/mentor/assignments/new">
            <Button icon={Plus}>새 과제 등록</Button>
          </Link>
        }
      />

      {/* 학습 자료 탭 */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {['전체', '국어', '영어', '수학'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() =>
                    setMaterialFilter((prev) => ({ ...prev, subject, subCategory: '전체' }))
                  }
                  className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${materialFilter.subject === subject ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  {subject}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="자료 검색..."
                value={materialFilter.search}
                onChange={(e) => setMaterialFilter((prev) => ({ ...prev, search: e.target.value }))}
                className="h-9 w-48 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <div className="ml-auto">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button type="button" icon={Upload} onClick={() => fileInputRef.current?.click()}>
                파일 업로드
              </Button>
            </div>
          </div>

          {uploadModal.open && (
            <MaterialUploadModal
              pendingFiles={uploadModal.files}
              onClose={() => setUploadModal({ open: false, files: [] })}
              onConfirm={handleUploadConfirm}
            />
          )}

          {filteredMaterials.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-12 w-12" />}
              message={
                materialFilter.search || materialFilter.subject !== '전체'
                  ? '검색 결과가 없습니다.'
                  : '등록된 학습 자료가 없습니다.'
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => (
                <MaterialCard
                  key={material.id}
                  material={material}
                  onDelete={() => handleDeleteMaterial(material)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 과제 목표 탭 */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="과제 목표 검색..."
                value={goalSearch}
                onChange={(e) => setGoalSearch(e.target.value)}
                className="h-9 w-48 rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>
            <Button
              icon={Plus}
              onClick={() => setGoalModal({ open: true, editing: null })}
              className="ml-auto"
            >
              새 과제 목표 추가
            </Button>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12">
              <BookOpen className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                {goalSearch ? '검색 결과가 없습니다' : '등록된 과제 목표가 없습니다'}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                과제 목표를 추가하여 과제 등록 시 활용하세요
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredGoals.map((goal) => (
                <LearningGoalCard
                  key={goal.id}
                  goal={goal}
                  materials={getMaterialsByIds(goal.materialIds || [])}
                  onEdit={() => setGoalModal({ open: true, editing: goal })}
                  onDelete={() => handleDeleteGoal(goal.id)}
                />
              ))}
            </div>
          )}

          {goalModal.open && (
            <LearningGoalModal
              goal={goalModal.editing}
              materials={materials}
              onSave={handleSaveGoal}
              onClose={() => setGoalModal({ open: false, editing: null })}
              mentorId={CURRENT_MENTOR_ID}
            />
          )}
        </div>
      )}

      {/* 플래너 관리 탭 */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">멘티 선택</label>
                <DefaultSelect
                  value={planner.menteeId}
                  onValueChange={(v) => setPlanner((prev) => ({ ...prev, menteeId: v }))}
                  placeholder="멘티를 선택하세요"
                  options={mentees.map((m) => ({
                    value: m.id,
                    label: `${m.name} (${m.grade} · ${m.track})`,
                  }))}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">날짜 선택</label>
                <input
                  type="date"
                  value={planner.date}
                  onChange={(e) => setPlanner((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {planner.menteeId ? (
            <PlannerContent
              menteeId={planner.menteeId}
              date={planner.date}
              feedback={planner.feedback}
              menteeName={mentees.find((m) => m.id === planner.menteeId)?.name ?? ''}
              onFeedbackChange={(v) => setPlanner((prev) => ({ ...prev, feedback: v }))}
              onSaveFeedback={handleSavePlannerFeedback}
            />
          ) : (
            <EmptyState
              icon={<Calendar className="h-12 w-12" />}
              message="멘티를 선택하면 플래너를 확인하고 피드백을 작성할 수 있습니다."
            />
          )}
        </div>
      )}

      {/* 과제 템플릿 탭 */}
      {activeTab === 'templates' && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800">과제 템플릿</h3>
          <p className="mt-2 max-w-md text-center text-sm text-slate-500">
            자주 사용하는 과제 템플릿을 저장하고 재사용할 수 있습니다.
          </p>
          <p className="mt-6 text-xs text-slate-400">준비 중입니다.</p>
        </div>
      )}
    </div>
  );
}

// 빈 상태 컴포넌트
function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
      <div className="text-slate-300">{icon}</div>
      <p className="mt-4 text-sm text-slate-500">{message}</p>
    </div>
  );
}

// 학습 자료 카드
function MaterialCard({ material, onDelete }: { material: MaterialMeta; onDelete: () => void }) {
  const FileIcon =
    material.fileType === 'pdf' ? FileText : material.fileType === 'image' ? Image : File;
  const isSeolstudy = material.source === 'seolstudy';

  return (
    <div
      className={`group relative rounded-xl border p-4 ${isSeolstudy ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isSeolstudy ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}
        >
          <FileIcon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-slate-900">{material.title}</h3>
            {isSeolstudy && (
              <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                설스터디
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{material.subject}</span>
            {material.subCategory && material.subCategory !== '기타' && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{material.subCategory}</span>
            )}
            <span>{material.fileSize}</span>
            <span>•</span>
            <span>{material.uploadedAt}</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
          title="삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// 플래너 콘텐츠
function PlannerContent({
  menteeId,
  date,
  feedback,
  menteeName,
  onFeedbackChange,
  onSaveFeedback,
}: {
  menteeId: string;
  date: string;
  feedback: string;
  menteeName: string;
  onFeedbackChange: (v: string) => void;
  onSaveFeedback: () => void;
}) {
  const records = getPlannerRecordsByMenteeAndDate(menteeId, date);
  const totalHours = (records.reduce((sum, r) => sum + r.durationMinutes, 0) / 60).toFixed(1);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">과제 (학습 기록)</h3>
          {records.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">
              해당 날짜에 기록된 학습이 없습니다.
            </p>
          ) : (
            <>
              <div className="mb-3 text-sm text-slate-600">총 학습 시간: {totalHours}시간</div>
              <div className="space-y-2">
                {records
                  .sort((a, b) => b.durationMinutes - a.durationMinutes)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2"
                    >
                      <span className="font-medium text-slate-900">{r.subject}</span>
                      <span className="font-mono text-sm text-slate-600">
                        {formatPlannerDuration(r.durationMinutes)}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-900">플래너 피드백</h3>
          <p className="mb-3 text-sm text-slate-500">
            {menteeName}님의 학습 기록을 확인하고 피드백을 작성해주세요.
          </p>
          <textarea
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
            placeholder="예: 오늘 수학 학습 시간이 가장 많았네요. 내일은 영어 독해 비중을 늘려보면 좋겠습니다."
            rows={5}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <div className="mt-3 flex justify-end">
            <Button type="button" onClick={onSaveFeedback}>
              피드백 저장
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-3 text-base font-semibold text-slate-900">타임라인</h3>
        {records.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-500">
            타임라인을 표시할 학습 기록이 없습니다.
          </p>
        ) : (
          <PlannerTimeline records={records} />
        )}
      </div>
    </div>
  );
}

// 타임라인
function PlannerTimeline({ records }: { records: PlannerRecord[] }) {
  const COLORS: Record<string, string> = {
    수학: 'bg-rose-200',
    영어: 'bg-violet-200',
    국어: 'bg-amber-200',
    문학: 'bg-amber-100',
    사탐: 'bg-emerald-200',
    한국사: 'bg-emerald-100',
    과탐: 'bg-sky-200',
    과학: 'bg-sky-200',
  };
  const hours = Array.from({ length: 15 }, (_, i) => i + 6);
  const sorted = [...records].sort((a, b) => (a.startHour ?? 0) - (b.startHour ?? 0));

  return (
    <div className="space-y-1">
      {hours.map((hour) => {
        const blocks = sorted.filter((r) => {
          const start = r.startHour ?? 0;
          const end = start + Math.ceil(r.durationMinutes / 60);
          return hour >= start && hour < end;
        });
        return (
          <div key={hour} className="flex items-center gap-2">
            <span className="w-8 shrink-0 text-xs text-slate-500">{hour}시</span>
            <div className="flex flex-1 gap-1">
              {blocks.map((r) => (
                <div
                  key={r.id}
                  className={`h-6 flex-1 rounded ${COLORS[r.subject] ?? 'bg-slate-200'}`}
                  title={`${r.subject} ${formatPlannerDuration(r.durationMinutes)}`}
                />
              ))}
              {blocks.length === 0 && <div className="h-6 flex-1 rounded bg-slate-50" />}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// 업로드 모달
function MaterialUploadModal({
  pendingFiles,
  onClose,
  onConfirm,
}: {
  pendingFiles: { file: File; meta: Partial<MaterialMeta> }[];
  onClose: () => void;
  onConfirm: (items: { file: File; meta: MaterialMeta }[]) => Promise<void>;
}) {
  const [items, setItems] = useState(pendingFiles);
  const [saving, setSaving] = useState(false);

  const updateItem = (index: number, updates: Partial<MaterialMeta>) => {
    setItems((prev) =>
      prev.map((p, i) => (i === index ? { ...p, meta: { ...p.meta, ...updates } } : p)),
    );
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const validItems = items.map((p) => ({
        file: p.file,
        meta: {
          ...p.meta,
          subject: p.meta.subject || '국어',
          subCategory: p.meta.subCategory || '비문학',
          title: p.meta.title || p.file.name,
          fileName: p.meta.fileName || p.file.name,
          fileSize: p.meta.fileSize || `${(p.file.size / 1024 / 1024).toFixed(2)} MB`,
          fileType: (p.meta.fileType || 'other') as MaterialMeta['fileType'],
          uploadedAt: p.meta.uploadedAt || getTodayDateStr(),
          source: 'mentor' as const,
        } as MaterialMeta,
      }));
      await onConfirm(validItems);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">학습 자료 업로드</h2>
          <p className="mt-1 text-sm text-slate-500">
            각 파일의 과목과 세부 분류를 선택한 후 업로드하세요.
          </p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-4">
              <p className="mb-3 truncate text-sm font-medium text-slate-900">{item.file.name}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">과목</label>
                  <DefaultSelect
                    value={item.meta.subject || '국어'}
                    onValueChange={(subject) =>
                      updateItem(index, {
                        subject,
                        subCategory: SUBJECT_SUBCATEGORIES[subject]?.[0] ?? '기타',
                      })
                    }
                    options={['국어', '영어', '수학', '과학', '사회']}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">세부 분류</label>
                  <DefaultSelect
                    value={item.meta.subCategory || '비문학'}
                    onValueChange={(v) => updateItem(index, { subCategory: v })}
                    options={SUBJECT_SUBCATEGORIES[item.meta.subject || '국어'] ?? ['기타']}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={saving}>
            {saving ? '업로드 중...' : '업로드'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// 과제 목표 카드
function LearningGoalCard({
  goal,
  materials,
  onEdit,
  onDelete,
}: {
  goal: LearningGoal;
  materials: { id: string; title: string; source: 'seolstudy' | 'mentor' }[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{goal.name}</h3>
          {goal.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500">{goal.description}</p>
          )}
        </div>
        <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {materials.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-1.5 text-xs font-medium text-slate-500">연결된 학습자료</p>
          <div className="flex flex-wrap gap-1.5">
            {materials.map((mat) => (
              <span
                key={mat.id}
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${mat.source === 'seolstudy' ? 'bg-blue-50 text-blue-700' : 'bg-slate-50 text-slate-600'}`}
              >
                {mat.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 과제 목표 모달
function LearningGoalModal({
  goal,
  materials,
  onSave,
  onClose,
  mentorId,
}: {
  goal: LearningGoal | null;
  materials: MaterialMeta[];
  onSave: (data: Omit<LearningGoal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  mentorId: string;
}) {
  const [name, setName] = useState(goal?.name || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [selectedIds, setSelectedIds] = useState<string[]>(goal?.materialIds || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      mentorId,
      name: name.trim(),
      description: description.trim() || undefined,
      materialIds: selectedIds,
    });
  };

  const toggleMaterial = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <h2 className="text-lg font-semibold text-slate-900">
            {goal ? '과제 목표 수정' : '새 과제 목표 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">과제 목표 이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 비문학 지문 구조 파악"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="과제 목표에 대한 간단한 설명"
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">연결 학습자료</label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200">
              {materials.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">등록된 학습자료가 없습니다</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {materials.map((mat) => (
                    <label
                      key={mat.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={selectedIds.includes(mat.id)}
                        onCheckedChange={() => toggleMaterial(mat.id)}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-sm">{mat.title}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                          {mat.subject}
                        </span>
                        {mat.source === 'seolstudy' && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                            설스터디
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit">{goal ? '수정' : '추가'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
