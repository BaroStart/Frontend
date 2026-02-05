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
  Info,
  List,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/Button';
import { useSubmittedAssignments } from '@/hooks/useSubmittedAssignments';
import { useMentees } from '@/hooks/useMentees';
import { LearningAnalyticsSection } from '@/components/mentor/LearningAnalyticsSection';
import {
  DEFAULT_TEMPLATE_CONTENT,
  getFeedbackTemplates,
  saveFeedbackTemplate,
  deleteFeedbackTemplate,
  deleteFeedbackTemplates,
  type FeedbackTemplate,
} from '@/lib/feedbackTemplateStorage';
import { getAllCompletedFeedback } from '@/lib/mentorFeedbackStorage';
import {
  getDeadlineStatus,
  formatDeadline,
  formatRemainingTime,
  getRemainingMs,
} from '@/lib/feedbackDeadline';

type TabType = 'feedback' | 'templates' | 'analytics';

const SUBJECT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  국어: BookOpen,
  영어: FileText,
  수학: Calculator,
  공통: Hexagon,
};

export function FeedbackManagePage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('feedback');
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('전체');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FeedbackTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<FeedbackTemplate | null>(null);

  const PAGE_SIZE = 8;

  const { data: submittedAssignments = [] } = useSubmittedAssignments();
  const { data: mentees = [] } = useMentees();

  // URL 쿼리 파라미터에서 탭 읽기
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['feedback', 'templates', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 템플릿 로드
  useEffect(() => {
    setTemplates(getFeedbackTemplates());
  }, [templateModalOpen, editingTemplate, viewingTemplate]);

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
    (a) => getDeadlineStatus(a.submittedAt) === 'overdue'
  ).length;

  const tabs = [
    { id: 'feedback' as TabType, label: '피드백 작성 대기', icon: FileText },
    { id: 'templates' as TabType, label: '피드백 템플릿 관리', icon: List },
    { id: 'analytics' as TabType, label: '통계 분석', icon: BarChart3 },
  ];

  // 템플릿 필터링
  const filteredTemplates = templates.filter((t) => {
    if (subjectFilter === '전체') return true;
    return t.subject === subjectFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTemplates.length / PAGE_SIZE));
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 요약 카드
  const totalCount = templates.length;
  const koreanCount = templates.filter((t) => t.subject === '국어').length;
  const englishCount = templates.filter((t) => t.subject === '영어').length;
  const mathCount = templates.filter((t) => t.subject === '수학').length;

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
    const toExport = selectedIds.size > 0
      ? templates.filter((t) => selectedIds.has(t.id))
      : templates;
    const text = toExport
      .map((t) => `[${t.subject}] ${t.name}\n${t.content}\n---`)
      .join('\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `피드백템플릿_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            피드백을 관리하고 템플릿을 활용하여 작성 시간을 단축하세요
          </p>
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

      {/* 피드백 관리 탭 */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* 작성 대기 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">피드백 작성 대기</h3>
              {overdueCount > 0 && (
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                  마감 초과 {overdueCount}건
                </span>
              )}
            </div>
            {pendingFeedback.length === 0 ? (
              <div className="flex min-h-[120px] flex-col items-center justify-center py-8">
                <FileText className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">작성 대기 중인 피드백이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingFeedback.map((assignment) => {
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
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {formatDeadline(assignment.submittedAt)}까지
                      </span>
                    );
                  return (
                    <div
                      key={assignment.id}
                      className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                        deadlineStatus === 'overdue'
                          ? 'border-red-200 bg-red-50/50'
                          : deadlineStatus === 'urgent'
                            ? 'border-amber-200 bg-amber-50/30'
                            : 'border-slate-100 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                          {assignment.subject}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-slate-900">{assignment.title}</p>
                            {statusBadge}
                          </div>
                          <p className="text-xs text-slate-500">
                            {mentee?.name ?? '-'} · {assignment.submittedAt}
                          </p>
                        </div>
                      </div>
                      <Link
                        to={`/mentor/mentees/${assignment.menteeId}/feedback/${assignment.id}`}
                      >
                        <Button size="sm">피드백 작성</Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 작성 완료 - 내가 작성한 피드백 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="mb-4 text-base font-semibold text-slate-900">작성 완료</h3>
            {completedStoredFeedback.length === 0 ? (
              <div className="flex min-h-[120px] flex-col items-center justify-center py-8">
                <FileText className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">작성 완료된 피드백이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedStoredFeedback.map((stored) => {
                  const mentee = mentees.find((m) => m.id === stored.menteeId);
                  return (
                    <div
                      key={`${stored.menteeId}-${stored.assignmentId}`}
                      className="rounded-lg border border-slate-200 bg-slate-50/30 p-4"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                          완료
                        </span>
                        {stored.subject && (
                          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {stored.subject}
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {mentee?.name ?? '-'} · {stored.submittedAt ?? stored.feedbackDate}
                        </span>
                      </div>
                      <p className="mb-2 font-medium text-slate-900">
                        {stored.assignmentTitle ?? '과제'}
                      </p>
                      {stored.feedbackText ? (
                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                          <p className="whitespace-pre-wrap text-sm text-slate-700">
                            {stored.feedbackText}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            작성일: {stored.feedbackDate}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">피드백 내용 없음</p>
                      )}
                      <Link
                        to={`/mentor/mentees/${stored.menteeId}/feedback/${stored.assignmentId}`}
                        className="mt-3 inline-block"
                      >
                        <Button size="sm" variant="outline">
                          피드백 보기/수정
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 피드백 템플릿 관리 탭 */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* 상단: 새 템플릿 추가 버튼 */}
          <div className="flex justify-end">
            <Button onClick={() => setTemplateModalOpen(true)}>
              <Plus className="h-4 w-4" />
              새 템플릿 추가
            </Button>
          </div>

          {/* 요약 카드 */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Hexagon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">총 템플릿 개수</p>
                  <p className="text-xl font-bold text-slate-900">{totalCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">국어 템플릿</p>
                  <p className="text-xl font-bold text-slate-900">{koreanCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">영어 템플릿</p>
                  <p className="text-xl font-bold text-slate-900">{englishCount}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">수학 템플릿</p>
                  <p className="text-xl font-bold text-slate-900">{mathCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 필터 탭 */}
          <div className="flex flex-wrap items-center gap-2">
            {['전체', '국어', '영어', '수학', '공통'].map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSubjectFilter(sub);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  subjectFilter === sub
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* 템플릿 테이블 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          paginatedTemplates.length > 0 &&
                          paginatedTemplates.every((t) => selectedIds.has(t.id))
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      템플릿명
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      과목
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      미리보기
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      생성일
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      사용 횟수
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTemplates.map((template) => {
                    const SubjectIcon = SUBJECT_ICONS[template.subject] ?? Hexagon;
                    return (
                      <tr
                        key={template.id}
                        className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(template.id)}
                            onChange={(e) => handleSelectOne(template.id, e.target.checked)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {template.name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            <SubjectIcon className="h-3.5 w-3.5" />
                            {template.subject}
                          </span>
                        </td>
                        <td className="max-w-[240px] px-4 py-3">
                          <p className="truncate text-sm text-slate-600">
                            {template.content}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {template.createdAt.replace(/-/g, '.')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {template.useCount}회
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingTemplate(template)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title="보기"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingTemplate(template)}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                              title="편집"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)) {
                                  deleteFeedbackTemplate(template.id);
                                  setTemplates(getFeedbackTemplates());
                                }
                              }}
                              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
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

            {/* 페이지네이션 & 일괄 작업 */}
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  선택 항목 삭제
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  내보내기
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">
                  {(currentPage - 1) * PAGE_SIZE + 1}-
                  {Math.min(currentPage * PAGE_SIZE, filteredTemplates.length)} of{' '}
                  {filteredTemplates.length}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
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
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-600 hover:bg-slate-200'
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
                    className="rounded p-1.5 text-slate-500 hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 통계 분석 탭 */}
      {activeTab === 'analytics' && <LearningAnalyticsSection />}

      {/* 새 템플릿 / 편집 모달 */}
      {(templateModalOpen || editingTemplate) && (
        <TemplateEditModal
          template={editingTemplate}
          existingTemplates={templates}
          onClose={() => {
            setTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
          onSave={(t) => {
            saveFeedbackTemplate(t);
            setTemplates(getFeedbackTemplates());
            setTemplateModalOpen(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* 보기 모달 */}
      {viewingTemplate && (
        <TemplateViewModal
          template={viewingTemplate}
          onClose={() => setViewingTemplate(null)}
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
  onSave: (t: Omit<FeedbackTemplate, 'useCount'> & { useCount?: number; isDefault?: boolean }) => void;
}) {
  const [name, setName] = useState(template?.name ?? '');
  const [subject, setSubject] = useState<FeedbackTemplate['subject']>(
    template?.subject ?? '국어'
  );
  const [content, setContent] = useState(
    template?.content ?? DEFAULT_TEMPLATE_CONTENT
  );
  const [isDefault, setIsDefault] = useState(template?.isDefault ?? false);
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
      isDefault,
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {template ? '템플릿 수정' : '템플릿 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5 px-6 py-4">
            {/* 템플릿 명칭 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                템플릿 명칭 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="템플릿 이름을 입력해주세요"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                템플릿을 구분할 수 있는 이름을 입력해주세요
              </p>
            </div>

            {/* 과목 선택 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                과목 선택 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(['국어', '영어', '수학', '공통'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                      subject === sub
                        ? 'bg-slate-800 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>

            {/* 템플릿 본문 */}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                템플릿 본문 <span className="text-red-500">*</span>
              </label>
              <div className="mb-2 flex gap-2">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLoadTemplateOpen((v) => !v)}
                  >
                    <Upload className="h-4 w-4" />
                    템플릿 불러오기
                  </Button>
                  {loadTemplateOpen && templatesToLoad.length > 0 && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setLoadTemplateOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        {templatesToLoad.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleLoadTemplate(t)}
                            className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4" />
                  초기화
                </Button>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="[섹션명] 형식으로 구조를 작성하세요"
                rows={12}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                required
              />
            </div>

            {/* 템플릿 작성 가이드 */}
            <div className="flex gap-2 rounded-lg bg-slate-50 p-3">
              <Info className="h-5 w-5 shrink-0 text-slate-500" />
              <div className="text-xs text-slate-600">
                <p className="font-medium text-slate-700">템플릿 작성 가이드</p>
                <ul className="mt-1 space-y-0.5">
                  <li>• 대괄호 []를 사용하여 섹션을 구분할 수 있습니다</li>
                  <li>• 학생별 맞춤 피드백을 위한 구조를 자유롭게 설계하세요</li>
                  <li>• 반복적으로 사용할 문구나 형식을 저장하면 효율적입니다</li>
                </ul>
              </div>
            </div>

            {/* 기본 템플릿으로 설정 */}
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">기본 템플릿으로 설정</span>
            </label>
          </div>

          {/* 하단 버튼 */}
          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
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
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{template.name}</h2>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
              <SubjectIcon className="h-3.5 w-3.5" />
              {template.subject}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ×
          </button>
        </div>
        <div className="mt-4 rounded-lg bg-slate-50 p-4">
          <p className="whitespace-pre-wrap text-sm text-slate-700">{template.content}</p>
        </div>
        <div className="mt-4 flex justify-between text-xs text-slate-500">
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
