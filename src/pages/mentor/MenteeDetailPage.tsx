import {
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  ListChecks,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  User,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AssignmentDetailModal } from '@/components/mentor/AssignmentDetailModal';
import { ChatModal } from '@/components/mentor/ChatModal';
import { DatePickerModal } from '@/components/mentor/DatePickerModal';
import { LearningAnalysisModal } from '@/components/mentor/LearningAnalysisModal';
import { ProfileEditModal } from '@/components/mentor/ProfileEditModal';
import { ScheduleAddModal } from '@/components/mentor/ScheduleAddModal';
import { ScheduleCalendar, type ScheduleItem } from '@/components/mentor/ScheduleCalendar';
import { Button } from '@/components/ui/Button';
import { UserIcon } from '@/components/icons';
import { useMentee } from '@/hooks/useMentee';
import {
  useFeedbackItems,
  useIncompleteAssignments,
  useMenteeKpi,
  useMenteeTasks,
  useTodayComment,
} from '@/hooks/useMenteeDetail';
import { SUBJECTS } from '@/data/menteeDetailMock';
import type {
  AssignmentDetail,
  FeedbackItem,
  IncompleteAssignment,
  MenteeSummary,
  MenteeTask,
} from '@/types';

/** "2025.02.02 오전 10:45" → "2025-02-02" */
function parseDateFromStr(str: string): string | null {
  const match = str.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/);
  if (!match) return null;
  const [, y, m, d] = match;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // 월요일 시작
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (x: Date) => x.toISOString().split('T')[0];
  return { start: fmt(mon), end: fmt(sun) };
}

function getMonthRange(dateStr: string): { start: string; end: string } {
  const [y, m] = dateStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    start: `${y}-${String(m).padStart(2, '0')}-01`,
    end: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

function isDateInRange(dateStr: string | null, start: string, end: string): boolean {
  if (!dateStr) return false;
  return dateStr >= start && dateStr <= end;
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-');
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  return `${y}년 ${parseInt(m, 10)}월 ${parseInt(d, 10)}일 ${weekdays[date.getDay()]}`;
}

/** 더미데이터(2025-02)와 맞춤 - 기능 확인용 */
const DEMO_REF_DATE = '2025-02-04';

function getAllScoresAverage(mentee: MenteeSummary): number | null {
  const s = mentee.scores;
  if (!s) return null;
  const vals: number[] = [];
  [s.naesin, s.mockExam].forEach((sub) => {
    if (sub) [sub.korean, sub.english, sub.math].forEach((v) => v != null && vals.push(v));
  });
  if (vals.length === 0) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function MenteeDetailPage() {
  const { menteeId } = useParams<{ menteeId: string }>();

  const { data: mentee = null, isLoading: isMenteeLoading } = useMentee(menteeId);
  const { data: kpi = null } = useMenteeKpi(menteeId);
  const { data: serverTasks = [] } = useMenteeTasks(menteeId);
  const { data: serverFeedbackItems = [] } = useFeedbackItems(menteeId);
  const { data: serverIncomplete = [] } = useIncompleteAssignments(menteeId);
  const { data: todayCommentData = null } = useTodayComment(menteeId);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [selectedDate, setSelectedDate] = useState(DEMO_REF_DATE);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [feedbackSubjectFilter, setFeedbackSubjectFilter] = useState<string>('전체');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [incompleteAssignments, setIncompleteAssignments] = useState<IncompleteAssignment[]>([]);
  useEffect(() => {
    setIncompleteAssignments(serverIncomplete);
  }, [serverIncomplete]);
  const [feedbackItemsState, setFeedbackItemsState] = useState<FeedbackItem[]>([]);
  const [scheduleAddModalOpen, setScheduleAddModalOpen] = useState(false);
  const [assignmentDetailModalOpen, setAssignmentDetailModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
  const [selectedAssignmentSource, setSelectedAssignmentSource] = useState<'feedback' | 'incomplete'>('feedback');
  const [selectedFeedbackStatus, setSelectedFeedbackStatus] = useState<
    'urgent' | 'pending' | 'partial' | 'completed' | null
  >(null);
  const [selectedAssignmentFallback, setSelectedAssignmentFallback] = useState<{
    title: string;
    goal?: string;
    subject?: string;
  } | null>(null);
  const [learningAnalysisModalOpen, setLearningAnalysisModalOpen] = useState(false);
  const [profileEditModalOpen, setProfileEditModalOpen] = useState(false);
  const [menteeOverride, setMenteeOverride] = useState<MenteeSummary | null>(null);
  const [chatContext, setChatContext] = useState<string | null>(null);
  const [tasksState, setTasksState] = useState<MenteeTask[]>([]);

  const displayMentee = (menteeOverride ?? mentee)!;

  const allTasks = useMemo(
    () => [...serverTasks.filter((t) => t.menteeId === menteeId), ...tasksState.filter((t) => t.menteeId === menteeId)],
    [menteeId, serverTasks, tasksState]
  );

  const scheduleItems: ScheduleItem[] = useMemo(() => {
    return allTasks.map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      date: t.date,
      status: t.completed ? ('completed' as const) : ('default' as const),
    }));
  }, [allTasks]);

  const dateTasks = useMemo(
    () => allTasks.filter((t) => t.date === selectedDate),
    [allTasks, selectedDate]
  );

  const handleAddSchedule = (data: { title: string; subject: string; date: string }) => {
    if (!menteeId) return;
    const newTask: MenteeTask = {
      id: `t-${Date.now()}`,
      menteeId,
      date: data.date,
      title: data.title,
      subject: data.subject,
      completed: false,
    };
    setTasksState((prev) => [...prev, newTask]);
    setSelectedDate(data.date);
  };

  const dateRange = useMemo(() => {
    if (viewMode === 'today') return { start: selectedDate, end: selectedDate };
    if (viewMode === 'week') return getWeekRange(selectedDate);
    return getMonthRange(selectedDate);
  }, [viewMode, selectedDate]);

  const feedbackItems = useMemo(() => {
    const serverItems = serverFeedbackItems.filter((f) => f.menteeId === menteeId);
    const localItems = feedbackItemsState;
    const seen = new Set<string>();
    const baseItems: FeedbackItem[] = [];
    for (const f of [...localItems, ...serverItems]) {
      if (seen.has(f.assignmentId)) continue;
      seen.add(f.assignmentId);
      baseItems.push(f);
    }
    const bySubject = feedbackSubjectFilter === '전체' ? baseItems : baseItems.filter((f) => f.subject === feedbackSubjectFilter);
    return bySubject.filter((f) => {
      const dateStr = f.status === 'completed' && f.feedbackDate
        ? parseDateFromStr(f.feedbackDate)
        : parseDateFromStr(f.submittedAt);
      if (!dateStr) return true;
      return isDateInRange(dateStr, dateRange.start, dateRange.end);
    });
  }, [menteeId, feedbackSubjectFilter, feedbackItemsState, serverFeedbackItems, dateRange]);

  const filteredAndSortedAssignments = useMemo(() => {
    const onlyIncomplete = incompleteAssignments.filter((a) => a.status !== 'completed');
    const filtered = onlyIncomplete.filter((a) => {
      const dateStr = a.deadlineDate;
      if (!dateStr) return true;
      return isDateInRange(dateStr, dateRange.start, dateRange.end);
    });
    const incompleteOrder = ['deadline_soon', 'not_started', 'in_progress'];
    return [...filtered].sort((a, b) => {
      const ai = incompleteOrder.indexOf(a.status);
      const bi = incompleteOrder.indexOf(b.status);
      return ai - bi;
    });
  }, [incompleteAssignments, dateRange]);

  const pendingFeedbackCount = feedbackItems.filter((f) => f.status !== 'completed').length;
  const totalCount = filteredAndSortedAssignments.length;
  const todayComment = todayCommentData;
  const highlightDates = useMemo(
    () => [...new Set(allTasks.map((t) => t.date))],
    [allTasks]
  );

  const handlePrevDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDate = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleViewMode = (mode: 'today' | 'week' | 'month') => {
    setViewMode(mode);
    if (mode === 'today') setSelectedDate(todayStr);
  };

  const handleAssignmentComplete = (assignmentId: string) => {
    const assignment = incompleteAssignments.find((a) => a.id === assignmentId);
    if (!assignment || menteeId == null) return;

    const completedDate = selectedDate;
    setIncompleteAssignments((prev) => prev.filter((a) => a.id !== assignmentId));

    const datePart = `${completedDate.replace(/-/g, '.')}`;
    const newFeedbackItem: FeedbackItem = {
      id: `fb-${assignmentId}-${Date.now()}`,
      assignmentId,
      menteeId,
      title: assignment.title,
      subject: assignment.subject,
      submittedAt: `${datePart} 방금`,
      status: 'pending',
    };
    setFeedbackItemsState((prev) => [...prev, newFeedbackItem]);
  };

  const handleAssignmentDelete = (id: string) => {
    setIncompleteAssignments((prev) => prev.filter((a) => a.id !== id));
    setShowDeleteConfirm(null);
  };

  const [assignmentDetailOverrides, setAssignmentDetailOverrides] = useState<
    Record<string, Partial<AssignmentDetail>>
  >({});

  const openAssignmentDetail = (
    assignmentId: string,
    fallback?: { title: string; goal?: string; subject?: string },
    source: 'feedback' | 'incomplete' = 'feedback',
    feedbackStatus?: 'urgent' | 'pending' | 'partial' | 'completed'
  ) => {
    setSelectedAssignmentId(assignmentId);
    setSelectedAssignmentFallback(fallback ?? null);
    setSelectedAssignmentSource(source);
    setSelectedFeedbackStatus(feedbackStatus ?? null);
    setAssignmentDetailModalOpen(true);
  };

  const handleSaveAssignmentDetail = (
    id: string,
    data: Partial<AssignmentDetail>,
    source: 'feedback' | 'incomplete'
  ) => {
    setAssignmentDetailOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...data } }));
    if (source === 'incomplete' && (data.title != null || data.goal != null)) {
      setIncompleteAssignments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...(data.title != null && { title: data.title }),
                ...(data.goal != null && { description: data.goal }),
              }
            : a
        )
      );
    }
  };

  if (isMenteeLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  if (!mentee) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-slate-500">멘티를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const [calYear, calMonth] = selectedDate.split('-').map(Number);

  return (
    <div className="space-y-6">
      {/* 프로필 + KPI */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 sm:h-14 sm:w-14">
              <UserIcon className="h-7 w-7 text-slate-500" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-base font-bold text-slate-900 sm:text-lg">{displayMentee.name}</span>
                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                  {displayMentee.grade} · {displayMentee.track}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  활동 중
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  멘토링 시작: {displayMentee.mentoringStart}
                </span>
                <span className="flex items-center gap-1">
                  마지막 접속: {displayMentee.lastActive}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLearningAnalysisModalOpen(true)}
            >
              <BarChart3 className="h-4 w-4" />
              학습 분석
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setChatContext(null);
                setChatModalOpen(true);
              }}
            >
              <MessageCircle className="h-4 w-4" />
              메시지 보내기
            </Button>
            <Button size="sm" onClick={() => setProfileEditModalOpen(true)}>
              <User className="h-4 w-4" />
              프로필 수정
            </Button>
          </div>
        </div>

        {(displayMentee.scores || kpi) && (
          <div className="mt-6 space-y-4">
            {displayMentee.scores && (
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                <p className="mb-2 text-xs font-medium text-slate-600">성적</p>
                <div className="flex flex-wrap gap-4">
                  {displayMentee.scores.naesin && (
                    <div>
                      <span className="text-xs text-slate-500">내신</span>
                      <p className="text-sm font-medium text-slate-800">
                        국 {displayMentee.scores.naesin.korean ?? '-'} · 영{' '}
                        {displayMentee.scores.naesin.english ?? '-'} · 수{' '}
                        {displayMentee.scores.naesin.math ?? '-'}
                      </p>
                    </div>
                  )}
                  {displayMentee.scores.mockExam && (
                    <div>
                      <span className="text-xs text-slate-500">모의고사</span>
                      <p className="text-sm font-medium text-slate-800">
                        국 {displayMentee.scores.mockExam.korean ?? '-'} · 영{' '}
                        {displayMentee.scores.mockExam.english ?? '-'} · 수{' '}
                        {displayMentee.scores.mockExam.math ?? '-'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            {kpi && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                <KpiCard
                  title="총 학습 시간"
                  value={`${kpi.totalStudyHours}h`}
                  change={kpi.studyHoursChange}
                />
                <KpiCard
                  title="과제 완료율"
                  value={`${kpi.assignmentCompletionRate}%`}
                  change={kpi.completionRateChange}
                />
                <KpiCard
                  title="평균 성적"
                  value={String(getAllScoresAverage(displayMentee) ?? kpi.averageScore)}
                  change={kpi.scoreChange}
                  noChangeLabel="변동 없음"
                />
                <KpiCard
                  title="출석률"
                  value={`${kpi.attendanceRate}%`}
                  change={kpi.attendanceChange}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 날짜 네비게이션 */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevDate}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-0 flex-1 text-sm font-medium text-slate-900 sm:min-w-[200px] sm:flex-none">
            {formatDisplayDate(selectedDate)}
          </span>
          <button
            type="button"
            onClick={handleNextDate}
            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className="ml-2 flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4" />
            날짜 선택
          </button>
        </div>
        <div className="flex gap-2" role="group" aria-label="보기 모드">
          <button
            type="button"
            onClick={() => handleViewMode('today')}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${viewMode === 'today' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            오늘
          </button>
          <button
            type="button"
            onClick={() => handleViewMode('week')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${viewMode === 'week' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Calendar className="h-4 w-4" />
            주간 보기
          </button>
          <button
            type="button"
            onClick={() => handleViewMode('month')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors ${viewMode === 'month' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            <Calendar className="h-4 w-4" />
            월간 보기
          </button>
        </div>
      </div>

      {/* 과목 필터 (상단) */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFeedbackSubjectFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm ${feedbackSubjectFilter === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 2x2 그리드 - 이미지 배치: 좌상 피드백, 우상 미완료, 좌하 자율학습, 우하 한마디 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 좌상: 피드백 대시보드 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Pencil className="h-4 w-4" />
              피드백 대시보드
            </h3>
            <span className="text-xs text-slate-500">{pendingFeedbackCount}개 작성 필요</span>
          </div>
          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {feedbackItems.map((item) => (
              <FeedbackCard
                key={item.id}
                item={item}
                menteeId={menteeId!}
                onViewAssignment={() =>
                  openAssignmentDetail(
                    item.assignmentId,
                    { title: item.title, subject: item.subject },
                    'feedback',
                    item.status
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* 우상: 미완료 과제 */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileText className="h-4 w-4" />
              미완료 과제
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">총 {totalCount}개</span>
              <Link to={`/mentor/mentees/${menteeId}/assignments/new`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                  과제 추가
                </Button>
              </Link>
            </div>
          </div>
          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {filteredAndSortedAssignments.map((a) => (
              <IncompleteAssignmentCard
                key={a.id}
                assignment={a}
                onComplete={() => handleAssignmentComplete(a.id)}
                onDelete={() => setShowDeleteConfirm(a.id)}
                showDeleteConfirm={showDeleteConfirm === a.id}
                onConfirmDelete={() => handleAssignmentDelete(a.id)}
                onCancelDelete={() => setShowDeleteConfirm(null)}
                onViewAssignment={() =>
                  openAssignmentDetail(
                    a.id,
                    { title: a.title, goal: a.description, subject: a.subject },
                    'incomplete'
                  )
                }
              />
            ))}
          </div>
        </div>

        {/* 좌하: 자율 학습 To-Do */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ListChecks className="h-4 w-4" />
              자율 학습 To-Do
            </h3>
            <span className="text-xs text-slate-500">
              완료: {dateTasks.filter((t) => t.completed).length}/{dateTasks.length}
            </span>
          </div>
          <div className="max-h-[360px] space-y-2 overflow-y-auto">
            {dateTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">해당 날짜에 할 일이 없습니다.</p>
            ) : (
              dateTasks.map((task) => <TaskItem key={task.id} task={task} />)
            )}
          </div>
        </div>

        {/* 우하: 오늘의 한마디 & 질문 */}
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
            <MessageCircle className="h-4 w-4" />
            오늘의 한마디 & 질문
          </h3>
          {todayComment ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
                  <UserIcon className="h-5 w-5 text-slate-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">{todayComment.authorName}</span>
                    <span className="text-xs text-slate-500">{todayComment.createdAt}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{todayComment.content}</p>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setChatContext(todayComment?.content ?? null);
                  setChatModalOpen(true);
                }}
              >
                답변하기
              </Button>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">등록된 질문이 없습니다.</p>
          )}
        </div>
      </div>

      {/* 학습 일정 캘린더 (하단) */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Calendar className="h-4 w-4" />
            학습 일정 캘린더
          </h3>
          <Button size="sm" variant="outline" onClick={() => setScheduleAddModalOpen(true)}>
            <Plus className="h-4 w-4" />
            일정 추가
          </Button>
        </div>
        <ScheduleCalendar
          year={calYear}
          month={calMonth}
          selectedDate={selectedDate}
          scheduleItems={scheduleItems}
          onDateSelect={setSelectedDate}
          onMonthChange={(y, m) => {
            setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
          }}
        />
      </div>

      <ScheduleAddModal
        isOpen={scheduleAddModalOpen}
        onClose={() => setScheduleAddModalOpen(false)}
        defaultDate={selectedDate}
        onSubmit={handleAddSchedule}
      />

      <LearningAnalysisModal
        isOpen={learningAnalysisModalOpen}
        onClose={() => setLearningAnalysisModalOpen(false)}
        menteeId={menteeId ?? ''}
        menteeName={mentee?.name ?? ''}
      />

      <DatePickerModal
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        selectedDate={selectedDate}
        highlightDates={highlightDates}
        onDateSelect={setSelectedDate}
      />

      <ChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        menteeName={displayMentee.name}
        initialContext={chatContext ?? undefined}
      />

      <ProfileEditModal
        isOpen={profileEditModalOpen}
        onClose={() => setProfileEditModalOpen(false)}
        mentee={displayMentee}
        onSave={(data) =>
          setMenteeOverride((prev) =>
            prev ? { ...prev, ...data } : displayMentee ? { ...displayMentee, ...data } : null
          )
        }
      />

      <AssignmentDetailModal
        isOpen={assignmentDetailModalOpen}
        onClose={() => {
          setAssignmentDetailModalOpen(false);
          setSelectedAssignmentId(null);
          setSelectedAssignmentFallback(null);
          setSelectedFeedbackStatus(null);
        }}
        assignmentId={selectedAssignmentId ?? ''}
        source={selectedAssignmentSource}
        feedbackStatus={selectedFeedbackStatus}
        menteeId={menteeId ?? undefined}
        fallback={selectedAssignmentFallback ?? undefined}
        overrides={
          selectedAssignmentSource === 'incomplete'
            ? assignmentDetailOverrides[selectedAssignmentId ?? '']
            : undefined
        }
        onSave={
          selectedAssignmentSource === 'incomplete'
            ? (data: Partial<AssignmentDetail>) =>
                selectedAssignmentId &&
                handleSaveAssignmentDetail(selectedAssignmentId, data, 'incomplete')
            : undefined
        }
      />
    </div>
  );
}

function KpiCard({
  title,
  value,
  change,
  noChangeLabel,
}: {
  title: string;
  value: string;
  change: number;
  noChangeLabel?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">
        {change > 0 && `↑ ${change}% 증가`}
        {change < 0 && `↓ ${Math.abs(change)}% 감소`}
        {change === 0 && (noChangeLabel ?? '변동 없음')}
      </p>
    </div>
  );
}

function TaskItem({ task }: { task: MenteeTask }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-5 w-5 items-center justify-center rounded border ${
            task.completed ? 'border-slate-600 bg-slate-600 text-white' : 'border-slate-300'
          }`}
        >
          {task.completed && <Check className="h-3 w-3" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{task.title}</p>
          {task.completed && task.completedAt && (
            <p className="text-xs text-slate-500">{task.completedAt} 완료</p>
          )}
          {!task.completed && task.estimatedMinutes && (
            <p className="text-xs text-slate-500">소요시간: {task.estimatedMinutes}분</p>
          )}
        </div>
      </div>
      <span className="rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{task.subject}</span>
    </div>
  );
}

function FeedbackCard({
  item,
  menteeId,
  onViewAssignment,
}: {
  item: FeedbackItem;
  menteeId: string;
  onViewAssignment: () => void;
}) {
  const statusLabels = { urgent: '긴급', pending: '대기중', partial: '부분완료', completed: '완료' };

  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-lg border border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
      onClick={onViewAssignment}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewAssignment();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900">{item.title}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs ${
                item.status === 'urgent' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {statusLabels[item.status]}
            </span>
            {item.status === 'partial' && (
              <span className="text-xs text-slate-500">검토 필요</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {item.status === 'completed' && item.feedbackDate
              ? `피드백 작성일: ${item.feedbackDate}`
              : `제출일시: ${item.submittedAt}`}
            {' · '}
            {item.subject}
          </p>
          {item.status === 'partial' && item.progress != null && (
            <p className="text-xs text-slate-500">진행률: {item.progress}% · 마지막 업데이트: {item.lastUpdate}</p>
          )}
          {item.status === 'completed' && item.feedbackText && (
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">{item.feedbackText}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {item.status !== 'completed' ? (
          <>
            <Link to={`/mentor/mentees/${menteeId}/feedback/${item.assignmentId}`}>
              <Button size="sm">피드백 작성하기</Button>
            </Link>
            <Button size="sm" variant="outline" onClick={onViewAssignment}>
              ● 과제 보기
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={onViewAssignment}>
              ● 과제 보기
            </Button>
            <Link to={`/mentor/mentees/${menteeId}/feedback/${item.assignmentId}`}>
              <Button size="sm" variant="outline">전체 피드백 보기</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function IncompleteAssignmentCard({
  assignment,
  onComplete,
  onDelete,
  onViewAssignment,
  showDeleteConfirm,
  onConfirmDelete,
  onCancelDelete,
}: {
  assignment: IncompleteAssignment;
  onComplete: () => void;
  onDelete: () => void;
  onViewAssignment: () => void;
  showDeleteConfirm: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const isCompleted = assignment.status === 'completed';

  return (
    <div
      role="button"
      tabIndex={0}
      className="cursor-pointer rounded-lg border border-slate-200 p-3 transition-colors hover:border-slate-300 hover:bg-slate-50/50"
      onClick={onViewAssignment}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewAssignment();
        }
      }}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isCompleted) onComplete();
          }}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
            isCompleted ? 'border-slate-600 bg-slate-600 text-white' : 'border-slate-300 hover:border-slate-500'
          }`}
        >
          {isCompleted && <Check className="h-3 w-3" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-800">{assignment.title}</p>
          {assignment.description && (
            <p className="mt-0.5 text-xs text-slate-500">{assignment.description}</p>
          )}
          <p className="mt-0.5 text-xs text-slate-500">
            {assignment.subject} · {isCompleted ? assignment.completedAt : assignment.deadline}
          </p>
        </div>
        {!isCompleted && (
          <div className="relative flex gap-1">
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="수정"
            >
              <Edit3 className="h-4 w-4" />
            </button>
            {showDeleteConfirm ? (
              <div className="absolute right-0 top-8 z-10 flex gap-1 rounded border border-slate-200 bg-white p-2 shadow-lg">
                <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onConfirmDelete(); }}>
                  삭제
                </Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onCancelDelete(); }}>
                  취소
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
