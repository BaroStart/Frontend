import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Maximize2,
  Plus,
  RotateCcw,
  RotateCw,
  Star,
  Trash2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { API_CONFIG } from '@/api/config';
import { AuthPhotoViewer } from '@/components/mentor/AuthPhotoViewer';
import { Button } from '@/components/ui/Button';
import { Calendar as CalendarComponent } from '@/components/ui/Calendar';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { useAssignmentDetail } from '@/hooks/useAssignmentDetail';
import { useMentee } from '@/hooks/useMentee';
import { useSubmittedAssignments } from '@/hooks/useSubmittedAssignments';
import { formatRemainingTime, getDeadlineStatus, getRemainingMs } from '@/lib/feedbackDeadline';
import { getDefaultFeedbackTemplate, getFeedbackTemplates } from '@/lib/feedbackTemplateStorage';
import type { FeedbackItem } from '@/lib/mentorFeedbackStorage';
import { getMentorFeedback, saveMentorFeedback } from '@/lib/mentorFeedbackStorage';
import { cn } from '@/lib/utils';

function parseDateFromSubmittedAt(submittedAt: string): string {
  const match = submittedAt.match(/^(\d{4})\.(\d{2})\.(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  return new Date().toISOString().slice(0, 10);
}

interface FeedbackItemData {
  id: string;
  text: string;
  isImportant: boolean;
}

export function FeedbackWritePage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { menteeId, assignmentId } = useParams<{
    menteeId: string;
    assignmentId: string;
  }>();
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItemData[]>([
    { id: '1', text: '', isImportant: false },
    { id: '2', text: '', isImportant: true },
    { id: '3', text: '', isImportant: false },
  ]);
  const [status, setStatus] = useState<'partial' | 'completed'>('completed');
  const [saving, setSaving] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>('');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [assignmentDropdownOpen, setAssignmentDropdownOpen] = useState(false);
  const [calendarView, setCalendarView] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });

  const { data: assignmentDetail } = useAssignmentDetail(menteeId, assignmentId);
  const { data: mentee } = useMentee(menteeId);
  const { data: submittedAssignments = [] } = useSubmittedAssignments(menteeId);
  const assignmentFromList = submittedAssignments.find(
    (a) => a.menteeId === menteeId && a.id === assignmentId,
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
  const subject = (assignmentDetail?.subject ?? assignmentFromList?.subject ?? '') as
    | '국어'
    | '영어'
    | '수학'
    | '공통';
  const photos = assignmentDetail?.studentPhotos ?? [];
  // 모든 템플릿 표시 (과목 무관)
  const templates = useMemo(() => getFeedbackTemplates(), []);

  // 날짜: 선택된 날짜 또는 현재 과제 제출일
  const displayDate =
    selectedDate ??
    (assignmentFromList
      ? parseDateFromSubmittedAt(assignmentFromList.submittedAt)
      : new Date().toISOString().slice(0, 10));
  const displayDateFormatted = displayDate.replace(/-/g, '.');
  const assignmentsForDate = useMemo(
    () =>
      submittedAssignments.filter((a) => parseDateFromSubmittedAt(a.submittedAt) === displayDate),
    [submittedAssignments, displayDate],
  );

  // 기존 피드백 또는 기본 템플릿 로드
  useEffect(() => {
    if (!menteeId || !assignmentId) return;
    const stored = getMentorFeedback(menteeId, assignmentId);
    if (stored?.feedbackItems?.length) {
      setFeedbackItems(
        stored.feedbackItems.map((item, idx) => ({
          id: item.id || String(idx + 1),
          text: item.text,
          isImportant: item.isImportant,
        })),
      );
      setStatus(stored.status);
      return;
    }
    if (stored?.feedbackText) {
      setFeedbackItems([{ id: '1', text: stored.feedbackText, isImportant: false }]);
      setStatus(stored.status);
      return;
    }
    const defaultTpl = getDefaultFeedbackTemplate(subject);
    if (defaultTpl?.content) {
      setFeedbackItems([{ id: '1', text: defaultTpl.content, isImportant: false }]);
    }
  }, [menteeId, assignmentId, subject]);

  const handleLoadTemplate = useCallback((content: string) => {
    setFeedbackItems((prev) => {
      const newItems = [...prev];
      if (newItems.length > 0) {
        newItems[0] = { ...newItems[0], text: content };
      } else {
        newItems.push({ id: '1', text: content, isImportant: false });
      }
      return newItems;
    });
    setTemplateModalOpen(false);
  }, []);

  const handleAddFeedbackItem = useCallback(() => {
    setFeedbackItems((prev) => [...prev, { id: String(Date.now()), text: '', isImportant: false }]);
  }, []);

  const handleRemoveFeedbackItem = useCallback((id: string) => {
    setFeedbackItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleUpdateFeedbackItem = useCallback((id: string, updates: Partial<FeedbackItemData>) => {
    setFeedbackItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }, []);

  const handleTempSave = useCallback(async () => {
    if (!menteeId || !assignmentId) return;
    setSaving(true);
    try {
      const items: FeedbackItem[] = feedbackItems.map((item) => ({
        id: item.id,
        text: item.text,
        isImportant: item.isImportant,
      }));
      const feedbackText = feedbackItems.map((i) => i.text).join('\n\n');
      saveMentorFeedback({
        menteeId,
        assignmentId,
        feedbackText,
        feedbackItems: items,
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
  }, [menteeId, assignmentId, feedbackItems, queryClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menteeId || !assignmentId) return;
    const hasContent = feedbackItems.some((item) => item.text.trim());
    if (!hasContent) {
      alert('피드백 내용을 입력해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const items: FeedbackItem[] = feedbackItems.map((item) => ({
        id: item.id,
        text: item.text,
        isImportant: item.isImportant,
      }));
      const feedbackText = feedbackItems.map((i) => i.text).join('\n\n');
      if (API_CONFIG.useMock) {
        saveMentorFeedback({
          menteeId,
          assignmentId,
          feedbackText,
          feedbackItems: items,
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

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  if (!menteeId || !assignmentId) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <p className="text-slate-500">잘못된 경로입니다.</p>
        <Link to="/mentor/feedback" className="mt-4 text-sm text-slate-600 underline">
          피드백 관리로 돌아가기
        </Link>
      </div>
    );
  }

  // 요일 표시
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dateObj = new Date(displayDate);
  const dayName = dayNames[dateObj.getDay()];

  return (
    <div className="-m-4 flex h-[calc(100vh-4rem)] flex-col bg-slate-50 sm:-m-6">
      <div className="flex shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200">
            <span className="text-sm font-medium text-slate-600">{mentee?.name?.[0] ?? '?'}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{mentee?.name ?? '멘티'}</p>
            <p className="text-xs text-slate-500">
              {mentee?.grade ?? '고3'} · {mentee?.track ?? '이과'}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setDatePickerOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              datePickerOpen
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            <Calendar className="h-4 w-4" />
            {displayDateFormatted} ({dayName})
          </button>
          {datePickerOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDatePickerOpen(false)}
                aria-hidden
              />
              <div className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                <CalendarComponent
                  year={calendarView.year}
                  month={calendarView.month}
                  selectedDate={displayDate}
                  onDateSelect={(date) => {
                    handleDateSelect(date);
                    setDatePickerOpen(false);
                  }}
                  onMonthChange={(year, month) => setCalendarView({ year, month })}
                />
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setAssignmentDropdownOpen((o) => !o)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              assignmentDropdownOpen
                ? 'bg-slate-200 text-slate-900'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
            )}
          >
            <FileText className="h-4 w-4" />
            <span className="max-w-[200px] truncate">{title}</span>
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', assignmentDropdownOpen && 'rotate-180')}
            />
          </button>
          {assignmentDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setAssignmentDropdownOpen(false)}
                aria-hidden
              />
              <div className="absolute left-0 top-full z-50 mt-1 max-h-60 min-w-[280px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {assignmentsForDate.length === 0 ? (
                  <p className="px-3 py-4 text-center text-sm text-slate-500">
                    해당 날짜에 제출된 과제가 없습니다
                  </p>
                ) : (
                  assignmentsForDate.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setAssignmentDropdownOpen(false);
                        if (a.id !== assignmentId && menteeId) {
                          navigate(`/mentor/mentees/${menteeId}/feedback/${a.id}`);
                        }
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm transition-colors',
                        a.id === assignmentId
                          ? 'bg-slate-100 font-medium text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50',
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

        {/* 우측: 마 시간 */}
        {assignmentFromList?.submittedAt && remainingTime && (
          <div
            className={cn(
              'ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
              getDeadlineStatus(assignmentFromList.submittedAt) === 'overdue'
                ? 'bg-red-100 text-red-700'
                : getDeadlineStatus(assignmentFromList.submittedAt) === 'urgent'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600',
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {getDeadlineStatus(assignmentFromList.submittedAt) === 'overdue'
              ? '마감 초과'
              : `마감 ${remainingTime} 전`}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 gap-0 overflow-hidden">
        <div className="flex w-1/2 min-w-[400px] flex-col border-r border-slate-200 bg-slate-800">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-300">인증 사진 뷰어</span>
              {photos.length > 0 && (
                <div className="flex items-center gap-1 rounded bg-slate-700 px-2 py-0.5">
                  <span className="text-xs text-slate-300">
                    {photos[0]?.caption || photos[0]?.url?.split('/').pop() || '국어_과제1.jpg'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title="축소"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs text-slate-400">100%</span>
              <button
                type="button"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title="확대"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title="회전"
              >
                <RotateCw className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                title="전체 화면"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 items-center justify-center p-4">
            {photos.length > 0 ? (
              <AuthPhotoViewer photos={photos} className="h-full w-full" darkMode />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="rounded-full bg-slate-700 p-4">
                  <FileText className="h-8 w-8" />
                </div>
                <p className="text-sm">제출된 인증 사진이 없습니다</p>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 피드백 작성 영역 */}
        <div className="flex min-h-0 w-1/2 min-w-[400px] flex-1 flex-col bg-white">
          {/* 피드백 작성 헤더 */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-3">
            <h2 className="text-base font-semibold text-slate-900">피드백 등록</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                이전 피드백 보기
              </button>
              <button
                type="button"
                onClick={() => setTemplateModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" />
                템플릿 불러오기
              </button>
            </div>
          </div>

          {/* 피드백 폼 */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
              {/* 과목 + 날짜 헤더 */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-xs">
                      📚
                    </span>
                    {subject || '국어'}
                  </span>
                </div>
                <span className="text-sm text-slate-500">{displayDateFormatted}</span>
              </div>

              <div className="space-y-4">
                {feedbackItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">
                        피드백 항목 {index + 1}
                      </label>
                      {feedbackItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFeedbackItem(item.id)}
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <RichTextEditor
                      content={item.text}
                      onChange={(html) => handleUpdateFeedbackItem(item.id, { text: html })}
                      placeholder="구체적이고 건설적인 피드백을 작성해주세요..."
                      className="mb-3"
                    />
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={item.isImportant}
                        onChange={(e) =>
                          handleUpdateFeedbackItem(item.id, {
                            isImportant: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                      />
                      <Star
                        className={cn(
                          'h-4 w-4',
                          item.isImportant ? 'fill-amber-400 text-amber-400' : 'text-slate-400',
                        )}
                      />
                      <span>중요 피드백 (멘티 요약 카드 전송)</span>
                    </label>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddFeedbackItem}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
              >
                <Plus className="h-4 w-4" />
                피드백 항목 추가
              </button>
            </div>

            {/* 하단 버튼 */}
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <Button type="button" variant="outline" onClick={handleTempSave} disabled={saving}>
                임시 저장
              </Button>
              <Link to="/mentor/feedback">
                <Button type="button" variant="outline">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={saving || !feedbackItems.some((i) => i.text.trim())}>
                <FileText className="h-4 w-4" />
                {saving ? '저장 중...' : '피드백 저장'}
              </Button>
            </div>
          </form>
        </div>
      </div>

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
              <h3 className="font-semibold text-slate-900">피드백 템플릿 불러오기</h3>
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
