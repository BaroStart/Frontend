import {
  Calendar,
  File,
  FileText,
  FolderOpen,
  Image,
  Layers,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { useMentees } from '@/hooks/useMentees';
import {
  MOCK_LEARNING_MATERIALS,
  SUBJECT_SUBCATEGORIES,
} from '@/data/assignmentRegisterMock';
import {
  getPlannerRecordsByMenteeAndDate,
  formatPlannerDuration,
  type PlannerRecord,
} from '@/data/plannerMock';
import { getPlannerFeedback, savePlannerFeedback } from '@/lib/plannerFeedbackStorage';
import {
  deleteMaterial,
  getMaterialsMeta,
  saveMaterial,
  type MaterialMeta,
} from '@/lib/materialStorage';

type TabType = 'templates' | 'materials' | 'planner';

interface MaterialItem extends MaterialMeta {}

export function AssignmentManagePage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('templates');
  
  // 학습 자료 관리 상태
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    const stored = getMaterialsMeta();
    if (stored.length > 0) {
      return stored.map((m) => ({
        ...m,
        subCategory: m.subCategory || '기타',
      }));
    }
    // 초기 Mock 데이터
    return MOCK_LEARNING_MATERIALS.map((mat, idx) => {
      const subject = mat.subject || '기타';
      let subCategory = '기타';
      if (subject === '국어') {
        if (mat.title.includes('비문학')) subCategory = '비문학';
        else if (mat.title.includes('문학')) subCategory = '문학';
        else subCategory = '문법';
      } else if (subject === '영어') subCategory = '독해/듣기/어휘';
      else if (subject === '수학') subCategory = mat.title.includes('기하') ? '기하' : '미적분';
      return {
        id: mat.id,
        title: mat.title,
        fileName: mat.title,
        fileSize: mat.fileSize || '0 MB',
        fileType: (mat.title.toLowerCase().endsWith('.pdf') ? 'pdf' : 
                  /\.(jpg|jpeg|png|gif)$/i.test(mat.title) ? 'image' :
                  /\.(doc|docx|xls|xlsx)$/i.test(mat.title) ? 'document' : 'other') as MaterialItem['fileType'],
        subject,
        subCategory,
        uploadedAt: new Date(Date.now() - idx * 86400000).toISOString().split('T')[0],
      };
    });
  });
  const [materialSubjectFilter, setMaterialSubjectFilter] = useState<string>('전체');
  const [materialSubCategoryFilter, setMaterialSubCategoryFilter] = useState<string>('전체');
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; meta: Partial<MaterialMeta> }[]>([]);
  const materialFileInputRef = useRef<HTMLInputElement>(null);

  // 플래너 관리 상태
  const [plannerMenteeId, setPlannerMenteeId] = useState<string>('');
  const [plannerDate, setPlannerDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [plannerFeedbackText, setPlannerFeedbackText] = useState<string>('');

  // URL 쿼리 파라미터에서 탭 읽기
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['templates', 'materials', 'planner'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 플래너 피드백 로드
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
    { id: 'templates' as TabType, label: '과제 템플릿', icon: Layers },
    { id: 'materials' as TabType, label: '학습 자료', icon: FolderOpen },
    { id: 'planner' as TabType, label: '플래너 관리', icon: Calendar },
  ];

  return (
    <div className="min-w-0 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            과제를 관리하고 피드백을 작성하세요
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/mentor/assignments/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              새 과제 등록
            </Button>
          </Link>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-slate-800 text-slate-900'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭별 콘텐츠 */}
      {/* 과제 템플릿 탭 */}
      {activeTab === 'templates' && (
        <PlaceholderSection
          title="과제 템플릿"
          description="자주 사용하는 과제 템플릿을 저장하고 재사용할 수 있습니다."
          icon={<Layers className="h-8 w-8" />}
        />
      )}

      {/* 학습 자료 탭 */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          {/* 상단: 필터 및 검색 */}
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
            {/* 과목 필터 */}
            <div className="flex flex-wrap gap-2">
              {['전체', '국어', '영어', '수학', '과학', '사회'].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  onClick={() => {
                    setMaterialSubjectFilter(subject);
                    setMaterialSubCategoryFilter('전체');
                  }}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    materialSubjectFilter === subject
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>
            {/* 세부 카테고리 필터 (과목 선택 시) */}
            {materialSubjectFilter !== '전체' && SUBJECT_SUBCATEGORIES[materialSubjectFilter] && (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <span className="text-xs font-medium text-slate-500">세부 분류:</span>
                {['전체', ...SUBJECT_SUBCATEGORIES[materialSubjectFilter]].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setMaterialSubCategoryFilter(sub)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      materialSubCategoryFilter === sub
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
            {/* 검색 및 업로드 */}
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="자료 검색..."
                  value={materialSearchQuery}
                  onChange={(e) => setMaterialSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                />
              </div>
              <input
                ref={materialFileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length === 0) return;
                  setPendingFiles(files.map((file) => ({
                    file,
                    meta: {
                      title: file.name,
                      fileName: file.name,
                      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                      fileType: (file.type.includes('pdf') ? 'pdf' :
                                file.type.startsWith('image/') ? 'image' :
                                file.type.includes('document') || file.type.includes('word') || file.type.includes('excel') ? 'document' : 'other') as MaterialMeta['fileType'],
                      subject: '국어',
                      subCategory: '비문학',
                      uploadedAt: new Date().toISOString().split('T')[0],
                    },
                  })));
                  setUploadModalOpen(true);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                className="whitespace-nowrap"
                onClick={() => materialFileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
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
            const filteredMaterials = materials.filter((mat) => {
              const matchesSubject = materialSubjectFilter === '전체' || mat.subject === materialSubjectFilter;
              const matchesSubCategory = materialSubCategoryFilter === '전체' || mat.subCategory === materialSubCategoryFilter;
              const matchesSearch = materialSearchQuery === '' || 
                mat.title.toLowerCase().includes(materialSearchQuery.toLowerCase()) ||
                mat.fileName.toLowerCase().includes(materialSearchQuery.toLowerCase());
              return matchesSubject && matchesSubCategory && matchesSearch;
            });

            if (filteredMaterials.length === 0) {
              return (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12">
                  <FolderOpen className="h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-sm text-slate-500">
                    {materialSearchQuery || materialSubjectFilter !== '전체' || materialSubCategoryFilter !== '전체'
                      ? '검색 결과가 없습니다.'
                      : '등록된 학습 자료가 없습니다.'}
                  </p>
                </div>
              );
            }

            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials.map((material) => {
                  const FileIcon = material.fileType === 'pdf' ? FileText :
                                 material.fileType === 'image' ? Image :
                                 material.fileType === 'document' ? File : File;
                  
                  return (
                    <div
                      key={material.id}
                      className="group relative rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <FileIcon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-semibold text-slate-900">{material.title}</h3>
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

      {/* 플래너 관리 탭 */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          {/* 멘티 및 날짜 선택 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">멘티 선택</label>
                <select
                  value={plannerMenteeId}
                  onChange={(e) => setPlannerMenteeId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
                >
                  <option value="">멘티를 선택하세요</option>
                  {mentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.grade} · {m.track})
                    </option>
                  ))}
                </select>
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
              {/* 학생 기록 (과제/학습 시간) */}
              {(() => {
                const records = getPlannerRecordsByMenteeAndDate(plannerMenteeId, plannerDate);
                const totalMinutes = records.reduce((sum, r) => sum + r.durationMinutes, 0);
                const totalHours = (totalMinutes / 60).toFixed(1);
                const selectedMenteeName = mentees.find((m) => m.id === plannerMenteeId)?.name ?? '';

                return (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* 좌측: 과제 목록 + 피드백 */}
                    <div className="space-y-6">
                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h3 className="mb-3 text-base font-semibold text-slate-900">과제 (학습 기록)</h3>
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
                        <h3 className="mb-3 text-base font-semibold text-slate-900">플래너 피드백</h3>
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

                    {/* 우측: 타임라인 */}
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
              <p className="mt-4 text-sm text-slate-500">멘티를 선택하면 플래너를 확인하고 피드백을 작성할 수 있습니다.</p>
            </div>
          )}
        </div>
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
              {blocks.length === 0 && (
                <div className="h-6 flex-1 rounded bg-slate-50" />
              )}
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
      prev.map((p, i) =>
        i === index ? { ...p, meta: { ...p.meta, ...updates } } : p
      )
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
            <div
              key={index}
              className="rounded-lg border border-slate-200 p-4"
            >
              <p className="mb-3 truncate text-sm font-medium text-slate-900">{item.file.name}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">과목</label>
                  <select
                    value={item.meta.subject || '국어'}
                    onChange={(e) => {
                      const subject = e.target.value;
                      updateItem(index, {
                        subject,
                        subCategory: SUBJECT_SUBCATEGORIES[subject]?.[0] ?? '기타',
                      });
                    }}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">세부 분류</label>
                  <select
                    value={item.meta.subCategory || '비문학'}
                    onChange={(e) => updateItem(index, { subCategory: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    {(SUBJECT_SUBCATEGORIES[item.meta.subject || '국어'] ?? ['기타']).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
          >
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
