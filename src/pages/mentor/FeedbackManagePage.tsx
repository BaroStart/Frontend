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

export function FeedbackManagePage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('feedback');
  const [templates, setTemplates] = useState<FeedbackTemplate[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('전체');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | 'pending' | 'completed'>(
    'all',
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<FeedbackTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<FeedbackTemplate | null>(null);

  const PAGE_SIZE = 8;

  const { data: submittedAssignments = [] } = useSubmittedAssignments();
  const { data: mentees = [] } = useMentees();

  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && ['feedback', 'templates', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

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
    (a) => getDeadlineStatus(a.submittedAt) === 'overdue',
  ).length;

  const tabs = [
    { id: 'feedback' as TabType, label: '피드백 목록', icon: FileText },
    { id: 'templates' as TabType, label: '피드백 템플릿 관리', icon: List },
    { id: 'analytics' as TabType, label: '통계 분석', icon: BarChart3 },
  ];

  const filteredTemplates = templates.filter((t) => {
    if (subjectFilter === '전체') return true;
    return t.subject === subjectFilter;
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
    <div className="min-w-0 space-y-6">
      <Tabs
        items={tabs}
        value={activeTab}
        onChange={setActiveTab}
        rightContent={
          activeTab === 'templates' ? (
            <Button icon={Plus} onClick={() => setTemplateModalOpen(true)}>
              새 템플릿 추가
            </Button>
          ) : undefined
        }
      />

      {/* 피드백 목록 탭 */}
      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setFeedbackStatusFilter('all')}
                className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                  feedbackStatusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                전체 ({pendingFeedback.length + completedStoredFeedback.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedbackStatusFilter('pending')}
                className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                  feedbackStatusFilter === 'pending'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                작성 대기 ({pendingFeedback.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedbackStatusFilter('completed')}
                className={`h-8 rounded-md px-3 text-sm font-medium transition-colors ${
                  feedbackStatusFilter === 'completed'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                완료 ({completedStoredFeedback.length})
              </button>
            </div>
            {overdueCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                마감 초과 {overdueCount}건
              </span>
            )}
          </div>

          {/* 피드백 목록 */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b-2 border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      과목
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      과제명
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      멘티
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      제출일
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      마감
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* 작성 대기 목록 */}
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
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {formatDeadline(assignment.submittedAt)}까지
                          </span>
                        );
                      return (
                        <tr
                          key={assignment.id}
                          className={`border-b border-slate-100 transition-colors hover:bg-slate-50/50 ${
                            deadlineStatus === 'overdue'
                              ? 'bg-red-50/50'
                              : deadlineStatus === 'urgent'
                                ? 'bg-amber-50/30'
                                : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              대기
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {assignment.subject}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {assignment.title}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {mentee?.name ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {assignment.submittedAt}
                          </td>
                          <td className="px-4 py-3">{statusBadge}</td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/mentor/mentees/${assignment.menteeId}/feedback/${assignment.id}`}
                            >
                              <Button size="sm">피드백 작성</Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}

                  {/* 완료 목록 */}
                  {(feedbackStatusFilter === 'all' || feedbackStatusFilter === 'completed') &&
                    completedStoredFeedback.map((stored) => {
                      const mentee = mentees.find((m) => m.id === stored.menteeId);
                      return (
                        <tr
                          key={`${stored.menteeId}-${stored.assignmentId}`}
                          className="border-b border-slate-100 transition-colors hover:bg-slate-50/50"
                        >
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              완료
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {stored.subject && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                                {stored.subject}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {stored.assignmentTitle ?? '과제'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {mentee?.name ?? '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">
                            {stored.submittedAt ?? stored.feedbackDate}
                          </td>
                          <td className="px-4 py-3">
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              완료
                            </span>
                          </td>
                          <td className="px-4 py-3">
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
                <FileText className="h-10 w-10 text-slate-300" />
                <p className="mt-3 text-sm text-slate-500">
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
        <div className="space-y-6">
          <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5">
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
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
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
                        <td className="px-4 py-3 font-medium text-slate-900">{template.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            <SubjectIcon className="h-3.5 w-3.5" />
                            {template.subject}
                          </span>
                        </td>
                        <td className="max-w-[240px] px-4 py-3">
                          <p className="truncate text-sm text-slate-600">{template.content}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {template.createdAt.replace(/-/g, '.')}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{template.useCount}회</td>
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
                                if (
                                  window.confirm(`"${template.name}" 템플릿을 삭제하시겠습니까?`)
                                ) {
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
                  icon={Trash2}
                  onClick={handleBulkDelete}
                  disabled={selectedIds.size === 0}
                >
                  선택 항목 삭제
                </Button>
                <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
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
        <TemplateViewModal template={viewingTemplate} onClose={() => setViewingTemplate(null)} />
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
            </div>

            {/* 과목 선택 */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                과목 선택 <span className="text-red-500">*</span>
              </label>
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                {(['국어', '영어', '수학', '공통'] as const).map((sub) => (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setSubject(sub)}
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      subject === sub
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
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
                      <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-72 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        {templatesToLoad.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleLoadTemplate(t)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
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
