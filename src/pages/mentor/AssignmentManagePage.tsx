import { useEffect, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { SUBJECT_SUBCATEGORIES } from '@/data/assignmentRegisterMock';
import {
  formatPlannerDuration,
  getPlannerRecordsByMenteeAndDate,
  type PlannerRecord,
} from '@/data/plannerMock';
import { useMentees } from '@/hooks/useMentees';
import {
  deleteMaterial,
  getMaterialsMeta,
  initializeSeolstudyMaterials,
  type MaterialMeta,
  saveMaterial,
} from '@/lib/materialStorage';
import { getPlannerFeedback, savePlannerFeedback } from '@/lib/plannerFeedbackStorage';
import { type LearningGoal, useLearningGoalStore } from '@/stores/useLearningGoalStore';

type TabType = 'materials' | 'goals' | 'planner' | 'templates';

interface MaterialItem extends MaterialMeta {}

const CURRENT_MENTOR_ID = 'mentor1';

export function AssignmentManagePage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('materials');
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const {
    getGoalsBySubject,
    addGoal,
    updateGoal,
    deleteGoal,
    getMaterialsByIds,
    initialize: initializeGoals,
  } = useLearningGoalStore();
  const [goalSubjectFilter, setGoalSubjectFilter] = useState<string>('전체');
  const [goalSearchQuery, setGoalSearchQuery] = useState('');
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);

  useEffect(() => {
    initializeSeolstudyMaterials();
    initializeGoals(CURRENT_MENTOR_ID);
    const stored = getMaterialsMeta();
    setMaterials(
      stored.map((m) => ({
        ...m,
        subCategory: m.subCategory || '기타',
      })),
    );
  }, [initializeGoals]);
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState<string>('전체');
  const [materialSubCategoryFilter, setMaterialSubCategoryFilter] = useState<string>('전체');
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; meta: Partial<MaterialMeta> }[]>(
    [],
  );
  const materialFileInputRef = useRef<HTMLInputElement>(null);
  const [plannerMenteeId, setPlannerMenteeId] = useState<string>('');
  const [plannerDate, setPlannerDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [plannerFeedbackText, setPlannerFeedbackText] = useState<string>('');

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['materials', 'goals', 'planner', 'templates'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (plannerMenteeId && plannerDate) {
      const saved = getPlannerFeedback(plannerMenteeId, plannerDate);
      setPlannerFeedbackText(saved?.feedbackText ?? '');
    } else {
      setPlannerFeedbackText('');
    }
  }, [plannerMenteeId, plannerDate]);

  const { data: mentees = [] } = useMentees();

  const tabs = [
    { id: 'materials' as TabType, label: '학습 자료', icon: FolderOpen },
    { id: 'goals' as TabType, label: '과제 목표', icon: Target },
    { id: 'planner' as TabType, label: '플래너 관리', icon: Calendar },
    { id: 'templates' as TabType, label: '과제 템플릿', icon: Layers },
  ];

  const goals = getGoalsBySubject(CURRENT_MENTOR_ID, goalSubjectFilter);
  const filteredGoals = goals.filter(
    (g) => goalSearchQuery === '' || g.name.toLowerCase().includes(goalSearchQuery.toLowerCase()),
  );

  const handleAddGoal = () => {
    setEditingGoal(null);
    setGoalModalOpen(true);
  };

  const handleEditGoal = (goal: LearningGoal) => {
    setEditingGoal(goal);
    setGoalModalOpen(true);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm('이 과제 목표를 삭제하시겠습니까?')) {
      deleteGoal(id);
    }
  };

  const handleSaveGoal = (data: Omit<LearningGoal, 'id' | 'createdAt'>) => {
    if (editingGoal) {
      updateGoal(editingGoal.id, data);
    } else {
      addGoal(data);
    }
    setGoalModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <div className="min-w-0 space-y-6">
      <Tabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        rightContent={
          <Link to="/mentor/assignments/new">
            <Button icon={Plus}>새 과제 등록</Button>
          </Link>
        }
      />

      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {['전체', '국어', '영어', '수학'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => {
                    setMaterialSubjectFilter(subject);
                    setMaterialSubCategoryFilter('전체');
                  }}
                  className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                    materialSubjectFilter === subject
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
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
                value={materialSearchQuery}
                onChange={(e) => setMaterialSearchQuery(e.target.value)}
                className="h-9 w-48 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div className="ml-auto">
              <input
                ref={materialFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setPendingFiles(
                    files.map((file) => ({
                      file,
                      meta: {
                        title: file.name,
                        fileName: file.name,
                        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                        fileType: (file.type.includes('pdf')
                          ? 'pdf'
                          : file.type.startsWith('image/')
                            ? 'image'
                            : file.type.includes('document') ||
                                file.type.includes('word') ||
                                file.type.includes('excel')
                              ? 'document'
                              : 'other') as MaterialMeta['fileType'],
                        subject: '국어',
                        subCategory: '비문학',
                        uploadedAt: new Date().toISOString().split('T')[0],
                        source: 'mentor' as const,
                      },
                    })),
                  );
                  setUploadModalOpen(true);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                icon={Upload}
                className="whitespace-nowrap"
                onClick={() => materialFileInputRef.current?.click()}
              >
                파일 업로드
              </Button>
            </div>
          </div>

          {/* 업로드 모달 */}
          {uploadModalOpen && (
            <MaterialUploadModal
              pendingFiles={pendingFiles}
              onClose={() => {
                setUploadModalOpen(false);
                setPendingFiles([]);
              }}
              onConfirm={async (itemsToSave) => {
                for (const { file, meta } of itemsToSave) {
                  const fullMeta: MaterialMeta = {
                    ...meta,
                    id: `mat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  };
                  await saveMaterial(fullMeta, file);
                  setMaterials((prev) => [fullMeta, ...prev]);
                }
                setUploadModalOpen(false);
                setPendingFiles([]);
              }}
            />
          )}

          {/* 자료 목록 */}
          {(() => {
            const sortedMaterials = materials.filter((mat) => {
              const matchesSubject =
                materialSubjectFilter === '전체' || mat.subject === materialSubjectFilter;
              const matchesSubCategory =
                materialSubCategoryFilter === '전체' ||
                mat.subCategory === materialSubCategoryFilter;
              const matchesSearch =
                materialSearchQuery === '' ||
                mat.title.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                mat.fileName.toLowerCase().includes(materialSearchQuery.toLowerCase());
              return matchesSubject && matchesSubCategory && matchesSearch;
            });

            if (sortedMaterials.length === 0) {
              return (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
                  <FolderOpen className="h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-sm text-slate-500">
                    {materialSearchQuery ||
                    materialSubjectFilter !== '전체' ||
                    materialSubCategoryFilter !== '전체'
                      ? '검색 결과가 없습니다.'
                      : '등록된 학습 자료가 없습니다.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sortedMaterials.map((material) => {
                  const FileIcon =
                    material.fileType === 'pdf'
                      ? FileText
                      : material.fileType === 'image'
                        ? Image
                        : material.fileType === 'document'
                          ? File
                          : File;

                  const isSeolstudy = material.source === 'seolstudy';

                  return (
                    <div
                      key={material.id}
                      className={`group relative rounded-xl border p-4 ${
                        isSeolstudy ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
                            isSeolstudy
                              ? 'bg-blue-100 text-blue-600'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <FileIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="truncate font-semibold text-slate-900">
                              {material.title}
                            </h3>
                            {isSeolstudy && (
                              <span className="shrink-0 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                                설스터디
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5">
                              {material.subject}
                            </span>
                            {material.subCategory && material.subCategory !== '기타' && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5">
                                {material.subCategory}
                              </span>
                            )}
                            <span>{material.fileSize}</span>
                            <span>•</span>
                            <span>{material.uploadedAt}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`"${material.title}" 자료를 삭제하시겠습니까?`)) {
                              await deleteMaterial(material.id);
                              setMaterials((prev) => prev.filter((m) => m.id !== material.id));
                            }
                          }}
                          className="shrink-0 rounded p-1 text-slate-400 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {['전체', '국어', '영어', '수학'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setGoalSubjectFilter(subject)}
                  className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                    goalSubjectFilter === subject
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="과제 목표 검색..."
                value={goalSearchQuery}
                onChange={(e) => setGoalSearchQuery(e.target.value)}
                className="h-9 w-48 rounded-lg border border-slate-200 bg-white pl-9 pr-4 text-sm focus:border-slate-400 focus:outline-none"
              />
            </div>

            <Button icon={Plus} onClick={handleAddGoal} className="ml-auto">
              새 과제 목표 추가
            </Button>
          </div>

          {filteredGoals.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-12">
              <BookOpen className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                {goalSearchQuery || goalSubjectFilter !== '전체'
                  ? '검색 결과가 없습니다'
                  : '등록된 과제 목표가 없습니다'}
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
                  onEdit={handleEditGoal}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          )}

          {goalModalOpen && (
            <LearningGoalModal
              goal={editingGoal}
              materials={materials}
              onSave={handleSaveGoal}
              onClose={() => {
                setGoalModalOpen(false);
                setEditingGoal(null);
              }}
              mentorId={CURRENT_MENTOR_ID}
            />
          )}
        </div>
      )}

      {activeTab === 'planner' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">멘티 선택</label>
                <Select value={plannerMenteeId} onValueChange={setPlannerMenteeId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="멘티를 선택하세요" />
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
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">날짜 선택</label>
                <input
                  type="date"
                  value={plannerDate}
                  onChange={(e) => setPlannerDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
              </div>
            </div>
          </div>

          {plannerMenteeId ? (
            <>
              {(() => {
                const records = getPlannerRecordsByMenteeAndDate(plannerMenteeId, plannerDate);
                const totalMinutes = records.reduce((sum, r) => sum + r.durationMinutes, 0);
                const totalHours = (totalMinutes / 60).toFixed(1);
                const selectedMenteeName =
                  mentees.find((m) => m.id === plannerMenteeId)?.name ?? '';

                return (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="mb-3 text-base font-semibold text-slate-900">
                          과제 (학습 기록)
                        </h3>
                        {records.length === 0 ? (
                          <p className="py-6 text-center text-sm text-slate-500">
                            해당 날짜에 기록된 학습이 없습니다.
                          </p>
                        ) : (
                          <>
                            <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
                              <span>총 학습 시간: {totalHours}시간</span>
                            </div>
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

                      {/* 피드백 작성 */}
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="mb-3 text-base font-semibold text-slate-900">
                          플래너 피드백
                        </h3>
                        <p className="mb-3 text-sm text-slate-500">
                          {selectedMenteeName}님의 학습 기록을 확인하고 피드백을 작성해주세요.
                        </p>
                        <textarea
                          value={plannerFeedbackText}
                          onChange={(e) => setPlannerFeedbackText(e.target.value)}
                          placeholder="예: 오늘 수학 학습 시간이 가장 많았네요. 내일은 영어 독해 비중을 늘려보면 좋겠습니다. 휴식 시간도 충분히 갖는 것이 중요해요."
                          rows={5}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!plannerMenteeId || !plannerDate) return;
                              savePlannerFeedback({
                                id: `pf-${plannerMenteeId}-${plannerDate}`,
                                menteeId: plannerMenteeId,
                                date: plannerDate,
                                feedbackText: plannerFeedbackText,
                                createdAt: new Date().toISOString(),
                              });
                              alert('피드백이 저장되었습니다.');
                            }}
                          >
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
              })()}
            </>
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
              <Calendar className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                멘티를 선택하면 플래너를 확인하고 피드백을 작성할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'templates' && (
        <PlaceholderSection
          title="과제 템플릿"
          description="자주 사용하는 과제 템플릿을 저장하고 재사용할 수 있습니다."
          icon={<Layers className="h-8 w-8" />}
        />
      )}
    </div>
  );
}

function PlannerTimeline({ records }: { records: PlannerRecord[] }) {
  const SUBJECT_COLORS: Record<string, string> = {
    수학: 'bg-rose-200',
    영어: 'bg-violet-200',
    국어: 'bg-amber-200',
    문학: 'bg-amber-100',
    사탐: 'bg-emerald-200',
    한국사: 'bg-emerald-100',
    과탐: 'bg-sky-200',
    과학: 'bg-sky-200',
  };
  const hours = Array.from({ length: 15 }, (_, i) => i + 6); // 6시~20시
  const sortedRecords = [...records].sort((a, b) => (a.startHour ?? 0) - (b.startHour ?? 0));

  return (
    <div className="space-y-1">
      {hours.map((hour) => {
        const blocks = sortedRecords.filter((r) => {
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
                  className={`h-6 flex-1 rounded ${SUBJECT_COLORS[r.subject] ?? 'bg-slate-200'}`}
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
          uploadedAt: p.meta.uploadedAt || new Date().toISOString().split('T')[0],
          source: 'mentor' as const,
        } as MaterialMeta,
      }));
      await onConfirm(validItems);
    } finally {
      setSaving(false);
    }
  };

  const subjects = ['국어', '영어', '수학', '과학', '사회'];

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
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-4">
              <p className="mb-3 truncate text-sm font-medium text-slate-900">{item.file.name}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">과목</label>
                  <Select
                    value={item.meta.subject || '국어'}
                    onValueChange={(subject) => {
                      updateItem(index, {
                        subject,
                        subCategory: SUBJECT_SUBCATEGORIES[subject]?.[0] ?? '기타',
                      });
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">세부 분류</label>
                  <Select
                    value={item.meta.subCategory || '비문학'}
                    onValueChange={(value) => updateItem(index, { subCategory: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(SUBJECT_SUBCATEGORIES[item.meta.subject || '국어'] ?? ['기타']).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

function PlaceholderSection({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-2 text-center text-sm text-slate-500 max-w-md">{description}</p>
      <p className="mt-6 text-xs text-slate-400">준비 중입니다.</p>
    </div>
  );
}

interface LearningGoalCardProps {
  goal: LearningGoal;
  materials: { id: string; title: string; source: 'seolstudy' | 'mentor' }[];
  onEdit: (goal: LearningGoal) => void;
  onDelete: (id: string) => void;
}

function LearningGoalCard({ goal, materials, onEdit, onDelete }: LearningGoalCardProps) {
  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {goal.subject}
          </span>
          <h3 className="mt-2 font-semibold text-slate-900">{goal.name}</h3>
          {goal.description && (
            <p className="mt-1 text-sm text-slate-500 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <div className="ml-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
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
                className={`inline-flex items-center rounded-md px-2 py-1 text-xs ${
                  mat.source === 'seolstudy'
                    ? 'bg-blue-50 text-blue-700'
                    : 'bg-slate-50 text-slate-600'
                }`}
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

interface LearningGoalModalProps {
  goal: LearningGoal | null;
  materials: MaterialMeta[];
  onSave: (data: Omit<LearningGoal, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  mentorId: string;
}

function LearningGoalModal({ goal, materials, onSave, onClose, mentorId }: LearningGoalModalProps) {
  const [subject, setSubject] = useState<'국어' | '영어' | '수학'>(goal?.subject || '국어');
  const [name, setName] = useState(goal?.name || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>(goal?.materialIds || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      mentorId,
      name: name.trim(),
      subject,
      description: description.trim() || undefined,
      materialIds: selectedMaterialIds,
    });
  };

  const sortedMaterials = [...materials].sort((a, b) => {
    const aMatch = a.subject === subject ? 0 : 1;
    const bMatch = b.subject === subject ? 0 : 1;
    return aMatch - bMatch;
  });

  const toggleMaterial = (id: string) => {
    setSelectedMaterialIds((prev) =>
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
            <label className="mb-2 block text-sm font-medium text-slate-700">과목</label>
            <Select value={subject} onValueChange={(v) => setSubject(v as typeof subject)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="국어">국어</SelectItem>
                <SelectItem value="영어">영어</SelectItem>
                <SelectItem value="수학">수학</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              {sortedMaterials.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-500">등록된 학습자료가 없습니다</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {sortedMaterials.map((mat) => (
                    <label
                      key={mat.id}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-slate-50 ${
                        mat.subject !== subject ? 'opacity-60' : ''
                      }`}
                    >
                      <Checkbox
                        checked={selectedMaterialIds.includes(mat.id)}
                        onCheckedChange={() => toggleMaterial(mat.id)}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-sm">{mat.title}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs ${
                            mat.subject === subject
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
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
