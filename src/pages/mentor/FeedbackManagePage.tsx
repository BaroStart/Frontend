import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import {
  BarChart3,
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileText,
  Hexagon,
  List,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';

import { LearningAnalyticsSection } from '@/components/mentor/LearningAnalyticsSection';
import { Button } from '@/components/ui/Button';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Tabs } from '@/components/ui/tabs';
import { useMentees } from '@/hooks/useMentees';
import { useSubmittedAssignments } from '@/hooks/useSubmittedAssignments';
import {
  formatDeadline,
  formatRemainingTime,
  getDeadlineStatus,
  getRemainingMs,
} from '@/lib/feedbackDeadline';
import {
  DEFAULT_TEMPLATE_CONTENT,
  deleteFeedbackTemplate,
  deleteFeedbackTemplates,
  type FeedbackTemplate,
  getFeedbackTemplates,
  saveFeedbackTemplate,
} from '@/lib/feedbackTemplateStorage';
import { getAllCompletedFeedback } from '@/lib/mentorFeedbackStorage';

type TabType = 'feedback' | 'templates' | 'analytics';

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  국어: BookOpen,
  영어: FileText,
  수학: Calculator,
  공통: Hexagon,
};

const FEEDBACK_TABLE_HEADERS = ['상태', '과목', '과제명', '멘티', '제출일', '마감', '관리'];
const TEMPLATE_TABLE_HEADERS = ['템플릿명', '과목', '미리보기', '생성일', '사용 횟수', '관리'];

export function FeedbackManagePage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('feedback');
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('전체');
  const [templateSearch, setTemplateSearch] = useState('');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | 'pending' | 'completed'>(
    'all',
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  // 모달 상태 통합: null | create | edit | view
  const [templateModal, setTemplateModal] = useState<
    | null
    | { mode: 'create' }
    | { mode: 'edit'; template: FeedbackTemplate }
    | { mode: 'view'; template: FeedbackTemplate }
  >(null);

  const PAGE_SIZE = 8;

  const { data: submittedAssignments = [] } = useSubmittedAssignments();
  const { data: mentees = [] } = useMentees();

  // 초기화: URL 탭 + 템플릿 로드
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['feedback', 'templates', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    setTemplates(getFeedbackTemplates());
  }, [searchParams]);

  const pendingFeedback = submittedAssignments
    .filter((a) => !a.feedbackDone)
    .sort((a, b) => {
      const statusA = getDeadlineStatus(a.submittedAt);
      const statusB = getDeadlineStatus(b.submittedAt);
      const order = { overdue: 0, urgent: 1, ok: 2 };
      if (order[statusA] !== order[statusB]) return order[statusA] - order[statusB];
      return getRemainingMs(a.submittedAt) - getRemainingMs(b.submittedAt);
    });
  const completedStoredFeedback = getAllCompletedFeedback();
  const overdueCount = pendingFeedback.filter(
    (a) => getDeadlineStatus(a.submittedAt) === 'overdue',
  ).length;

  const tabs = [
    { id: 'feedback' as TabType, label: '피드백 목록', icon: FileText },
    { id: 'templates' as TabType, label: '피드백 템플릿 관리', icon: List },
    { id: 'analytics' as TabType, label: '학습 리포트', icon: BarChart3 },
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchSubject = subjectFilter === '전체' || t.subject === subjectFilter;
    const q = templateSearch.trim().toLowerCase();
    const matchSearch =
      !q ||
      t.name.toLowerCase().includes(q) ||
      t.content.toLowerCase().includes(q);
    return matchSubject && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedTemplates.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`선택한 ${selectedIds.size}개 템플릿을 삭제하시겠습니까?`)) {
      deleteFeedbackTemplates(Array.from(selectedIds));
      setSelectedIds(new Set());
      setTemplates(getFeedbackTemplates());
      setCurrentPage(1);
    }
  };

  const handleExport = () => {
    const toExport =
      selectedIds.size > 0 ? templates.filter((t) => selectedIds.has(t.id)) : templates;
    const text = toExport.map((t) => `[${t.subject}] ${t.name}\n${t.content}\n---`).join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `피드백템플릿_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0">
      <div className="rounded-xl border border-border/50 bg-white">
        <div className="px-5 pt-1">
          <Tabs
            items={tabs}
            value={activeTab}
            onChange={setActiveTab}
            rightContent={
              activeTab === 'templates' ? (
                <Button size="sm" icon={Plus} onClick={() => setTemplateModal({ mode: 'create' })}>
                  새 템플릿 추가
                </Button>
              ) : undefined
            }
          />
        </div>

        {/* 피드백 목록 탭 */}
        {activeTab === 'feedback' && (
          <div className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex h-9 items-center rounded-lg bg-secondary p-0.5">
                {(
                  [
                    {
                      value: 'all',
                      label: '전체',
                      count: pendingFeedback.length + completedStoredFeedback.length,
                    },
                    { value: 'pending', label: '작성 대기', count: pendingFeedback.length },
                    { value: 'completed', label: '완료', count: completedStoredFeedback.length },
                  ] as const
                ).map(({ value, label, count }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFeedbackStatusFilter(value)}
                    className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                      feedbackStatusFilter === value
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
              {overdueCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  마감 초과 {overdueCount}건
                </span>
              )}
            </div>

          <div className="overflow-hidden rounded-xl border border-border/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 bg-secondary/50">
                  <tr className="border-b border-border">
                    {FEEDBACK_TABLE_HEADERS.map((header) => (
                      <th
                        key={header}
                        className="px-5 py-3 text-left text-xs font-semibold text-foreground/60"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(feedbackStatusFilter === 'all' || feedbackStatusFilter === 'pending') &&
                    pendingFeedback.map((assignment) => {
                      const mentee = mentees.find((m) => m.id === assignment.menteeId);
                      const deadlineStatus = getDeadlineStatus(assignment.submittedAt);
                      const remainingMs = getRemainingMs(assignment.submittedAt);
                      const statusBadge =
                        deadlineStatus === 'overdue' ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            마감 초과
                          </span>
                        ) : deadlineStatus === 'urgent' ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {formatRemainingTime(remainingMs)} 남음
                          </span>
                        ) : (
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/60">
                            {formatDeadline(assignment.submittedAt)}까지
                          </span>
                        );
                      return (
                        <tr
                          key={assignment.id}
                          className={`border-b border-border/50 transition-colors hover:bg-secondary/30 ${
                            deadlineStatus === 'urgent' ? 'bg-amber-50/30' : ''
                          }`}
                        >
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              대기
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
                              {assignment.subject}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-sm font-semibold text-foreground">
                            {assignment.title}
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground/70">
                            {mentee?.name ?? '-'}
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground/50">
                            {assignment.submittedAt}
                          </td>
                          <td className="px-5 py-3">{statusBadge}</td>
                          <td className="px-5 py-3">
                            <Link
                              to={`/mentor/mentees/${assignment.menteeId}/feedback/${assignment.id}`}
                            >
                              <Button size="sm">피드백 작성</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}

                  {(feedbackStatusFilter === 'all' || feedbackStatusFilter === 'completed') &&
                    completedStoredFeedback.map((stored) => {
                      const mentee = mentees.find((m) => m.id === stored.menteeId);
                      return (
                        <tr
                          key={`${stored.menteeId}-${stored.assignmentId}`}
                          className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                        >
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              완료
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            {stored.subject && (
                              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
                                {stored.subject}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-sm font-semibold text-foreground">
                            {stored.assignmentTitle ?? '과제'}
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground/70">
                            {mentee?.name ?? '-'}
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground/50">
                            {stored.submittedAt ?? stored.feedbackDate}
                          </td>
                          <td className="px-5 py-3">
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              완료
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <Link
                              to={`/mentor/mentees/${stored.menteeId}/feedback/${stored.assignmentId}`}
                            >
                              <Button size="sm" variant="outline">
                                보기/수정
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* 빈 상태 */}
            {((feedbackStatusFilter === 'all' &&
              pendingFeedback.length === 0 &&
              completedStoredFeedback.length === 0) ||
              (feedbackStatusFilter === 'pending' && pendingFeedback.length === 0) ||
              (feedbackStatusFilter === 'completed' && completedStoredFeedback.length === 0)) && (
              <div className="flex min-h-[200px] flex-col items-center justify-center py-8">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-foreground/60">
                  {feedbackStatusFilter === 'pending'
                    ? '작성 대기 중인 피드백이 없습니다.'
                    : feedbackStatusFilter === 'completed'
                      ? '완료된 피드백이 없습니다.'
                      : '피드백이 없습니다.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

        {/* 피드백 템플릿 관리 탭 */}
        {activeTab === 'templates' && (
          <div className="space-y-4 p-5">
            {/* 상단 툴바 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex h-9 items-center rounded-lg bg-secondary p-0.5">
                {['전체', '국어', '영어', '수학', '공통'].map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => {
                      setSubjectFilter(sub);
                      setCurrentPage(1);
                    }}
                    className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                      subjectFilter === sub
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="템플릿 검색..."
                  value={templateSearch}
                  onChange={(e) => {
                    setTemplateSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="h-9 w-56 rounded-lg border border-border/60 bg-secondary/30 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground/60">
                    선택 {selectedIds.size}개
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  icon={Trash2}
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                >
                  선택 삭제
                </Button>
                <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
                  내보내기
                </Button>
              </div>
            </div>

            {/* 템플릿 테이블 */}
            <div className="overflow-hidden rounded-xl border border-border/50">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="w-10 px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            paginatedTemplates.length > 0 &&
                            paginatedTemplates.every((t) => selectedIds.has(t.id))
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-border"
                        />
                      </th>
                      {TEMPLATE_TABLE_HEADERS.map((header) => (
                        <th
                          key={header}
                          className="px-4 py-3 text-left text-xs font-semibold text-foreground/60"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTemplates.map((template) => {
                      const SubjectIcon = SUBJECT_ICONS[template.subject] ?? Hexagon;
                      return (
                        <tr
                          key={template.id}
                          className="group border-b border-border/50 transition-colors hover:bg-secondary/30"
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(template.id)}
                              onChange={(e) => handleSelectOne(template.id, e.target.checked)}
                              className="rounded border-border"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-semibold text-foreground">{template.name}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
                              <SubjectIcon className="h-3.5 w-3.5" />
                              {template.subject}
                            </span>
                          </td>
                          <td className="max-w-[240px] px-4 py-3">
                            <p className="truncate text-sm text-foreground/60">{template.content}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground/50">
                            {template.createdAt.replace(/-/g, '.')}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground/60">
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
                              {template.useCount}회
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => setTemplateModal({ mode: 'view', template })}
                                className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                title="보기"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemplateModal({ mode: 'edit', template })}
                                className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                title="편집"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (
                                    window.confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)
                                  ) {
                                    deleteFeedbackTemplate(template.id);
                                    setTemplates(getFeedbackTemplates());
                                  }
                                }}
                                className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                title="삭제"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="flex flex-col gap-4 border-t border-border bg-secondary/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground/60">
                    {(currentPage - 1) * PAGE_SIZE + 1}-
                    {Math.min(currentPage * PAGE_SIZE, filteredTemplates.length)} of{' '}
                    {filteredTemplates.length}
                  </span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-[32px] rounded px-2 py-1.5 text-sm font-medium ${
                            currentPage === page
                              ? 'bg-foreground text-white'
                              : 'text-foreground/60 hover:bg-secondary'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 학습 리포트 탭 */}
        {activeTab === 'analytics' && (
          <div className="p-5">
            <LearningAnalyticsSection />
          </div>
        )}
      </div>{/* 흰색 카드 닫기 */}

      {/* 새 템플릿 / 편집 모달 */}
      {(templateModal?.mode === 'create' || templateModal?.mode === 'edit') && (
        <TemplateEditModal
          template={templateModal.mode === 'edit' ? templateModal.template : null}
          existingTemplates={templates}
          onClose={() => setTemplateModal(null)}
          onSave={(t) => {
            saveFeedbackTemplate(t);
            setTemplates(getFeedbackTemplates());
            setTemplateModal(null);
          }}
        />
      )}

      {/* 보기 모달 */}
      {templateModal?.mode === 'view' && (
        <TemplateViewModal
          template={templateModal.template}
          onClose={() => setTemplateModal(null)}
        />
      )}
    </div>
  );
}

function TemplateEditModal({
  template,
  existingTemplates,
  onClose,
  onSave,
}: {
  template: FeedbackTemplate | null;
  existingTemplates: FeedbackTemplate[];
  onClose: () => void;
  onSave: (
    t: Omit<FeedbackTemplate, 'useCount'> & { useCount?: number; isDefault?: boolean },
  ) => void;
}) {
  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState<FeedbackTemplate['subject']>(template?.subject ?? '국어');
  const [content, setContent] = useState(template?.content ?? DEFAULT_TEMPLATE_CONTENT);
  const [loadTemplateOpen, setLoadTemplateOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    onSave({
      id: template?.id ?? `t-${Date.now()}`,
      name: name.trim(),
      subject,
      content: content.trim(),
      createdAt: template?.createdAt ?? new Date().toISOString().split('T')[0],
      useCount: template?.useCount ?? 0,
    });
  };

  const handleLoadTemplate = (t: FeedbackTemplate) => {
    setContent(t.content);
    setSubject(t.subject);
    setLoadTemplateOpen(false);
  };

  const handleReset = () => {
    setContent(DEFAULT_TEMPLATE_CONTENT);
  };

  const templatesToLoad = existingTemplates.filter((t) => t.id !== template?.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            {template ? '템플릿 수정' : '템플릿 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5 px-6 py-4">
            {/* 템플릿 명칭 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                템플릿 명칭 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="템플릿 이름을 입력해주세요"
                className="w-full rounded-lg border border-border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>

            {/* 과목 선택 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground/80">
                과목 선택 <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex rounded-lg bg-secondary p-1">
                {(['국어', '영어', '수학', '공통'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      subject === sub
                        ? 'bg-white text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* 템플릿 본문 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">
                템플릿 본문 <span className="text-red-500">*</span>
              </label>
              <div className="mb-2 flex gap-2">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    onClick={() => setLoadTemplateOpen((v) => !v)}
                  >
                    템플릿 불러오기
                  </Button>
                  {loadTemplateOpen && templatesToLoad.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setLoadTemplateOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-72 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
                        {templatesToLoad.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleLoadTemplate(t)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground/80 hover:bg-secondary/50"
                          >
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-xs font-medium text-foreground/60">
                              {t.subject}
                            </span>
                            <span className="truncate">{t.name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={handleReset}
                >
                  초기화
                </Button>
              </div>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="피드백 템플릿 내용을 작성하세요..."
                className="min-h-[300px]"
              />
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-2 border-t border-border/50 px-6 py-4">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={!name.trim() || !content.trim()}>
              저장하기
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TemplateViewModal({
  template,
  onClose,
}: {
  template: FeedbackTemplate;
  onClose: () => void;
}) {
  const SubjectIcon = SUBJECT_ICONS[template.subject] ?? Hexagon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-border bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{template.name}</h2>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground/70">
              <SubjectIcon className="h-3.5 w-3.5" />
              {template.subject}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            ×
          </button>
        </div>
        <div className="mt-4 rounded-lg bg-secondary/50 p-4">
          <p className="whitespace-pre-wrap text-sm text-foreground/80">{template.content}</p>
        </div>
        <div className="mt-4 flex justify-between text-xs text-foreground/50">
          <span>생성일: {template.createdAt.replace(/-/g, '.')}</span>
          <span>사용 횟수: {template.useCount}회</span>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
