import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Calendar } from "@/components/mentee/main/Calendar";
import { AssignmentList } from "@/components/mentee/main/AssignmentList";
import type { AssignmentItem } from "@/components/mentee/main/AssignmentCard";
import { CommentModal } from "@/components/mentee/main/CommentModal";
import { TodoList } from "@/components/mentee/main/TodoList";
import { useTodoStore } from "@/stores/useTodoStore";
import { TimeTable, type TimelineItem } from "@/components/mentee/main/TimeTable";
import { API_CONFIG } from "@/api/config";
import type { TimeRangeValue } from "@/components/mentee/TimeRangeModal";
type TimeSlot = { startTime: string; endTime: string };
import { useAuthStore } from "@/stores/useAuthStore";
import { getLocalProfileImage } from "@/lib/profileImageStorage";
import { DmIcon, ListIcon, TimeIcon, UserIcon } from "@/components/icons";
import { MOCK_INCOMPLETE_ASSIGNMENTS } from "@/data/menteeDetailMock";
import { getSubmittedAssignments } from "@/lib/menteeAssignmentSubmissionStorage";
import { useCommentThread } from "@/hooks/useCommentThread";

export function MenteeMainPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  useEffect(() => {
    if (dateParam) {
      const d = new Date(dateParam);
      if (!isNaN(d.getTime())) setSelectedDate(d);
    }
  }, [dateParam]);
  const [commentOpen, setCommentOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"LIST" | "TIMETABLE">("LIST");

  const { user } = useAuthStore();
  const menteeName = user?.name ?? "멘티";

  const welcomeMessage = useMemo(() => {
    const messages = [
      "오늘도 기분 좋은 하루의 시작이 되길 바랍니다.",
      "오늘 하루도 응원해요.",
      "조금씩이라도 꾸준히, 잘하고 있어요.",
      "오늘도 할 수 있어요.",
      "작은 걸음이 큰 변화를 만들어요.",
      "오늘 하루도 함께해요.",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  const {
    todos,
    todosByDate,
    setSelectedDate: setTodoDate,
    addAtTop,
    toggleDone,
    updateTitle,
    remove,
  } = useTodoStore();

  const { thread, handleSubmit: handleCommentSubmit, handleSendReply } = useCommentThread(user);

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const dateKey = `${selectedDate.getFullYear()}-${pad2(selectedDate.getMonth() + 1)}-${pad2(selectedDate.getDate())}`;

  useEffect(() => {
    // 달력에서 날짜를 바꾸면, 해당 날짜의 할 일을 보여주도록 연결
    // setTodoDate 내부에서 loadSelectedDate 호출 (API 모드일 때 오늘인 경우)
    void setTodoDate(dateKey);
  }, [dateKey, setTodoDate]);

  const toIsoTimeSlot = (baseDate: Date, v: TimeRangeValue): TimeSlot[] => {
    const to24 = (m: "AM" | "PM", hour12: number) => {
      const h = hour12 % 12;
      return m === "PM" ? h + 12 : h;
    };
    const start = new Date(baseDate);
    start.setHours(to24(v.start.meridiem, v.start.hour), v.start.minute, 0, 0);
    const end = new Date(baseDate);
    end.setHours(to24(v.end.meridiem, v.end.hour), v.end.minute, 0, 0);
    return [{ startTime: start.toISOString(), endTime: end.toISOString() }];
  };

  const assignmentsByDate = useMemo(() => {
    // mock 멘티 계정(s1/s2)이 아니면 s1로 폴백
    const menteeId = user?.role === "mentee" && /^s\\d+$/i.test(user.id) ? user.id : "s1";
    const submittedById = user?.id ? getSubmittedAssignments(user.id) : {};

    return MOCK_INCOMPLETE_ASSIGNMENTS.filter((a) => a.menteeId === menteeId).map((a) => {
      const dateKey = a.completedAtDate ?? a.deadlineDate ?? "2026-02-02";
      const isDone = a.status === "completed" || !!submittedById[a.id];
      return {
        id: a.id,
        dateKey,
        title: a.title,
        status: isDone ? ("DONE" as const) : ("PENDING" as const),
        // 목록 카드에서 PENDING은 dueAtText를 사용
        dueAtText: isDone ? undefined : a.deadline ?? "23:59",
      } satisfies AssignmentItem & { dateKey: string };
    });
  }, [user?.id, user?.role]);

  const assignments = useMemo<AssignmentItem[]>(() => {
    return assignmentsByDate.filter((a) => a.dateKey === dateKey);
  }, [assignmentsByDate, dateKey]);

  const metaByDate = useMemo(() => {
    const meta: Record<string, { assignmentCount?: number; todoCount?: number }> = {};

    for (const a of assignmentsByDate) {
      meta[a.dateKey] = meta[a.dateKey] ?? {};
      meta[a.dateKey].assignmentCount = (meta[a.dateKey].assignmentCount ?? 0) + 1;
    }

    for (const [k, list] of Object.entries(todosByDate)) {
      meta[k] = meta[k] ?? {};
      meta[k].todoCount = list.length;
    }

    // 실서버 모드에서는 store가 날짜별 todoByDate를 만들지 않으므로,
    // 현재 선택된 날짜의 todoCount만이라도 표시(오늘인 경우)
    if (!API_CONFIG.useMock) {
      meta[dateKey] = meta[dateKey] ?? {};
      meta[dateKey].todoCount = todos.length;
    }

    return meta;
  }, [assignmentsByDate, dateKey, todos, todosByDate]);

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const out: TimelineItem[] = [];
    const pad = (n: number) => String(n).padStart(2, "0");

    for (const t of todos) {
      if (!t.done || !t.timeList?.length) continue;
      for (let i = 0; i < t.timeList.length; i++) {
        const slot = t.timeList[i];
        const start = new Date(slot.startTime);
        const end = new Date(slot.endTime);
        const slotDateKey = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
        if (slotDateKey !== dateKey) continue;

        const startHHMM = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
        const endHHMM = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
        out.push({
          id: `todo-${t.id}-${i}`,
          type: "task",
          title: t.title,
          start: startHHMM,
          end: endHHMM,
        });
      }
    }

    return out.sort((a, b) => a.start.localeCompare(b.start));
  }, [todos, dateKey]);

  const handleToggleDone = async (id: number, args?: { timeRange?: TimeRangeValue }) => {
    if (args?.timeRange) {
      await toggleDone(id, { timeList: toIsoTimeSlot(selectedDate, args.timeRange) });
      setViewMode("TIMETABLE");
    } else {
      await toggleDone(id);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 pt-4 pb-6">
      {/* 1. 환영 카드: 아이콘 + 이름 + 멘트 통합 */}
      <section className="mb-4 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-lg font-bold text-slate-900">
              {menteeName}님
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {welcomeMessage}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setCommentOpen(true)}
              aria-label="채팅"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 active:scale-95"
            >
              <DmIcon className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <CommentModal
              open={commentOpen}
              onClose={() => setCommentOpen(false)}
              onSubmit={handleCommentSubmit}
              onSendReply={handleSendReply}
              thread={thread}
            />
            <button
              type="button"
              aria-label="프로필"
              onClick={() => navigate("/mentee/mypage")}
              className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-slate-500 transition hover:bg-slate-50 hover:opacity-90 active:scale-95"
            >
              {(getLocalProfileImage() || user?.profileImage) ? (
                <img
                  src={getLocalProfileImage() || user?.profileImage || ""}
                  alt="프로필"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserIcon className="h-5 w-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>
      </section>

      {/* 3. 날짜 선택 - 카드형 섹션 */}
      <section className="mb-4">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          metaByDate={metaByDate}
          defaultExpanded={false}
        />
      </section>

      {/* 4. 오늘의 학습 - 카드형 섹션 */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">오늘의 학습</h2>

          <div className="flex rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
                viewMode === "LIST"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500",
              ].join(" ")}
              aria-pressed={viewMode === "LIST"}
              aria-label="목록 보기"
            >
              <ListIcon className="h-4 w-4" />
              목록
            </button>

            <button
              type="button"
              onClick={() => setViewMode("TIMETABLE")}
              className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
                viewMode === "TIMETABLE"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500",
              ].join(" ")}
              aria-pressed={viewMode === "TIMETABLE"}
              aria-label="타임테이블 보기"
            >
              <TimeIcon className="h-4 w-4" />
              타임
            </button>
          </div>
        </div>

        {viewMode === "LIST" ? (
          <div className="space-y-4">
            <AssignmentList
              items={assignments}
              onOpen={(id) => navigate(`/mentee/assignments/${id}`)}
            />
            <div className="border-t border-slate-100 pt-4" aria-hidden />
            <TodoList
              items={todos}
              onAddAtTop={(title) => addAtTop(title)}
              onToggleDone={handleToggleDone}
              onUpdateTitle={(id, title) => updateTitle(id, title)}
              onDelete={(id) => remove(id)}
            />
          </div>
        ) : (
          <TimeTable
            className="mt-0"
            items={timelineItems}
            dateKey={dateKey}
            selectedDate={selectedDate}
            startHour={6}
            endHour={24}
          />
        )}
      </section>
    </div>
  );
}
