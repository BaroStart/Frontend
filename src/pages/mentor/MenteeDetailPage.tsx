import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';

import { useQueryClient } from '@tanstack/react-query';
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
  Trash2,
  User,
} from 'lucide-react';

import { UserIcon } from '@/components/icons';
import { AssignmentDetailModal } from '@/components/mentor/AssignmentDetailModal';
import { ChatModal } from '@/components/mentor/ChatModal';
import { FeedbackWriteModal } from '@/components/mentor/FeedbackWriteModal';
import { LearningAnalysisModal } from '@/components/mentor/LearningAnalysisModal';
import { ProfileEditModal } from '@/components/mentor/ProfileEditModal';
import { SUBJECT_TO_KEY } from '@/components/mentor/SubjectScoresChart';
import {
  type LearningTaskData,
  type PersonalScheduleData,
  ScheduleAddModal,
} from '@/components/mentor/ScheduleAddModal';
import { ScheduleCalendar, type ScheduleItem } from '@/components/mentor/ScheduleCalendar';
import { ScheduleItemContextMenu } from '@/components/mentor/ScheduleItemContextMenu';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/date-picker';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { SearchInput } from '@/components/ui/SearchInput';
import { SUBJECTS } from '@/data/menteeDetailMock';
import { useMentee } from '@/hooks/useMentee';
import {
  useFeedbackItems,
  useIncompleteAssignments,
  useMenteeKpi,
  useMenteeTasks,
  useTodayComment,
} from '@/hooks/useMenteeDetail';
import {
  formatDisplayDate,
  getMonthRange,
  getTodayDateStr,
  getWeekRange,
  isDateInRange,
  parseDateFromStr,
} from '@/lib/dateUtils';
import {
  getLearningTaskOverrides,
  getLearningTasks,
  saveLearningTaskOverrides,
  saveLearningTasks,
} from '@/lib/learningTaskStorage';
import { getPersonalSchedules, savePersonalSchedules } from '@/lib/personalScheduleStorage';
import { useAssignmentStore } from '@/stores/useAssignmentStore';
import { useAuthStore } from '@/stores/useAuthStore';
import type {
  AssignmentDetail,
  AssignmentSelection,
  FeedbackItem,
  IncompleteAssignment,
  LearningOverrides,
  LearningTaskLocal,
  MenteeSummary,
  ModalType,
  PersonalScheduleLocal,
  ScheduleState,
} from '@/types';

/* -------------------- 메인 컴포넌트 -------------------- */

export function MenteeDetailPage() {
  const { menteeId } = useParams<{ menteeId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { removeIncomplete, clearRegisteredIncomplete } = useAssignmentStore();
  const { user } = useAuthStore();

  // 서버 데이터
  const { data: mentee = null, isLoading } = useMentee(menteeId);
  const { data: kpi = null } = useMenteeKpi(menteeId);
  const { data: serverTasks = [] } = useMenteeTasks(menteeId);
  const { data: serverFeedbackItems = [] } = useFeedbackItems(menteeId);
  const { data: serverIncomplete = [] } = useIncompleteAssignments(menteeId);
  const { data: todayComment = null } = useTodayComment(menteeId);

  // 날짜/뷰 상태
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);
  const [viewMode, setViewMode] = useState<'today' | 'week' | 'month'>('today');
  const [feedbackSubjectFilter, setFeedbackSubjectFilter] = useState('전체');

  // 모달 상태 (한 번에 하나만 열림)
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [chatContext, setChatContext] = useState<string | null>(null);
  const [feedbackInitialAssignmentId, setFeedbackInitialAssignmentId] = useState<
    string | undefined
  >();

  // 과제 상세 선택 (모달에 전달할 데이터)
  const [assignmentSelection, setAssignmentSelection] = useState<AssignmentSelection>({
    id: null,
    source: 'feedback',
    feedbackStatus: null,
    fallback: null,
  });

  // 일정 관련 상태
  const [scheduleState, setScheduleState] = useState<ScheduleState>({
    searchQuery: '',
    contextMenu: null,
    draggedItem: null,
  });

  // 로컬 데이터 상태
  const [incompleteAssignments, setIncompleteAssignments] = useState<IncompleteAssignment[]>([]);
  const [feedbackItemsLocal, setFeedbackItemsLocal] = useState<FeedbackItem[]>([]);
  const [personalSchedules, setPersonalSchedules] = useState<PersonalScheduleLocal[]>([]);
  const [learningTasks, setLearningTasks] = useState<LearningTaskLocal[]>([]);
  const [learningOverrides, setLearningOverrides] = useState<LearningOverrides>({
    dateOverrides: {},
    deletedIds: [],
  });

  // 프로필
  const [menteeOverride, setMenteeOverride] = useState<MenteeSummary | null>(null);
  const displayMentee = menteeOverride ?? mentee;

  // 과제 상세 로컬 수정
  const [assignmentDetailOverrides, setAssignmentDetailOverrides] = useState<
    Record<string, Partial<AssignmentDetail>>
  >({});

  // 삭제 확인
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const registeredDate = (location.state as { registeredDate?: string } | null)?.registeredDate;
    if (registeredDate) {
      setSelectedDate(registeredDate);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  useEffect(() => {
    setIncompleteAssignments(serverIncomplete);
  }, [serverIncomplete]);

  useEffect(() => {
    if (!menteeId) {
      setPersonalSchedules([]);
      setLearningTasks([]);
      setLearningOverrides({ dateOverrides: {}, deletedIds: [] });
      return;
    }
    setPersonalSchedules(getPersonalSchedules(menteeId));
    setLearningTasks(getLearningTasks(menteeId));
    setLearningOverrides(getLearningTaskOverrides(menteeId));
  }, [menteeId]);

  // 날짜 범위 계산
  const dateRange = useMemo(() => {
    if (viewMode === 'today') return { start: selectedDate, end: selectedDate };
    if (viewMode === 'week') return getWeekRange(selectedDate);
    return getMonthRange(selectedDate);
  }, [viewMode, selectedDate]);

  // 캘린더 아이템 생성
  const scheduleItems: ScheduleItem[] = useMemo(() => {
    const items: ScheduleItem[] = [];

    // 자율학습 To-Do
    const serverLearningTasks = serverTasks
      .filter((t) => t.menteeId === menteeId && !learningOverrides.deletedIds.includes(t.id))
      .map((t) => ({ ...t, date: learningOverrides.dateOverrides[t.id] ?? t.date }));

    [...serverLearningTasks, ...learningTasks].forEach((t) => {
      items.push({
        id: t.id,
        title: t.title,
        subject: t.subject,
        date: t.date,
        type: 'learning',
        status: t.completed ? 'completed' : 'default',
      });
    });

    // 개인 일정
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

    // 피드백 대시보드
    serverFeedbackItems
      .filter((f) => f.menteeId === menteeId)
      .forEach((f) => {
        const dateStr = parseDateFromStr(f.submittedAt);
        if (dateStr) {
          items.push({
            id: `fb-${f.assignmentId}`,
            title: f.title,
            subject: f.subject,
            date: dateStr,
            type: 'feedback',
            sourceId: f.assignmentId,
            status:
              f.status === 'urgent' ? 'urgent' : f.status === 'completed' ? 'completed' : 'default',
          });
        }
      });

    // 과제
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
              ? 'urgent'
              : a.status === 'completed'
                ? 'completed'
                : 'default',
        });
      }
    });

    return items;
  }, [
    menteeId,
    personalSchedules,
    learningTasks,
    learningOverrides,
    serverTasks,
    serverFeedbackItems,
    incompleteAssignments,
  ]);

  // 오늘 할 일 (자율학습 + 개인일정만)
  const todayTodoItems = useMemo(
    () =>
      scheduleItems.filter(
        (s) => s.date === getTodayDateStr() && (s.type === 'learning' || s.type === 'personal'),
      ),
    [scheduleItems],
  );

  // 피드백 아이템 (필터 + 날짜 범위)
  const feedbackItems = useMemo(() => {
    const serverItems = serverFeedbackItems.filter((f) => f.menteeId === menteeId);
    const seen = new Set<string>();
    const baseItems: FeedbackItem[] = [];

    for (const f of [...feedbackItemsLocal, ...serverItems]) {
      if (!seen.has(f.assignmentId)) {
        seen.add(f.assignmentId);
        baseItems.push(f);
      }
    }

    return baseItems
      .filter((f) => feedbackSubjectFilter === '전체' || f.subject === feedbackSubjectFilter)
      .filter((f) => {
        const dateStr =
          f.status === 'completed' && f.feedbackDate
            ? parseDateFromStr(f.feedbackDate)
            : parseDateFromStr(f.submittedAt);
        return !dateStr || isDateInRange(dateStr, dateRange.start, dateRange.end);
      });
  }, [menteeId, feedbackSubjectFilter, feedbackItemsLocal, serverFeedbackItems, dateRange]);

  // 미완료 과제 (필터 + 정렬)
  const filteredAssignments = useMemo(() => {
    const incomplete = incompleteAssignments.filter((a) => a.status !== 'completed');
    const filtered = incomplete.filter(
      (a) => !a.deadlineDate || isDateInRange(a.deadlineDate, dateRange.start, dateRange.end),
    );
    const order = ['deadline_soon', 'not_started', 'in_progress'];
    return [...filtered].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  }, [incompleteAssignments, dateRange]);

  /* -------------------- 핸들러 -------------------- */

  const openModal = (type: ModalType) => setActiveModal(type);
  const closeModal = () => {
    setActiveModal(null);
    setChatContext(null);
    setFeedbackInitialAssignmentId(undefined);
    setAssignmentSelection({ id: null, source: 'feedback', feedbackStatus: null, fallback: null });
  };

  const openAssignmentDetail = (
    id: string,
    fallback?: { title: string; goal?: string; subject?: string },
    source: 'feedback' | 'incomplete' = 'feedback',
    feedbackStatus?: FeedbackItem['status'],
  ) => {
    setAssignmentSelection({
      id,
      source,
      feedbackStatus: feedbackStatus ?? null,
      fallback: fallback ?? null,
    });
    openModal('assignmentDetail');
  };

  const openFeedbackModal = (assignmentId?: string) => {
    setFeedbackInitialAssignmentId(assignmentId);
    openModal('feedback');
  };

  const openChatModal = (context?: string) => {
    setChatContext(context ?? null);
    openModal('chat');
  };

  // 날짜 네비게이션
  const handleDateNav = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleViewMode = (mode: 'today' | 'week' | 'month') => {
    setViewMode(mode);
    if (mode === 'today') setSelectedDate(getTodayDateStr());
  };

  // 일정 저장 헬퍼
  const persistPersonalSchedules = (schedules: typeof personalSchedules) => {
    if (menteeId)
      savePersonalSchedules(
        menteeId,
        schedules.map((p) => ({ ...p, menteeId })),
      );
  };

  const persistLearningTasks = (tasks: typeof learningTasks) => {
    if (menteeId)
      saveLearningTasks(
        menteeId,
        tasks.map((t) => ({ ...t, menteeId })),
      );
  };

  // 일정 추가
  const handleAddPersonalSchedule = (data: PersonalScheduleData) => {
    if (!menteeId) return;
    const next = [
      ...personalSchedules,
      { id: `ps-${Date.now()}`, title: data.title, eventType: data.eventType, date: data.date },
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

  // 일정 이동/복사/삭제
  const handleScheduleMove = (itemId: string, newDate: string, skipDateSelect?: boolean) => {
    if (itemId.startsWith('ps-')) {
      const next = personalSchedules.map((p) => (p.id === itemId ? { ...p, date: newDate } : p));
      setPersonalSchedules(next);
      persistPersonalSchedules(next);
    } else {
      const localTask = learningTasks.find((x) => x.id === itemId);
      if (localTask) {
        const next = learningTasks.map((t) => (t.id === itemId ? { ...t, date: newDate } : t));
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
      if (p) {
        const next = [...personalSchedules, { ...p, id: `ps-${Date.now()}`, date: newDate }];
        setPersonalSchedules(next);
        persistPersonalSchedules(next);
      }
    } else {
      const src =
        learningTasks.find((x) => x.id === itemId) ??
        serverTasks.find((t) => t.menteeId === menteeId && t.id === itemId);
      if (src) {
        const next = [
          ...learningTasks,
          {
            id: `t-${Date.now()}`,
            title: src.title,
            subject: src.subject,
            date: newDate,
            completed: false,
          },
        ];
        setLearningTasks(next);
        persistLearningTasks(next);
      }
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

  // 캘린더 아이템 클릭
  const handleScheduleItemClick = (item: ScheduleItem) => {
    if (item.type === 'feedback' && item.sourceId && menteeId) {
      navigate(`/mentor/mentees/${menteeId}/feedback/${item.sourceId}`);
    } else if (item.type === 'assignment' && item.sourceId) {
      const a = incompleteAssignments.find((x) => x.id === item.sourceId);
      openAssignmentDetail(
        item.sourceId,
        a ? { title: a.title, goal: a.description, subject: a.subject } : undefined,
        'incomplete',
      );
    }
  };

  const handleScheduleItemRightClick = (e: React.MouseEvent, item: ScheduleItem) => {
    e.preventDefault();
    if (item.type === 'personal' || item.type === 'learning') {
      setScheduleState((prev) => ({
        ...prev,
        contextMenu: { item, position: { x: e.clientX, y: e.clientY } },
      }));
    }
  };

  // 과제 완료/삭제
  const handleAssignmentComplete = async (assignmentId: string) => {
    const assignment = incompleteAssignments.find((a) => a.id === assignmentId);
    if (!assignment || !menteeId) return;

    removeIncomplete(assignmentId);
    await queryClient.invalidateQueries({ queryKey: ['incompleteAssignments', menteeId] });

    const datePart = selectedDate.replace(/-/g, '.');
    setFeedbackItemsLocal((prev) => [
      ...prev,
      {
        id: `fb-${assignmentId}-${Date.now()}`,
        assignmentId,
        menteeId,
        title: assignment.title,
        subject: assignment.subject,
        submittedAt: `${datePart} 방금`,
        status: 'pending',
      },
    ]);
  };

  const handleAssignmentDelete = async (id: string) => {
    removeIncomplete(id);
    setDeleteConfirmId(null);
    await queryClient.invalidateQueries({ queryKey: ['incompleteAssignments', menteeId] });
  };

  // 과제 상세 저장
  const handleSaveAssignmentDetail = (id: string, data: Partial<AssignmentDetail>) => {
    setAssignmentDetailOverrides((prev) => ({ ...prev, [id]: { ...prev[id], ...data } }));

    if (data.title != null || data.goal != null || data.content != null) {
      setIncompleteAssignments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ...(data.title != null && { title: data.title }),
                ...(data.goal != null && { description: data.goal }),
                ...(data.content != null && { content: data.content }),
              }
            : a,
        ),
      );

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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!mentee || !displayMentee) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">멘티를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const [calYear, calMonth] = selectedDate.split('-').map(Number);
  const pendingFeedbackCount = feedbackItems.filter((f) => f.status !== 'completed').length;

  return (
    <div className="space-y-6">
      {/* 프로필 + KPI */}
      <ProfileSection
        mentee={displayMentee}
        kpi={kpi}
        mentorSubject={
          user?.role === 'mentor' ? (user.subject ?? '국어') : undefined
        }
        onOpenAnalysis={() => openModal('learningAnalysis')}
        onOpenProfile={() => openModal('profileEdit')}
      />

      {/* 날짜 네비게이션 */}
      <DateNavigation
        selectedDate={selectedDate}
        viewMode={viewMode}
        onDateChange={setSelectedDate}
        onPrev={() => handleDateNav(-1)}
        onNext={() => handleDateNav(1)}
        onViewModeChange={handleViewMode}
      />

      {/* 과목 필터 */}
      <div className="ml-6 flex flex-wrap gap-2">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFeedbackSubjectFilter(s)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${feedbackSubjectFilter === s ? 'bg-slate-900 text-white shadow-sm' : 'bg-secondary text-foreground/60 hover:bg-secondary/80 hover:text-foreground/80'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* 2x2 그리드 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* 피드백 대시보드 */}
        <GridCard
          title="피드백 대시보드"
          icon={<Pencil className="h-4 w-4" />}
          badge={`${pendingFeedbackCount}개 작성 필요`}
        >
          {feedbackItems.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onViewAssignment={() =>
                openAssignmentDetail(
                  item.assignmentId,
                  { title: item.title, subject: item.subject },
                  'feedback',
                  item.status,
                )
              }
              onFeedbackClick={() => openFeedbackModal(item.assignmentId)}
            />
          ))}
        </GridCard>

        {/* 미완료 과제 */}
        <GridCard
          title="미완료 과제"
          icon={<FileText className="h-4 w-4" />}
          badge={`총 ${filteredAssignments.length}개`}
          actions={
            <>
              <Button
                size="sm"
                variant="outline"
                icon={RotateCcw}
                onClick={async () => {
                  if (window.confirm('등록한 과제를 모두 초기화할까요?')) {
                    clearRegisteredIncomplete(menteeId ?? undefined);
                    await queryClient.invalidateQueries({
                      queryKey: ['incompleteAssignments', menteeId],
                    });
                  }
                }}
                title="초기화"
              >
                초기화
              </Button>
              <Link to={`/mentor/mentees/${menteeId}/assignments/new`}>
                <Button size="sm" variant="outline" icon={Plus}>
                  과제 추가
                </Button>
              </Link>
            </>
          }
        >
          {filteredAssignments.map((a) => (
            <IncompleteAssignmentCard
              key={a.id}
              assignment={a}
              onComplete={() => handleAssignmentComplete(a.id)}
              onDelete={() => setDeleteConfirmId(a.id)}
              showDeleteConfirm={deleteConfirmId === a.id}
              onConfirmDelete={() => handleAssignmentDelete(a.id)}
              onCancelDelete={() => setDeleteConfirmId(null)}
              onViewAssignment={() =>
                openAssignmentDetail(
                  a.id,
                  { title: a.title, goal: a.description, subject: a.subject },
                  'incomplete',
                )
              }
            />
          ))}
        </GridCard>

        {/* 자율 학습 To-Do */}
        <GridCard
          title="자율 학습 To-Do"
          icon={<ListChecks className="h-4 w-4" />}
          badge={`완료: ${todayTodoItems.filter((i) => i.type === 'learning' && i.status === 'completed').length}/${todayTodoItems.filter((i) => i.type === 'learning').length}`}
        >
          {todayTodoItems.length === 0 ? (
            <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
              오늘 할 일이 없습니다.
            </p>
          ) : (
            todayTodoItems.map((item) => (
              <ScheduleItemCard
                key={item.id}
                item={item}
                onContextMenu={(e) => handleScheduleItemRightClick(e, item)}
                onDelete={() => handleScheduleDelete(item.id)}
              />
            ))
          )}
        </GridCard>

        {/* 오늘의 한마디 */}
        <GridCard title="오늘의 한마디 & 질문" icon={<MessageCircle className="h-4 w-4" />}>
          {todayComment ? (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                  <UserIcon className="h-5 w-5 text-brand" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-foreground">{todayComment.authorName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {todayComment.createdAt}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground/70">{todayComment.content}</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => openChatModal(todayComment.content)}>
                답변하기
              </Button>
            </div>
          ) : (
            <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-muted-foreground">
              등록된 질문이 없습니다.
            </p>
          )}
        </GridCard>
      </div>

      {/* 캘린더 */}
      <CalendarSection
        year={calYear}
        month={calMonth}
        selectedDate={selectedDate}
        scheduleItems={scheduleItems}
        scheduleState={scheduleState}
        onDateSelect={setSelectedDate}
        onMonthChange={(y, m) => setSelectedDate(`${y}-${String(m).padStart(2, '0')}-01`)}
        onItemClick={handleScheduleItemClick}
        onItemRightClick={handleScheduleItemRightClick}
        onItemDelete={handleScheduleDelete}
        onScheduleStateChange={setScheduleState}
        onScheduleMove={handleScheduleMove}
        onScheduleCopy={handleScheduleCopy}
        onAddClick={() => openModal('scheduleAdd')}
      />

      {/* 모달들 */}
      <ScheduleAddModal
        isOpen={activeModal === 'scheduleAdd'}
        onClose={closeModal}
        defaultDate={selectedDate}
        mode="learning"
        onSubmitPersonal={handleAddPersonalSchedule}
        onSubmitLearning={handleAddLearningTask}
      />

      <LearningAnalysisModal
        isOpen={activeModal === 'learningAnalysis'}
        onClose={closeModal}
        menteeId={menteeId ?? ''}
        menteeName={mentee.name}
      />

      <ChatModal
        isOpen={activeModal === 'chat'}
        onClose={closeModal}
        menteeName={displayMentee.name}
        initialContext={chatContext ?? undefined}
      />

      <ProfileEditModal
        isOpen={activeModal === 'profileEdit'}
        onClose={closeModal}
        mentee={displayMentee}
        mentorSubject={
          user?.role === 'mentor' ? (user.subject ?? '국어') : '국어'
        }
        onSave={(data) =>
          setMenteeOverride((prev) => (prev ? { ...prev, ...data } : { ...displayMentee, ...data }))
        }
      />

      <FeedbackWriteModal
        isOpen={activeModal === 'feedback'}
        onClose={closeModal}
        initialMenteeId={menteeId}
        initialAssignmentId={feedbackInitialAssignmentId}
      />

      <AssignmentDetailModal
        isOpen={activeModal === 'assignmentDetail'}
        onClose={closeModal}
        assignmentId={assignmentSelection.id ?? ''}
        source={assignmentSelection.source}
        feedbackStatus={assignmentSelection.feedbackStatus}
        menteeId={menteeId ?? undefined}
        fallback={assignmentSelection.fallback ?? undefined}
        overrides={
          assignmentSelection.source === 'incomplete'
            ? assignmentDetailOverrides[assignmentSelection.id ?? '']
            : undefined
        }
        onSave={
          assignmentSelection.source === 'incomplete'
            ? (data) =>
                assignmentSelection.id && handleSaveAssignmentDetail(assignmentSelection.id, data)
            : undefined
        }
      />
    </div>
  );
}

/* -------------------- 서브 컴포넌트 -------------------- */

function ProfileSection({
  mentee,
  kpi,
  mentorSubject,
  onOpenAnalysis,
  onOpenProfile,
}: {
  mentee: MenteeSummary;
  kpi: {
    totalStudyHours: number;
    studyHoursChange: number;
    assignmentCompletionRate: number;
    completionRateChange: number;
    averageScore: number;
    scoreChange: number;
    attendanceRate: number;
    attendanceChange: number;
  } | null;
  mentorSubject?: '국어' | '영어' | '수학';
  onOpenAnalysis: () => void;
  onOpenProfile: () => void;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3 sm:gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary sm:h-14 sm:w-14">
            <UserIcon className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-base font-bold text-foreground sm:text-lg">{mentee.name}</span>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-foreground/70">
                {mentee.grade} · {mentee.track}
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">
                활동 중
              </span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                멘토링 시작: {mentee.mentoringStart}
              </span>
              <span className="flex items-center gap-1">마지막 접속: {mentee.lastActive}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" icon={BarChart3} onClick={onOpenAnalysis}>
            학습 분석
          </Button>
          <Button size="sm" icon={User} onClick={onOpenProfile}>
            프로필 수정
          </Button>
        </div>
      </div>

      {(mentee.scores || kpi) && (
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {kpi && (
              <>
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
              </>
            )}
            {mentee.scores &&
              mentorSubject &&
              (() => {
                const sk = SUBJECT_TO_KEY[mentorSubject];
                const n = mentee.scores!.naesin?.[sk];
                const vals =
                  n && typeof n === 'object'
                    ? (['midterm1', 'final1', 'midterm2', 'final2'] as const)
                        .map((k) => n[k])
                        .filter((v): v is number => typeof v === 'number')
                    : [];
                if (vals.length === 0) return null;
                const avg =
                  vals.reduce((a, b) => a + b, 0) / vals.length;
                const change =
                  vals.length >= 2 ? vals[vals.length - 1] - vals[0] : 0;
                return (
                  <KpiCard
                    title="평균 성적"
                    value={`${avg % 1 === 0 ? avg : avg.toFixed(1)}`}
                    change={change}
                    unit="점"
                  />
                );
              })()}
          </div>
        </div>
      )}
    </div>
  );
}

function DateNavigation({
  selectedDate,
  viewMode,
  onDateChange,
  onPrev,
  onNext,
  onViewModeChange,
}: {
  selectedDate: string;
  viewMode: 'today' | 'week' | 'month';
  onDateChange: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onViewModeChange: (mode: 'today' | 'week' | 'month') => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-white px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:px-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-0 flex-1 text-sm font-medium text-foreground sm:min-w-[200px] sm:flex-none">
          {formatDisplayDate(selectedDate)}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="rounded p-1.5 text-muted-foreground hover:bg-secondary"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <DatePicker
          value={selectedDate}
          onChange={onDateChange}
          placeholder="날짜 선택"
          className="ml-2"
          hideValue
        />
      </div>
      <FilterTabs
        items={[
          { id: 'today' as const, label: '오늘' },
          { id: 'week' as const, label: '주간 보기' },
          { id: 'month' as const, label: '월간 보기' },
        ]}
        value={viewMode}
        onChange={onViewModeChange}
      />
    </div>
  );
}

function GridCard({
  title,
  icon,
  badge,
  actions,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[280px] flex-col rounded-xl border border-border/50 bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-border/30 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {icon}
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-foreground/60">
              {badge}
            </span>
          )}
          {actions}
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">{children}</div>
    </div>
  );
}

function CalendarSection({
  year,
  month,
  selectedDate,
  scheduleItems,
  scheduleState,
  onDateSelect,
  onMonthChange,
  onItemClick,
  onItemRightClick,
  onItemDelete,
  onScheduleStateChange,
  onScheduleMove,
  onScheduleCopy,
  onAddClick,
}: {
  year: number;
  month: number;
  selectedDate: string;
  scheduleItems: ScheduleItem[];
  scheduleState: ScheduleState;
  onDateSelect: (date: string) => void;
  onMonthChange: (y: number, m: number) => void;
  onItemClick: (item: ScheduleItem) => void;
  onItemRightClick: (e: React.MouseEvent, item: ScheduleItem) => void;
  onItemDelete: (id: string) => void;
  onScheduleStateChange: (state: ScheduleState) => void;
  onScheduleMove: (id: string, date: string, skip?: boolean) => void;
  onScheduleCopy: (id: string, date: string, skip?: boolean) => void;
  onAddClick: () => void;
}) {
  const { searchQuery, contextMenu, draggedItem } = scheduleState;

  return (
    <div className="rounded-xl border border-border/50 bg-white">
      <div className="flex flex-col gap-3 border-b border-border/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calendar className="h-4 w-4" />
          일정 캘린더
        </h3>
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(v) => onScheduleStateChange({ ...scheduleState, searchQuery: v })}
            placeholder="할일 검색..."
            className="flex-1 sm:max-w-xs"
          />
          <Button variant="outline" icon={Plus} onClick={onAddClick}>
            일정 추가
          </Button>
        </div>
      </div>

      <div className="p-4">
      <ScheduleCalendar
        year={year}
        month={month}
        selectedDate={selectedDate}
        scheduleItems={scheduleItems}
        searchQuery={searchQuery}
        onDateSelect={onDateSelect}
        onMonthChange={onMonthChange}
        onItemClick={onItemClick}
        onItemRightClick={onItemRightClick}
        onItemDelete={onItemDelete}
        onItemDragStart={(item) => onScheduleStateChange({ ...scheduleState, draggedItem: item })}
        onItemDragEnd={() => onScheduleStateChange({ ...scheduleState, draggedItem: null })}
        onDropOnDate={
          draggedItem && (draggedItem.type === 'personal' || draggedItem.type === 'learning')
            ? (dateStr, isCopy) => {
                if (isCopy) onScheduleCopy(draggedItem.id, dateStr, true);
                else onScheduleMove(draggedItem.id, dateStr, true);
                onScheduleStateChange({ ...scheduleState, draggedItem: null });
              }
            : undefined
        }
        draggedItemId={draggedItem?.id}
      />

      {draggedItem && (
        <p className="mt-2 text-xs text-muted-foreground">
          다른 날짜에 놓으면 이동 · <kbd className="rounded border border-border px-1">Ctrl</kbd>
          +드롭하면 복사
        </p>
      )}

      {contextMenu && (
        <ScheduleItemContextMenu
          item={contextMenu.item}
          position={contextMenu.position}
          onClose={() => onScheduleStateChange({ ...scheduleState, contextMenu: null })}
          onMove={onScheduleMove}
          onCopy={onScheduleCopy}
          onDelete={onItemDelete}
        />
      )}

      {searchQuery && (
        <div className="mt-3 text-sm text-muted-foreground">
          검색 결과:{' '}
          {
            scheduleItems.filter(
              (item) =>
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.subject.toLowerCase().includes(searchQuery.toLowerCase()),
            ).length
          }
          개
        </div>
      )}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  change,
  unit = '%',
}: {
  title: string;
  value: string;
  change: number;
  unit?: string;
}) {
  const isPositive = change > 0;
  const isNegative = change < 0;
  return (
    <div className="rounded-lg border border-border/50 bg-secondary/20 p-3">
      <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
      <p
        className={`mt-0.5 text-xs font-medium ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-muted-foreground'}`}
      >
        {isPositive && `↑ ${change}${unit} 증가`}
        {isNegative && `↓ ${Math.abs(change)}${unit} 감소`}
        {change === 0 && '변동 없음'}
      </p>
    </div>
  );
}

function ScheduleItemCard({
  item,
  onContextMenu,
  onDelete,
}: {
  item: ScheduleItem;
  onContextMenu: (e: React.MouseEvent) => void;
  onDelete: () => void;
}) {
  const typeLabel =
    item.type === 'learning' ? '자율학습' : item.type === 'personal' ? '개인' : item.subject;
  const typeBg =
    item.type === 'learning'
      ? 'bg-amber-50 text-amber-700'
      : item.type === 'personal'
        ? 'bg-violet-50 text-violet-700'
        : 'bg-sky-50 text-sky-700';
  const isCompleted = item.status === 'completed';

  return (
    <div
      onContextMenu={onContextMenu}
      className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors hover:bg-secondary/30 ${isCompleted ? 'border-border/20 bg-secondary/10 opacity-60' : 'border-border/40'}`}
    >
      <div className="flex shrink-0 cursor-grab touch-none text-muted-foreground/50 hover:text-foreground/50">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`truncate text-[13px] font-medium text-foreground ${isCompleted ? 'line-through' : ''}`}>
            {item.title}
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBg}`}>
            {typeLabel}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`"${item.title}"을(를) 삭제하시겠습니까?`)) onDelete();
        }}
        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
        title="삭제"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function FeedbackCard({
  item,
  onViewAssignment,
  onFeedbackClick,
}: {
  item: FeedbackItem;
  onViewAssignment: () => void;
  onFeedbackClick: () => void;
}) {
  const statusConfig: Record<string, { label: string; bg: string }> = {
    urgent: { label: '긴급', bg: 'bg-rose-50 text-rose-700' },
    pending: { label: '대기중', bg: 'bg-amber-50 text-amber-700' },
    partial: { label: '부분완료', bg: 'bg-sky-50 text-sky-700' },
    completed: { label: '완료', bg: 'bg-emerald-50 text-emerald-700' },
  };
  const status = statusConfig[item.status] ?? statusConfig.pending;

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-secondary/20 ${item.status === 'urgent' ? 'border-rose-200 bg-rose-50/30' : 'border-border/40 hover:border-border'}`}
      onClick={onViewAssignment}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewAssignment();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-foreground">{item.title}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${status.bg}`}>
              {status.label}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {item.status === 'completed' && item.feedbackDate
              ? `피드백 작성일: ${item.feedbackDate}`
              : `제출일시: ${item.submittedAt}`}{' '}
            · {item.subject}
          </p>
          {item.status === 'completed' && item.feedbackText && (
            <p className="mt-1 line-clamp-2 text-[11px] text-foreground/60">{item.feedbackText}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
        {item.status !== 'completed' ? (
          <>
            <Button size="sm" onClick={onFeedbackClick}>
              피드백 작성하기
            </Button>
            <Button size="sm" variant="outline" onClick={onViewAssignment}>
              과제 보기
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={onViewAssignment}>
              과제 보기
            </Button>
            <Button size="sm" variant="outline" onClick={onFeedbackClick}>
              전체 피드백 보기
            </Button>
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
  const isUrgent = assignment.status === 'deadline_soon';

  return (
    <div
      role="button"
      tabIndex={0}
      className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-secondary/20 ${isUrgent ? 'border-rose-200 bg-rose-50/20' : 'border-border/40 hover:border-border'}`}
      onClick={onViewAssignment}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewAssignment();
        }
      }}
    >
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isCompleted) onComplete();
          }}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isCompleted ? 'border-foreground/70 bg-foreground/70 text-white' : 'border-border/60 hover:border-foreground/50'}`}
        >
          {isCompleted && <Check className="h-3 w-3" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-foreground">{assignment.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {assignment.subject} · {isCompleted ? assignment.completedAt : assignment.deadline}
            {isUrgent && <span className="ml-1 font-medium text-rose-600">마감 임박</span>}
          </p>
        </div>
        {!isCompleted && (
          <div className="relative flex shrink-0 gap-0.5">
            <button
              type="button"
              className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground/70"
              title="수정"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            {showDeleteConfirm ? (
              <div className="absolute right-0 top-8 z-10 flex gap-1 rounded-lg border border-border/50 bg-white p-2 shadow-lg">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmDelete();
                  }}
                >
                  삭제
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelDelete();
                  }}
                >
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
                className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
                title="삭제"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
