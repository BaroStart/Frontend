import {
  BarChart3,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileText,
  GripVertical,
  ListChecks,
  MessageCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useParams, useNavigate } from 'react-router-dom';

import { AssignmentDetailModal } from '@/components/mentor/AssignmentDetailModal';
import { ChatModal } from '@/components/mentor/ChatModal';
import { DatePickerModal } from '@/components/mentor/DatePickerModal';
import { LearningAnalysisModal } from '@/components/mentor/LearningAnalysisModal';
import { ProfileEditModal } from '@/components/mentor/ProfileEditModal';
import {
  ScheduleAddModal,
  type PersonalScheduleData,
  type LearningTaskData,
} from '@/components/mentor/ScheduleAddModal';
import { ScheduleCalendar, type ScheduleItem } from '@/components/mentor/ScheduleCalendar';
import { ScheduleItemContextMenu } from '@/components/mentor/ScheduleItemContextMenu';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserIcon } from '@/components/icons';
import { useMentee } from '@/hooks/useMentee';
import {
  useFeedbackItems,
  useIncompleteAssignments,
  useMenteeKpi,
  useMenteeTasks,
  useTodayComment,
} from '@/hooks/useMenteeDetail';
import { useAssignmentStore } from '@/stores/useAssignmentStore';
import {
  getLearningTasks,
  getLearningTaskOverrides,
  saveLearningTasks,
  saveLearningTaskOverrides,
} from '@/lib/learningTaskStorage';
import {
  getPersonalSchedules,
  savePersonalSchedules,
} from '@/lib/personalScheduleStorage';
import { SUBJECTS } from '@/data/menteeDetailMock';
import type {
  AssignmentDetail,
  FeedbackItem,
  IncompleteAssignment,
  MenteeSummary,
} from '@/types';

/** "2026.02.02 오전 10:45" → "2026-02-02" */
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

function getTodayDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

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
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const removeIncomplete = useAssignmentStore((s) => s.removeIncomplete);
  const clearRegisteredIncomplete = useAssignmentStore((s) => s.clearRegisteredIncomplete);
  const registeredDateFromState = (location.state as { registeredDate?: string } | null)?.registeredDate;

  const { data: mentee = null, isLoading: isMenteeLoading } = useMentee(menteeId);
  const { data: kpi = null } = useMenteeKpi(menteeId);
  const { data: serverTasks = [] } = useMenteeTasks(menteeId);
  const { data: serverFeedbackItems = [] } = useFeedbackItems(menteeId);
  const { data: serverIncomplete = [] } = useIncompleteAssignments(menteeId);
  const { data: todayCommentData = null } = useTodayComment(menteeId);

  const [selectedDate, setSelectedDate] = useState(() => getTodayDateStr());
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    if (registeredDateFromState) {
      setSelectedDate(registeredDateFromState);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [registeredDateFromState, navigate, location.pathname]);
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
  const [personalSchedules, setPersonalSchedules] = useState<
    { id: string; title: string; eventType: string; date: string }[]
  >([]);
  const [learningTasks, setLearningTasks] = useState<
    { id: string; title: string; subject: string; date: string; completed: boolean }[]
  >([]);
  const [learningOverrides, setLearningOverrides] = useState<{
    dateOverrides: Record<string, string>;
    deletedIds: string[];
  }>({ dateOverrides: {}, deletedIds: [] });

  useEffect(() => {
    if (menteeId) {
      setPersonalSchedules(getPersonalSchedules(menteeId));
      setLearningTasks(getLearningTasks(menteeId));
      setLearningOverrides(getLearningTaskOverrides(menteeId));
    } else {
      setPersonalSchedules([]);
      setLearningTasks([]);
      setLearningOverrides({ dateOverrides: {}, deletedIds: [] });
    }
  }, [menteeId]);

  const persistPersonalSchedules = (schedules: { id: string; title: string; eventType: string; date: string }[]) => {
    if (menteeId) {
      savePersonalSchedules(menteeId, schedules.map((p) => ({ ...p, menteeId })));
    }
  };
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [scheduleContextMenu, setScheduleContextMenu] = useState<{
    item: ScheduleItem;
    position: { x: number; y: number };
  } | null>(null);
  const [draggedCalendarItem, setDraggedCalendarItem] = useState<ScheduleItem | null>(null);

  const displayMentee = (menteeOverride ?? mentee)!;

  // 달력에 표시: 자율학습 To-Do + 개인일정 + 피드백대시보드 + 과제
  const scheduleItems: ScheduleItem[] = useMemo(() => {
    const items: ScheduleItem[] = [];
    // 1. 자율학습 To-Do (서버 + 로컬, 오버라이드 적용)
    const serverLearningTasks = serverTasks
      .filter((t) => t.menteeId === menteeId && !learningOverrides.deletedIds.includes(t.id))
      .map((t) => ({
        ...t,
        date: learningOverrides.dateOverrides[t.id] ?? t.date,
      }));
    const allLearningTasks = [...serverLearningTasks, ...learningTasks];
    allLearningTasks.forEach((t) => {
      items.push({
        id: t.id,
        title: t.title,
        subject: t.subject,
        date: t.date,
        type: 'learning',
        status: t.completed ? ('completed' as const) : ('default' as const),
      });
    });
    // 2. 개인 일정 (중간고사, 기말고사 등)
    personalSchedules
      .filter((p) => p.date)
      .forEach((p) => {
        items.push({
          id: p.id,
          title: p.title,
          subject: p.eventType,
          date: p.date,
          type: 'personal',
          status: 'default',
        });
      });
    // 3. 피드백 대시보드 (제출일 기준)
    const feedbackForMentee = serverFeedbackItems.filter((f) => f.menteeId === menteeId);
    feedbackForMentee.forEach((f) => {
      const dateStr = parseDateFromStr(f.submittedAt);
      if (dateStr) {
        items.push({
          id: `fb-${f.assignmentId}`,
          title: f.title,
          subject: f.subject,
          date: dateStr,
          type: 'feedback',
          sourceId: f.assignmentId,
          status: f.status === 'urgent' ? 'urgent' : f.status === 'completed' ? 'completed' : 'default',
        });
      }
    });
    // 4. 과제 (마감일 기준)
    incompleteAssignments.forEach((a) => {
      const dateStr = a.deadlineDate ?? a.completedAtDate;
      if (dateStr) {
        items.push({
          id: `asn-${a.id}`,
          title: a.title,
          subject: a.subject,
          date: dateStr,
          type: 'assignment',
          sourceId: a.id,
          status:
            a.status === 'deadline_soon'
              ? ('urgent' as const)
              : a.status === 'completed'
                ? ('completed' as const)
                : ('default' as const),
        });
      }
    });
    return items;
  }, [menteeId, personalSchedules, learningTasks, learningOverrides, serverTasks, serverFeedbackItems, incompleteAssignments]);

  // To-Do 카드: 항상 오늘 날짜, 학생 입력(자율학습·개인일정)만 표시 (달력 연동 없음)
  const todayTodoItems = useMemo(
    () =>
      scheduleItems.filter(
        (s) =>
          s.date === getTodayDateStr() &&
          (s.type === 'learning' || s.type === 'personal')
      ),
    [scheduleItems]
  );

  const handleAddPersonalSchedule = (data: PersonalScheduleData) => {
    if (!menteeId) return;
    const next = [
      ...personalSchedules,
      {
        id: `ps-${Date.now()}`,
        title: data.title,
        eventType: data.eventType,
        date: data.date,
      },
    ];
    setPersonalSchedules(next);
    persistPersonalSchedules(next);
    setSelectedDate(data.date);
  };

  const handleAddLearningTask = (data: LearningTaskData) => {
    if (!menteeId) return;
    const next = [
      ...learningTasks,
      {
        id: `t-${Date.now()}`,
        title: data.title,
        subject: data.subject,
        date: data.date,
        completed: false,
      },
    ];
    setLearningTasks(next);
    persistLearningTasks(next);
    setSelectedDate(data.date);
  };

  const persistLearningTasks = (tasks: { id: string; title: string; subject: string; date: string; completed: boolean }[]) => {
    if (menteeId) {
      saveLearningTasks(menteeId, tasks.map((t) => ({ ...t, menteeId })));
    }
  };

  const handleScheduleMove = (itemId: string, newDate: string, skipDateSelect?: boolean) => {
    if (itemId.startsWith('ps-')) {
      const next = personalSchedules.map((p) =>
        p.id === itemId ? { ...p, date: newDate } : p
      );
      setPersonalSchedules(next);
      persistPersonalSchedules(next);
    } else {
      // 자율학습: t- 로컬 추가분, t1/t2 등 서버 mock
      const localTask = learningTasks.find((x) => x.id === itemId);
      if (localTask) {
        const next = learningTasks.map((t) =>
          t.id === itemId ? { ...t, date: newDate } : t
        );
        setLearningTasks(next);
        persistLearningTasks(next);
      } else {
        const nextOverrides = {
          ...learningOverrides,
          dateOverrides: { ...learningOverrides.dateOverrides, [itemId]: newDate },
        };
        setLearningOverrides(nextOverrides);
        saveLearningTaskOverrides(menteeId ?? '', nextOverrides);
      }
    }
    if (!skipDateSelect) setSelectedDate(newDate);
  };

  const handleScheduleCopy = (itemId: string, newDate: string, skipDateSelect?: boolean) => {
    if (itemId.startsWith('ps-')) {
      const p = personalSchedules.find((x) => x.id === itemId);
      if (!p) return;
      const next = [...personalSchedules, { ...p, id: `ps-${Date.now()}`, date: newDate }];
      setPersonalSchedules(next);
      persistPersonalSchedules(next);
    } else {
      const localTask = learningTasks.find((x) => x.id === itemId);
      const serverTask = serverTasks.find((t) => t.menteeId === menteeId && t.id === itemId);
      const src = localTask ?? serverTask;
      if (!src) return;
      const newTask = {
        id: `t-${Date.now()}`,
        title: src.title,
        subject: src.subject,
        date: newDate,
        completed: false,
      };
      const next = [...learningTasks, newTask];
      setLearningTasks(next);
      persistLearningTasks(next);
    }
    if (!skipDateSelect) setSelectedDate(newDate);
  };

  const handleScheduleDelete = (itemId: string) => {
    if (itemId.startsWith('ps-')) {
      const next = personalSchedules.filter((p) => p.id !== itemId);
      setPersonalSchedules(next);
      persistPersonalSchedules(next);
    } else {
      const localTask = learningTasks.find((x) => x.id === itemId);
      if (localTask) {
        const next = learningTasks.filter((t) => t.id !== itemId);
        setLearningTasks(next);
        persistLearningTasks(next);
      } else {
        const nextOverrides = {
          ...learningOverrides,
          deletedIds: [...learningOverrides.deletedIds, itemId],
        };
        setLearningOverrides(nextOverrides);
        saveLearningTaskOverrides(menteeId ?? '', nextOverrides);
      }
    }
  };

  const handleScheduleItemRightClick = (e: React.MouseEvent, item: ScheduleItem) => {
    e.preventDefault();
    if (item.type !== 'personal' && item.type !== 'learning') return;
    setScheduleContextMenu({
      item,
      position: { x: e.clientX, y: e.clientY },
    });
  };

  const handleScheduleItemClick = (item: ScheduleItem) => {
    if (item.type === 'feedback' && item.sourceId && menteeId) {
      navigate(`/mentor/mentees/${menteeId}/feedback/${item.sourceId}`);
      return;
    }
    if (item.type === 'assignment' && item.sourceId && menteeId) {
      const a = incompleteAssignments.find((x) => x.id === item.sourceId);
      openAssignmentDetail(
        item.sourceId,
        a ? { title: a.title, goal: a.description, subject: a.subject } : undefined,
        'incomplete'
      );
    }
    // learning, personal: 클릭만으로는 동작 없음 (우클릭 메뉴 사용)
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
    () => [...new Set(scheduleItems.map((s) => s.date))],
    [scheduleItems]
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
    if (mode === 'today') setSelectedDate(getTodayDateStr());
  };

  const handleAssignmentComplete = async (assignmentId: string) => {
    const assignment = incompleteAssignments.find((a) => a.id === assignmentId);
    if (!assignment || menteeId == null) return;

    const completedDate = selectedDate;
    removeIncomplete(assignmentId);
    await queryClient.invalidateQueries({ queryKey: ['incompleteAssignments', menteeId] });

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

  const handleAssignmentDelete = async (id: string) => {
    removeIncomplete(id);
    setShowDeleteConfirm(null);
    await queryClient.invalidateQueries({ queryKey: ['incompleteAssignments', menteeId] });
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
    if (source === 'incomplete' && (data.title != null || data.goal != null || data.content != null)) {
      setIncompleteAssignments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...(data.title != null && { title: data.title }),
                ...(data.goal != null && { description: data.goal }),
                ...(data.content != null && { content: data.content }),
              }
            : a
        )
      );
      // registeredIncomplete도 업데이트
      const { registeredIncomplete, addIncomplete } = useAssignmentStore.getState();
      const registered = registeredIncomplete.find((a) => a.id === id);
      if (registered) {
        addIncomplete([
          {
            ...registered,
            ...(data.title != null && { title: data.title }),
            ...(data.goal != null && { description: data.goal }),
            ...(data.content != null && { content: data.content }),
          },
        ]);
      }
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
      <div className="flex flex-wrap gap-2 ml-6">
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

      {/* 2x2 그리드 - 좌상 피드백, 우상 미완료, 좌하 자율학습, 우하 한마디 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 좌상: 피드백 대시보드 */}
        <div className="flex min-h-[280px] flex-col rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Pencil className="h-4 w-4" />
              피드백 대시보드
            </h3>
            <span className="text-xs text-slate-500">{pendingFeedbackCount}개 작성 필요</span>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
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
        <div className="flex min-h-[280px] flex-col rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <FileText className="h-4 w-4" />
              미완료 과제
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">총 {totalCount}개</span>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  if (window.confirm('등록한 과제를 모두 초기화할까요? 더미 데이터는 유지됩니다.')) {
                    clearRegisteredIncomplete(menteeId ?? undefined);
                    await queryClient.invalidateQueries({ queryKey: ['incompleteAssignments', menteeId] });
                  }
                }}
                title="등록한 과제만 초기화 (더미 유지)"
              >
                <RotateCcw className="h-4 w-4" />
                초기화
              </Button>
              <Link to={`/mentor/mentees/${menteeId}/assignments/new`}>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                  과제 추가
                </Button>
              </Link>
            </div>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
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

        {/* 좌하: 자율 학습 To-Do (학생 입력만, 항상 오늘 날짜, 피드백/클릭 이동 없음) */}
        <div className="flex min-h-[280px] flex-col rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ListChecks className="h-4 w-4" />
              자율 학습 To-Do
            </h3>
            <span className="text-xs text-slate-500">
              완료: {todayTodoItems.filter((i) => i.type === 'learning' && i.status === 'completed').length}/{todayTodoItems.filter((i) => i.type === 'learning').length}
            </span>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
            {todayTodoItems.length === 0 ? (
              <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-slate-500">
                오늘 할 일이 없습니다.
              </p>
            ) : (
              todayTodoItems.map((item) => (
                <ScheduleItemCard
                  key={item.id}
                  item={item}
                  onClick={() => {}}
                  onContextMenu={(e) => handleScheduleItemRightClick(e, item)}
                  onDelete={() => handleScheduleDelete(item.id)}
                  onDragStart={undefined}
                  onDragEnd={undefined}
                  isDragging={false}
                />
              ))
            )}
          </div>
        </div>

        {/* 우하: 오늘의 한마디 & 질문 */}
        <div className="flex min-h-[280px] flex-col rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex shrink-0 items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <MessageCircle className="h-4 w-4" />
              오늘의 한마디 & 질문
            </h3>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {todayComment ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200">
                    <UserIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-900">{todayComment.authorName}</span>
                      <span className="shrink-0 text-xs text-slate-500">{todayComment.createdAt}</span>
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
              <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-slate-500">
                등록된 질문이 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 학습 일정 캘린더 (하단) */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Calendar className="h-4 w-4" />
            일정 캘린더
          </h3>
          <div className="flex items-center gap-2">
            {/* 검색 */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="할일 검색..."
                value={scheduleSearchQuery}
                onChange={(e) => setScheduleSearchQuery(e.target.value)}
                className="pl-9 pr-9"
              />
              {scheduleSearchQuery && (
                <button
                  type="button"
                  onClick={() => setScheduleSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setScheduleAddModalOpen(true)}>
              <Plus className="h-4 w-4" />
              일정 추가
            </Button>
          </div>
        </div>
        <div className="relative">
          <ScheduleCalendar
            year={calYear}
            month={calMonth}
            selectedDate={selectedDate}
            scheduleItems={scheduleItems}
            searchQuery={scheduleSearchQuery}
            onDateSelect={setSelectedDate}
            onMonthChange={(y, m) => {
              setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`);
            }}
            onItemClick={handleScheduleItemClick}
            onItemRightClick={handleScheduleItemRightClick}
            onItemDelete={handleScheduleDelete}
            onItemDragStart={(item) => setDraggedCalendarItem(item)}
            onItemDragEnd={() => setDraggedCalendarItem(null)}
            onDropOnDate={
              draggedCalendarItem && (draggedCalendarItem.type === 'personal' || draggedCalendarItem.type === 'learning')
                ? (dateStr, isCopy) => {
                    if (isCopy) {
                      handleScheduleCopy(draggedCalendarItem.id, dateStr, true);
                    } else {
                      handleScheduleMove(draggedCalendarItem.id, dateStr, true);
                    }
                    setDraggedCalendarItem(null);
                  }
                : undefined
            }
            draggedItemId={draggedCalendarItem?.id}
          />
        </div>
        {draggedCalendarItem && (
          <p className="mt-2 text-xs text-slate-500">
            다른 날짜에 놓으면 이동 · <kbd className="rounded border border-slate-300 px-1">Ctrl</kbd>+드롭하면 복사
          </p>
        )}
        {scheduleContextMenu && (
          <ScheduleItemContextMenu
            item={scheduleContextMenu.item}
            position={scheduleContextMenu.position}
            onClose={() => setScheduleContextMenu(null)}
            onMove={handleScheduleMove}
            onCopy={handleScheduleCopy}
            onDelete={handleScheduleDelete}
          />
        )}
        {scheduleSearchQuery && (
          <div className="mt-3 text-sm text-slate-500">
            검색 결과: {scheduleItems.filter((item) => item.title.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) || item.subject.toLowerCase().includes(scheduleSearchQuery.toLowerCase())).length}개
          </div>
        )}
      </div>

      <ScheduleAddModal
        isOpen={scheduleAddModalOpen}
        onClose={() => setScheduleAddModalOpen(false)}
        defaultDate={selectedDate}
        mode="learning"
        onSubmitPersonal={handleAddPersonalSchedule}
        onSubmitLearning={handleAddLearningTask}
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

function ScheduleItemCard({
  item,
  onClick,
  onContextMenu,
  onDelete,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  item: ScheduleItem;
  onClick: () => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDelete?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  const typeLabel =
    item.type === 'learning'
      ? '자율학습'
      : item.type === 'personal'
        ? '개인'
        : item.type === 'feedback'
          ? '피드백'
          : item.type === 'assignment'
            ? '과제'
            : item.subject;
  const typeBg =
    item.type === 'learning'
      ? 'bg-amber-100 text-amber-700'
      : item.type === 'personal'
        ? 'bg-violet-100 text-violet-700'
        : item.type === 'feedback'
          ? 'bg-amber-100 text-amber-700'
          : 'bg-blue-100 text-blue-700';
  const canMoveDelete = onDelete != null;

  return (
    <div
      draggable={canMoveDelete}
      onContextMenu={onContextMenu}
      onDragStart={(e) => {
        if (canMoveDelete && onDragStart) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', item.id);
          onDragStart();
        }
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`flex w-full items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2 transition-colors hover:bg-slate-100 ${
        isDragging ? 'opacity-50' : ''
      } ${canMoveDelete ? 'cursor-grab active:cursor-grabbing' : ''}`}
    >
      {canMoveDelete && (
        <div
          className="flex shrink-0 cursor-grab touch-none text-slate-400 hover:text-slate-600 active:cursor-grabbing"
          onPointerDown={(e) => e.stopPropagation()}
          aria-hidden
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <button
        type="button"
        onClick={onClick}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-sm font-medium text-slate-800">{item.title}</p>
        <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-xs ${typeBg}`}>
          {typeLabel}
        </span>
      </button>
      {canMoveDelete && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`"${item.title}"을(를) 삭제하시겠습니까?`)) {
              onDelete();
            }
          }}
          className="shrink-0 rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="삭제"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
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
