import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  Check,
  Copy,
  Edit2,
  Eye,
  File,
  FileText,
  FolderOpen,
  Image,
  Layers,
  Plus,
  Target,
  Trash2,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@/components/ui/Dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { SearchInput } from '@/components/ui/SearchInput';
import { DefaultSelect } from '@/components/ui/select';
import { Tabs } from '@/components/ui/tabs';
import { toast } from '@/components/ui/Toast';
import { SUBJECT_SUBCATEGORIES } from '@/data/assignmentRegisterMock';
import { getTodayDateStr } from '@/lib/dateUtils';
import {
  deleteMaterial,
  getMaterialBlob,
  getMaterialsMeta,
  initializeSeolstudyMaterials,
  type MaterialMeta,
  saveMaterial,
} from '@/lib/materialStorage';
import {
  getMaterialsByIds,
  type LearningGoal,
  useLearningGoalStore,
} from '@/stores/useLearningGoalStore';

type TabType = 'materials' | 'goals' | 'templates';
const CURRENT_MENTOR_ID = 'mentor1';
const TABS = [
  { id: 'materials' as TabType, label: '학습 자료', icon: FolderOpen },
  { id: 'goals' as TabType, label: '과제 목표', icon: Target },
  { id: 'templates' as TabType, label: '과제 템플릿', icon: Layers },
];

type AssignmentTemplate = {
  id: string;
  title: string;
  description: string;
  variables?: string[];
  checklist: string[];
  submitRule?: string;
  source?: 'example' | 'custom';
};

const ASSIGNMENT_TEMPLATES: AssignmentTemplate[] = [
  {
    id: 'tpl-vocab-memo',
    title: '영어단어 암기 Day {DAY}',
    description: 'Day별 단어 학습 + 테스트 + 오답 정리까지 한 번에.',
    variables: ['{DAY}'],
    checklist: [
      '단어 1회독(뜻/품사) 완료',
      '예문 10개 소리내어 읽기',
      '테스트(한→영 / 영→한) 각 1회',
      '오답 10개 오답노트 작성',
    ],
    submitRule: '테스트 점수(또는 오답 개수) + 오답 10개 기록/캡처',
    source: 'example',
  },
  {
    id: 'tpl-vocab-review',
    title: '단어 복습 루틴 (D+1 / D+3 / D+7) Day {DAY}',
    description: '스페이싱 복습으로 장기 기억을 유지하는 반복 과제.',
    variables: ['{DAY}'],
    checklist: ['D+1 복습(전날) 10분', 'D+3 복습 10분', 'D+7 복습 10분', '최종 오답 5개만 남기기'],
    submitRule: '각 복습 세트 오답 개수 기록(예: 3/2/1)',
    source: 'example',
  },
  {
    id: 'tpl-vocab-sentences',
    title: '단어 → 문장 적용 Day {DAY}',
    description: '오늘 외운 단어를 “내 문장”으로 고정해서 실전 적용.',
    variables: ['{DAY}'],
    checklist: [
      '핵심 단어 15개 선정',
      '단어당 문장 1개씩(총 15문장)',
      '틀린 문장 5개만 교정(왜 틀렸는지 1줄)',
    ],
    submitRule: '15문장 텍스트 + 교정 5개 표시',
    source: 'example',
  },
  {
    id: 'tpl-vocab-cumulative-quiz',
    title: '누적 단어 퀴즈 (Day 1~{DAY})',
    description: '누적 범위 랜덤 테스트로 “기억 유지”를 확인.',
    variables: ['{DAY}'],
    checklist: [
      '누적 50문항 퀴즈(앱/자체)',
      '오답 10개 추려 재시험',
      '오답 원인 분류(뜻/철자/혼동/예문)',
    ],
    submitRule: '점수 + 오답 원인 분류 결과',
    source: 'example',
  },
  {
    id: 'tpl-shadowing',
    title: '쉐도잉 15분 (매일 루틴)',
    description: '짧게라도 매일 유지하는 루틴형 과제 템플릿.',
    checklist: [
      '1회: 듣기만(스크립트 X)',
      '2회: 스크립트 보며 쉐도잉',
      '3회: 스크립트 없이 쉐도잉',
      '어려웠던 표현 3개 기록',
    ],
    submitRule: '표현 3개 + 오늘 난이도(1~5)',
    source: 'example',
  },
];

const STORAGE_KEY_TEMPLATES = 'assignment-template-storage-v1';

function loadCustomTemplates(): AssignmentTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((t) => t && typeof t === 'object')
      .map((t) => t as Partial<AssignmentTemplate>)
      .map((t) => ({
        id: String(t.id ?? `tpl-custom-${Date.now()}`),
        title: String(t.title ?? ''),
        description: String(t.description ?? ''),
        variables: Array.isArray(t.variables) ? (t.variables as string[]).map(String) : undefined,
        checklist: Array.isArray(t.checklist) ? (t.checklist as string[]).map(String) : [],
        submitRule: t.submitRule != null ? String(t.submitRule) : undefined,
        source: 'custom' as const,
      }))
      .filter((t) => t.title.trim().length > 0 && t.checklist.length > 0);
  } catch {
    return [];
  }
}

function saveCustomTemplates(templates: AssignmentTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  } catch {
    // ignore
  }
}

export function AssignmentManagePage() {
  const [searchParams] = useSearchParams();
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

  // 학습자료 미리보기 상태
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMeta, setPreviewMeta] = useState<MaterialMeta | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 과제 목표 상태
  const [goalSearch, setGoalSearch] = useState('');
  const [goalModal, setGoalModal] = useState<{ open: boolean; editing: LearningGoal | null }>({
    open: false,
    editing: null,
  });

  // 템플릿(커스텀) 상태
  const [customTemplates, setCustomTemplates] = useState<AssignmentTemplate[]>(() =>
    loadCustomTemplates(),
  );
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState({
    title: '',
    description: '',
    variables: '{DAY}',
    checklist: '',
    submitRule: '',
  });

  // 초기화 + URL 탭 동기화 (마운트 시 1회)
  useEffect(() => {
    initializeSeolstudyMaterials();
    initialize(CURRENT_MENTOR_ID);
    setMaterials(getMaterialsMeta().map((m) => ({ ...m, subCategory: m.subCategory || '기타' })));
    const tab = searchParams.get('tab') as TabType | null;
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewMeta(null);
    setPreviewError(null);
    setPreviewLoading(false);
    setPreviewOpen(false);
  };

  const openPreview = async (meta: MaterialMeta) => {
    // reset
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewError(null);
    setPreviewMeta(meta);
    setPreviewOpen(true);
    setPreviewLoading(true);

    try {
      const blob = await getMaterialBlob(meta.id);
      if (!blob) {
        setPreviewError('파일 데이터가 없어 미리보기를 할 수 없습니다.');
        return;
      }
      // 타입이 없는 경우가 있어도 objectURL로 대부분 렌더링 가능
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    } catch {
      setPreviewError('미리보기를 불러오지 못했습니다.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCopyTemplate = async (tpl: AssignmentTemplate) => {
    const header = `# ${tpl.title}\n\n${tpl.description}\n`;
    const vars = tpl.variables?.length ? `\n[변수] ${tpl.variables.join(', ')}\n` : '';
    const checklist = `\n[체크리스트]\n${tpl.checklist.map((c) => `- ${c}`).join('\n')}\n`;
    const submit = tpl.submitRule ? `\n[제출 기준]\n- ${tpl.submitRule}\n` : '';
    const text = `${header}${vars}${checklist}${submit}`;

    try {
      await navigator.clipboard.writeText(text);
      toast.success('템플릿 내용이 복사되었습니다.');
    } catch {
      // clipboard 권한 실패 시 안내
      toast.error('복사에 실패했습니다. 브라우저 권한을 확인해주세요.');
    }
  };

  const handleAddTemplate = () => {
    const title = templateDraft.title.trim();
    const description = templateDraft.description.trim();
    const checklist = templateDraft.checklist
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const variables = templateDraft.variables
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const submitRule = templateDraft.submitRule.trim();

    if (!title || checklist.length === 0) {
      toast.warning('제목과 체크리스트(최소 1개)는 필수입니다.');
      return;
    }

    const tpl: AssignmentTemplate = {
      id: `tpl-custom-${Date.now()}`,
      title,
      description,
      variables: variables.length ? variables : undefined,
      checklist,
      submitRule: submitRule || undefined,
      source: 'custom',
    };

    const next = [tpl, ...customTemplates];
    setCustomTemplates(next);
    saveCustomTemplates(next);
    setTemplateModalOpen(false);
    setTemplateDraft({
      title: '',
      description: '',
      variables: '{DAY}',
      checklist: '',
      submitRule: '',
    });
  };

  const handleDeleteCustomTemplate = (id: string) => {
    if (!window.confirm('이 템플릿을 삭제하시겠습니까?')) return;
    const next = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(next);
    saveCustomTemplates(next);
  };

  const allTemplates = useMemo<AssignmentTemplate[]>(
    () => [...customTemplates, ...ASSIGNMENT_TEMPLATES],
    [customTemplates],
  );

  const tabRightContent = (
    <div className="flex items-center gap-2">
      {activeTab === 'materials' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            파일 업로드
          </Button>
        </>
      )}
      {activeTab === 'goals' && (
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => setGoalModal({ open: true, editing: null })}
        >
          <Plus className="h-3.5 w-3.5" />새 과제 목표
        </Button>
      )}
      {activeTab === 'templates' && (
        <Button size="sm" className="gap-1.5" onClick={() => setTemplateModalOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          템플릿 추가
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-w-0">
      {/* 흰색 카드: 탭 + 콘텐츠 */}
      <div className="rounded-xl border border-border/50 bg-white">
        {/* 탭 네비게이션 */}
        <div className="px-5 pt-1">
          <Tabs
            items={TABS}
            value={activeTab}
            onChange={setActiveTab}
            rightContent={tabRightContent}
          />
        </div>

        {/* 학습 자료 탭 */}
        {activeTab === 'materials' && (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <FilterTabs
                items={['전체', '국어', '영어', '수학'].map((s) => ({ id: s, label: s }))}
                value={materialFilter.subject}
                onChange={(subject) =>
                  setMaterialFilter((prev) => ({ ...prev, subject, subCategory: '전체' }))
                }
              />
              <SearchInput
                value={materialFilter.search}
                onChange={(search) => setMaterialFilter((prev) => ({ ...prev, search }))}
                placeholder="자료 검색..."
                className="w-48"
              />
              <p className="ml-auto text-xs text-muted-foreground">
                {filteredMaterials.length}개의 자료
              </p>
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
                title={
                  materialFilter.search || materialFilter.subject !== '전체'
                    ? '검색 결과가 없습니다'
                    : '등록된 학습 자료가 없습니다'
                }
                description="파일을 업로드하여 과제에 활용하세요"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    파일 업로드
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    onPreview={() => openPreview(material)}
                    onDelete={() => handleDeleteMaterial(material)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 과제 목표 탭 */}
        {activeTab === 'goals' && (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <SearchInput
                value={goalSearch}
                onChange={setGoalSearch}
                placeholder="과제 목표 검색..."
                className="w-48"
              />
              <p className="ml-auto text-xs text-muted-foreground">
                {filteredGoals.length}개의 목표
              </p>
            </div>

            {filteredGoals.length === 0 ? (
              <EmptyState
                icon={<Target className="h-12 w-12" />}
                title={goalSearch ? '검색 결과가 없습니다' : '등록된 과제 목표가 없습니다'}
                description="과제 목표를 추가하여 과제 등록 시 활용하세요"
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Plus}
                    onClick={() => setGoalModal({ open: true, editing: null })}
                  >
                    과제 목표 추가
                  </Button>
                }
              />
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

        {/* 과제 템플릿 탭 */}
        {activeTab === 'templates' && (
          <div className="space-y-4 p-5">
            <div className="flex items-center">
              <p className="text-xs text-muted-foreground">{allTemplates.length}개의 템플릿</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {allTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="rounded-xl border border-border/50 bg-secondary/30 p-5 transition-all hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            tpl.source === 'custom'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-secondary text-foreground/50'
                          }`}
                        >
                          <Layers className="h-4 w-4" />
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            tpl.source === 'custom'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-secondary text-foreground/60'
                          }`}
                        >
                          {tpl.source === 'custom' ? '커스텀' : '예시'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{tpl.title}</p>
                      <p className="mt-1 text-xs text-foreground/60 line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 border-t border-border/50 pt-3">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                      체크리스트
                    </p>
                    <ul className="space-y-1.5">
                      {tpl.checklist.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground/80">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
                          <span className="leading-5">{c}</span>
                        </li>
                      ))}
                    </ul>
                    {tpl.submitRule && (
                      <div className="mt-3 rounded-md bg-secondary/70 px-2.5 py-2">
                        <p className="text-xs text-foreground/60">
                          <span className="font-medium text-foreground/70">제출 기준</span>{' '}
                          {tpl.submitRule}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                    {tpl.source === 'custom' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomTemplate(tpl.id)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        title="삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Copy}
                      onClick={() => handleCopyTemplate(tpl)}
                    >
                      복사
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Dialog open={templateModalOpen} onClose={() => setTemplateModalOpen(false)}>
              <DialogHeader onClose={() => setTemplateModalOpen(false)}>
                <h2 className="text-lg font-semibold text-foreground">템플릿 추가</h2>
              </DialogHeader>
              <DialogBody className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">제목</label>
                  <input
                    value={templateDraft.title}
                    onChange={(e) => setTemplateDraft((p) => ({ ...p, title: e.target.value }))}
                    placeholder="예: 영어단어 암기 Day {DAY}"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">설명</label>
                  <input
                    value={templateDraft.description}
                    onChange={(e) =>
                      setTemplateDraft((p) => ({ ...p, description: e.target.value }))
                    }
                    placeholder="예: Day별 단어 학습 + 테스트 + 오답 정리"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">
                    변수(쉼표로 구분)
                  </label>
                  <input
                    value={templateDraft.variables}
                    onChange={(e) => setTemplateDraft((p) => ({ ...p, variables: e.target.value }))}
                    placeholder="{DAY}, {WEEK}"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">
                    체크리스트(줄바꿈으로 항목 추가)
                  </label>
                  <textarea
                    value={templateDraft.checklist}
                    onChange={(e) => setTemplateDraft((p) => ({ ...p, checklist: e.target.value }))}
                    placeholder={'예: 단어 1회독\\n테스트 1회\\n오답노트 작성'}
                    rows={6}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-foreground/80">
                    제출 기준
                  </label>
                  <input
                    value={templateDraft.submitRule}
                    onChange={(e) =>
                      setTemplateDraft((p) => ({ ...p, submitRule: e.target.value }))
                    }
                    placeholder="예: 점수 + 오답 10개"
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTemplateModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleAddTemplate}>추가</Button>
              </DialogFooter>
            </Dialog>
          </div>
        )}
      </div>
      {/* 흰색 카드 닫기 */}

      {/* 학습자료 미리보기 모달 */}
      <Dialog open={previewOpen} onClose={closePreview} maxWidth="max-w-5xl">
        <DialogHeader onClose={closePreview}>
          <h2 className="truncate text-base font-semibold text-foreground">학습 자료 미리보기</h2>
          <p className="mt-0.5 truncate text-sm text-foreground/60">{previewMeta?.title ?? ''}</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto bg-secondary/50 p-4">
          {previewLoading && (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-foreground/60">
              미리보기를 불러오는 중...
            </div>
          )}
          {!previewLoading && previewError && (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 text-sm text-foreground/60">
              <p>{previewError}</p>
              <p className="text-xs text-muted-foreground">
                설스터디 제공 자료는 목데이터만 있을 수 있어요.
              </p>
            </div>
          )}
          {!previewLoading && !previewError && previewMeta && previewUrl && (
            <div className="rounded-xl border border-border/50 bg-white p-3">
              {previewMeta.fileType === 'pdf' ? (
                <iframe title="pdf-preview" src={previewUrl} className="h-[70vh] w-full" />
              ) : previewMeta.fileType === 'image' ? (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt={previewMeta.title}
                    className="max-h-[70vh] object-contain"
                  />
                </div>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-sm text-foreground/60">
                  <p>이 파일 형식은 미리보기를 지원하지 않습니다.</p>
                  <a
                    href={previewUrl}
                    download={previewMeta.fileName}
                    className="rounded-lg border border-border bg-white px-4 py-2 text-sm text-foreground/80 hover:bg-secondary"
                  >
                    다운로드
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}

// 학습 자료 카드
function MaterialCard({
  material,
  onPreview,
  onDelete,
}: {
  material: MaterialMeta;
  onPreview: () => void;
  onDelete: () => void;
}) {
  const FileIcon =
    material.fileType === 'pdf' ? FileText : material.fileType === 'image' ? Image : File;
  const isSeolstudy = material.source === 'seolstudy';

  return (
    <div
      className={`group relative rounded-xl border p-5 transition-all ${isSeolstudy ? 'border-blue-200 bg-blue-50/30 hover:shadow-soft' : 'border-border/50 bg-secondary/30 hover:shadow-soft'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isSeolstudy ? 'bg-blue-100 text-blue-600' : 'bg-secondary text-foreground/50'}`}
        >
          <FileIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-foreground">{material.title}</h3>
            {isSeolstudy && (
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                설스터디
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-foreground/60">
              {material.subject}
            </span>
            {material.subCategory && material.subCategory !== '기타' && (
              <span className="rounded-md border border-border/60 bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-foreground/60">
                {material.subCategory}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span>{material.fileSize}</span>
            <span>·</span>
            <span>{material.uploadedAt}</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-1 border-t border-border/50 pt-3 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onPreview}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
          title="미리보기"
        >
          <Eye className="h-3.5 w-3.5" />
          미리보기
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-600"
          title="삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
          삭제
        </button>
      </div>
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
    <Dialog open onClose={onClose} maxWidth="max-w-2xl">
      <DialogHeader onClose={onClose}>
        <h2 className="text-lg font-semibold text-foreground">학습 자료 업로드</h2>
        <p className="mt-1 text-sm text-foreground/60">
          각 파일의 과목과 세부 분류를 선택한 후 업로드하세요.
        </p>
      </DialogHeader>
      <DialogBody className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="rounded-lg border border-border/50 p-4">
            <p className="mb-3 truncate text-sm font-medium text-foreground">{item.file.name}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-foreground/70">과목</label>
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
                <label className="mb-1 block text-xs font-medium text-foreground/70">
                  세부 분류
                </label>
                <DefaultSelect
                  value={item.meta.subCategory || '비문학'}
                  onValueChange={(v) => updateItem(index, { subCategory: v })}
                  options={SUBJECT_SUBCATEGORIES[item.meta.subject || '국어'] ?? ['기타']}
                />
              </div>
            </div>
          </div>
        ))}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          취소
        </Button>
        <Button type="button" onClick={handleConfirm} disabled={saving}>
          {saving ? '업로드 중...' : '업로드'}
        </Button>
      </DialogFooter>
    </Dialog>
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
    <div className="group rounded-xl border border-border/50 bg-secondary/30 p-5 transition-all hover:shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Target className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{goal.name}</h3>
          {goal.description && (
            <p className="mt-1 line-clamp-2 text-xs text-foreground/60">{goal.description}</p>
          )}
        </div>
        <div className="ml-1 flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {(goal.weakness || materials.length > 0) && (
        <div className="mt-3 space-y-2.5 border-t border-border/50 pt-3">
          {goal.weakness && (
            <div className="rounded-md bg-secondary/70 px-2.5 py-2">
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                보완점
              </p>
              <p className="text-xs text-foreground/70">{goal.weakness}</p>
            </div>
          )}
          {materials.length > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-foreground/40">
                추가자료
              </p>
              <div className="flex flex-wrap gap-1.5">
                {materials.map((mat) => (
                  <span
                    key={mat.id}
                    className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] ${mat.source === 'seolstudy' ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-border/60 bg-secondary/50 text-foreground/60'}`}
                  >
                    {mat.title}
                  </span>
                ))}
              </div>
            </div>
          )}
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
  const [weakness, setWeakness] = useState(goal?.weakness || '');
  const [selectedIds, setSelectedIds] = useState<string[]>(goal?.materialIds || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      mentorId,
      name: name.trim(),
      description: description.trim() || undefined,
      weakness: weakness.trim() || undefined,
      materialIds: selectedIds,
    });
  };

  const toggleMaterial = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id],
    );
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogHeader onClose={onClose}>
        <h2 className="text-lg font-semibold text-foreground">
          {goal ? '과제 목표 수정' : '새 과제 목표 추가'}
        </h2>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">
              과제 목표 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 비문학 지문 구조 파악"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
              required
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">설명 (선택)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="과제 목표에 대한 간단한 설명"
              rows={2}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">보완점</label>
            <input
              type="text"
              value={weakness}
              onChange={(e) => setWeakness(e.target.value)}
              placeholder="예: 비문학 구조 파악, 어휘력 부족 (쉼표로 구분)"
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground/80">추가자료</label>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-border">
              {materials.length === 0 ? (
                <p className="p-4 text-center text-sm text-foreground/60">
                  등록된 학습자료가 없습니다
                </p>
              ) : (
                <div className="divide-y divide-border/50">
                  {materials.map((mat) => (
                    <label
                      key={mat.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-secondary/50"
                    >
                      <Checkbox
                        checked={selectedIds.includes(mat.id)}
                        onCheckedChange={() => toggleMaterial(mat.id)}
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="text-sm">{mat.title}</span>
                        <span className="rounded bg-secondary px-1.5 py-0.5 text-xs text-foreground/60">
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
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="submit">{goal ? '수정' : '추가'}</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
