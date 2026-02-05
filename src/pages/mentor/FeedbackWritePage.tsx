import {
  ArrowLeft,
  ChevronDown,
  FileText,
  RotateCcw,
  Star,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { API_CONFIG } from '@/api/config';
import { AuthPhotoViewer } from '@/components/mentor/AuthPhotoViewer';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/Button';
import { useAssignmentDetail } from '@/hooks/useAssignmentDetail';
import { useMentee } from '@/hooks/useMentee';
import { useSubmittedAssignments } from '@/hooks/useSubmittedAssignments';
import {
  getDefaultFeedbackTemplate,
  getFeedbackTemplates,
} from '@/lib/feedbackTemplateStorage';
import type { FeedbackItem } from '@/lib/mentorFeedbackStorage';
import {
  getMentorFeedback,
  saveMentorFeedback,
} from '@/lib/mentorFeedbackStorage';
import {
  getDeadlineStatus,
  formatRemainingTime,
  getRemainingMs,
} from '@/lib/feedbackDeadline';
import { cn } from '@/lib/utils';

function parseDateFromSubmittedAt(submittedAt: string): string {
  const match = submittedAt.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return new Date().toISOString().slice(0, 10);
}

export function FeedbackWritePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { menteeId, assignmentId } = useParams<{
    menteeId: string;
    assignmentId: string;
  }>();
  const [feedbackText, setFeedbackText] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [status, setStatus] = useState<'partial' | 'completed'>('completed');
  const [saving, setSaving] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [assignmentDropdownOpen, setAssignmentDropdownOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');

  const { data: assignmentDetail } = useAssignmentDetail(menteeId, assignmentId);
  const { data: mentee } = useMentee(menteeId);
  const { data: submittedAssignments = [] } = useSubmittedAssignments(menteeId);
  const assignmentFromList = submittedAssignments.find(
    (a) => a.menteeId === menteeId && a.id === assignmentId
  );

  // 피드백 마감(다음날 11시) 남은 시간 갱신
  useEffect(() => {
    if (!assignmentFromList?.submittedAt) {
      setRemainingTime('');
      return;
    }
    const update = () =>
      setRemainingTime(formatRemainingTime(getRemainingMs(assignmentFromList.submittedAt)));
    update();
    const id = setInterval(update, 60000); // 1분마다 갱신
    return () => clearInterval(id);
  }, [assignmentFromList?.submittedAt]);

  const title = assignmentDetail?.title ?? assignmentFromList?.title ?? '과제';
  const subject =
    (assignmentDetail?.subject ?? assignmentFromList?.subject ?? '') as
      | '국어'
      | '영어'
      | '수학'
      | '공통';
  const photos = assignmentDetail?.studentPhotos ?? [];
  const templates = useMemo(
    () =>
      getFeedbackTemplates().filter(
        (t) => t.subject === subject || t.subject === '공통'
      ),
    [subject]
  );

  // 날짜: 선택된 날짜 또는 현재 과제 제출일
  const displayDate = selectedDate ?? (assignmentFromList ? parseDateFromSubmittedAt(assignmentFromList.submittedAt) : new Date().toISOString().slice(0, 10));
  const displayDateFormatted = displayDate.replace(/-/g, '.');
  const assignmentsForDate = useMemo(
    () =>
      submittedAssignments.filter(
        (a) => parseDateFromSubmittedAt(a.submittedAt) === displayDate
      ),
    [submittedAssignments, displayDate]
  );
  const assignmentsToShow = assignmentsForDate.length > 0 ? assignmentsForDate : submittedAssignments;

  // 기존 피드백 또는 기본 템플릿 로드
  useEffect(() => {
    if (!menteeId || !assignmentId) return;
    const stored = getMentorFeedback(menteeId, assignmentId);
    if (stored?.feedbackItems?.length) {
      const first = stored.feedbackItems[0];
      setFeedbackText(first.text);
      setIsImportant(first.isImportant);
      setStatus(stored.status);
      return;
    }
    if (stored?.feedbackText) {
      setFeedbackText(stored.feedbackText);
      setIsImportant(false);
      setStatus(stored.status);
      return;
    }
    const defaultTpl = getDefaultFeedbackTemplate(subject);
    setFeedbackText(defaultTpl?.content ?? '');
    setIsImportant(false);
  }, [menteeId, assignmentId, subject]);

  const handleLoadTemplate = useCallback((content: string) => {
    setFeedbackText(content);
    setTemplateModalOpen(false);
  }, []);

  const handleTempSave = useCallback(async () => {
    if (!menteeId || !assignmentId) return;
    setSaving(true);
    try {
      const feedbackItems: FeedbackItem[] = [
        { id: 'single', text: feedbackText, isImportant },
      ];
      saveMentorFeedback({
        menteeId,
        assignmentId,
        feedbackText,
        feedbackItems,
        status: 'partial',
        progress: 50,
        feedbackDate: new Date().toLocaleString('ko-KR'),
        isDraft: true,
      });
      queryClient.invalidateQueries({ queryKey: ['feedbackItems', menteeId] });
      alert('임시 저장되었습니다.');
    } finally {
      setSaving(false);
    }
  }, [menteeId, assignmentId, feedbackText, isImportant, queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menteeId || !assignmentId) return;
    if (!feedbackText.trim()) {
      alert('피드백 내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const feedbackItems: FeedbackItem[] = [
        { id: 'single', text: feedbackText, isImportant },
      ];
      if (API_CONFIG.useMock) {
        saveMentorFeedback({
          menteeId,
          assignmentId,
          feedbackText,
          feedbackItems,
          status,
          feedbackDate: new Date().toLocaleString('ko-KR'),
          isDraft: false,
          assignmentTitle: title,
          subject,
          submittedAt: assignmentFromList?.submittedAt,
        });
        queryClient.invalidateQueries({ queryKey: ['submittedAssignments'] });
        queryClient.invalidateQueries({ queryKey: ['feedbackItems', menteeId] });
        queryClient.invalidateQueries({ queryKey: ['mentees'] });
        alert('피드백이 저장되었습니다. 멘티에게 알림이 발송됩니다.');
        window.history.back();
      } else {
        const { submitFeedback } = await import('@/api/feedback');
        await submitFeedback(menteeId, assignmentId, {
          feedbackText,
          status,
          progress: status === 'partial' ? 50 : undefined,
        });
        queryClient.invalidateQueries({ queryKey: ['submittedAssignments'] });
        queryClient.invalidateQueries({ queryKey: ['feedbackItems', menteeId] });
        queryClient.invalidateQueries({ queryKey: ['mentees'] });
        alert('피드백이 저장되었습니다.');
        window.history.back();
      }
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleAssignmentSelect = (id: string) => {
    setAssignmentDropdownOpen(false);
    if (id !== assignmentId && menteeId) {
      navigate(`/mentor/mentees/${menteeId}/feedback/${id}`);
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  if (!menteeId || !assignmentId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-slate-500">잘못된 경로입니다.</p>
        <Link
          to="/mentor/feedback"
          className="mt-4 text-sm text-slate-600 underline"
        >
          피드백 관리로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col lg:h-[calc(100vh-4rem)]">
      {/* 상단 헤더 */}
      <div className="flex shrink-0 flex-col gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <Link
            to="/mentor/feedback"
            className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
          <div className="flex items-center gap-3">
            {assignmentFromList?.submittedAt && remainingTime && (
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-medium',
                  getDeadlineStatus(assignmentFromList.submittedAt) === 'overdue'
                    ? 'bg-red-100 text-red-700'
                    : getDeadlineStatus(assignmentFromList.submittedAt) === 'urgent'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                )}
              >
                {getDeadlineStatus(assignmentFromList.submittedAt) === 'overdue'
                  ? '마감 초과'
                  : `오전 11시까지 ${remainingTime} 남음`}
              </span>
            )}
            <h1 className="text-lg font-bold text-slate-900">피드백 작성</h1>
          </div>
        </div>
        {/* 과제 내용, 날짜 선택, 과제 선택 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-20 shrink-0 text-sm font-medium text-slate-600">과제 내용</span>
            <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              {title}
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-20 shrink-0 text-sm font-medium text-slate-600">날짜 선택</span>
            <DatePicker
              value={displayDate}
              onChange={handleDateSelect}
              className="min-w-0 flex-1"
            />
          </div>
          <div className="relative flex min-w-0 items-center gap-3">
            <span className="w-20 shrink-0 text-sm font-medium text-slate-600">과제 선택</span>
            <button
              type="button"
              onClick={() => setAssignmentDropdownOpen((o) => !o)}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-50"
            >
              <span className="truncate">{title}</span>
              <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', assignmentDropdownOpen && 'rotate-180')} />
            </button>
            {assignmentDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAssignmentDropdownOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-full z-50 mt-1 max-h-60 min-w-[200px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  {assignmentsToShow.length === 0 ? (
                    <p className="px-3 py-4 text-center text-sm text-slate-500">
                      제출된 과제가 없습니다
                    </p>
                  ) : (
                    assignmentsToShow.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => handleAssignmentSelect(a.id)}
                        className={cn(
                          'w-full px-3 py-2 text-left text-sm transition-colors',
                          a.id === assignmentId
                            ? 'bg-slate-100 font-medium text-slate-900'
                            : 'text-slate-700 hover:bg-slate-50'
                        )}
                      >
                        <span className="block truncate">{a.title}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {a.subject} · {a.submittedAt}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2단 레이아웃 (모바일: 세로, 데스크톱: 가로) */}
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row lg:overflow-hidden">
        {/* 좌측: 인증 사진 뷰어 */}
        <div className="flex shrink-0 flex-col lg:min-h-0 lg:w-[45%] lg:min-w-[320px] lg:flex-1">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            인증 사진 뷰어
          </h2>
          <AuthPhotoViewer
            photos={photos}
            className="min-h-[280px] flex-1 sm:min-h-[320px] lg:min-h-[360px]"
            darkMode
          />
        </div>

        {/* 우측: 피드백 입력 */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          {/* 멘티 정보 + 버튼 */}
          <div className="flex shrink-0 flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                {mentee?.name?.[0] ?? '?'}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-slate-900">
                    {mentee?.name ?? '멘티'}
                  </p>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    제출 완료
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>국어 · 영어 · 수학</span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full bg-slate-600"
                        style={{ width: '33%' }}
                      />
                    </div>
                    1/3
                  </span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
              <Button
                size="sm"
                variant="outline"
                icon={RotateCcw}
                onClick={() => {}}
                title="이전 피드백 보기"
              >
                이전 피드백 보기
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={FileText}
                onClick={() => setTemplateModalOpen(true)}
              >
                템플릿 불러오기
              </Button>
            </div>
          </div>

          {/* 피드백 입력 영역 */}
          <form
            onSubmit={handleSubmit}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-5">
              {/* 과목 섹션 헤더 */}
              <div className="mb-4 flex items-center gap-3">
                <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
                  {subject || '과목'}
                </span>
                <span className="text-sm text-slate-500">{displayDateFormatted}</span>
              </div>

              {/* 피드백 입력 (단일) */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                <label className="mb-3 block text-sm font-medium text-slate-700">
                  피드백
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="구체적이고 건설적인 피드백을 작성해주세요..."
                  rows={6}
                  className="mb-4 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-slate-400 focus:outline-none"
                />
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500"
                  />
                  <Star
                    className={cn(
                      'h-4 w-4',
                      isImportant ? 'fill-amber-400 text-amber-400' : 'text-slate-400'
                    )}
                  />
                  중요 피드백(피드백 요약)
                </label>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-slate-200 bg-white p-4 sm:p-5">
              <Button
                type="button"
                variant="outline"
                onClick={handleTempSave}
                disabled={saving}
              >
                임시 저장
              </Button>
              <Link to="/mentor/feedback">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving || !feedbackText.trim()}
              >
                <FileText className="h-4 w-4" />
                {saving ? '저장 중...' : '피드백 저장'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 템플릿 선택 모달 */}
      {templateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setTemplateModalOpen(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">
                피드백 템플릿 불러오기
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                잘한 점, 보완할 점 등 템플릿을 선택하세요
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto p-4">
              {templates.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  해당 과목 템플릿이 없습니다
                </p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleLoadTemplate(t.content)}
                      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left text-sm hover:bg-slate-50"
                    >
                      <p className="font-medium text-slate-800">{t.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {t.content.slice(0, 80)}...
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 p-4">
              <Button
                variant="outline"
                onClick={() => setTemplateModalOpen(false)}
                className="w-full"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
