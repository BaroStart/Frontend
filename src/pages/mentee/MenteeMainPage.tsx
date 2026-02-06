import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/mentee/main/Calendar";
import { AssignmentList } from "@/components/mentee/main/AssignmentList";
import type { AssignmentItem } from "@/components/mentee/main/AssignmentCard";
import { CommentModal } from "@/components/mentee/main/CommentModal";
import { TodoList } from "@/components/mentee/main/TodoList";
import { useTodoStore } from "@/stores/useTodoStore";
import { TimeTable, type TimelineItem } from "@/components/mentee/main/TimeTable";
import { API_CONFIG } from "@/api/config";
import type { TimeRangeValue } from "@/components/mentee/TimeRangeModal";
import type { TimeSlot } from "@/api/todos";
import { useAuthStore } from "@/stores/useAuthStore";
import { CommentIcon, ListIcon, TimeIcon, UserIcon } from "@/components/icons";
import { MOCK_INCOMPLETE_ASSIGNMENTS } from "@/data/menteeDetailMock";
import { incrementQnaCount } from "@/lib/menteeActivityStorage";
import { getSubmittedAssignments } from "@/lib/menteeAssignmentSubmissionStorage";

export function MenteeMainPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [commentOpen, setCommentOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"LIST" | "TIMETABLE">("LIST");

  const { user } = useAuthStore();
  const menteeName = user?.name ?? "멘티";

  const {
    todos,
    todosByDate,
    setSelectedDate: setTodoDate,
    loadSelectedDate,
    addAtTop,
    toggleDone,
    updateTitle,
    remove,
  } = useTodoStore();

  const pad2 = (n: number) => String(n).padStart(2, "0");
  const dateKey = `${selectedDate.getFullYear()}-${pad2(selectedDate.getMonth() + 1)}-${pad2(selectedDate.getDate())}`;

  useEffect(() => {
    // 달력에서 날짜를 바꾸면, 해당 날짜의 할 일을 보여주도록 연결
    void setTodoDate(dateKey);
    // 실서버는 "오늘"만 조회 가능(명세 기준)이라, store가 오늘인 경우에만 load 수행
    if (!API_CONFIG.useMock) {
      void loadSelectedDate();
    }
  }, [dateKey, loadSelectedDate, setTodoDate]);

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

  const items: TimelineItem[] = [
    { id: "1", type: "task", title: "할 일", start: "06:13", end: "06:30" },
    { id: "2", type: "assignment", title: "과제", start: "10:02", end: "10:52" },
    { id: "3", type: "task", title: "리뷰", start: "10:52", end: "12:11" },
    { id: "4", type: "task", title: "밥", start: "12:30", end: "13:00" },
    { id: "5", type: "task", title: "주식", start: "14:10", end: "15:03" },
    { id: "6", type: "task", title: "코딩", start: "15:06", end: "15:47" },
  ];

  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-lg font-semibold text-gray-900">{menteeName}님</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCommentOpen(true)}
            aria-label="채팅"
            className="grid h-10 w-10 place-items-center rounded-full border bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-[0.98]"
          >
            <CommentIcon className="h-5 w-5" />
          </button>

          <CommentModal
            open={commentOpen}
            onClose={() => setCommentOpen(false)}
            onSubmit={(values) => {
              const hasAny =
                (values.comment?.trim().length ?? 0) > 0 || (values.question?.trim().length ?? 0) > 0;
              if (hasAny && user?.id) incrementQnaCount(user.id, 1);
            }}
          />

          <button
            type="button"
            aria-label="프로필"
            onClick={() => navigate("/mentee/mypage")}
            className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gray-100 text-gray-500 transition active:scale-[0.98]"
          >
            <UserIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        metaByDate={metaByDate}
        defaultExpanded={false}
      />

      <div className="my-8 flex items-center justify-between">
        <h1 className="text-[18px] font-extrabold text-gray-900">오늘의 학습 목록</h1>

        <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1">
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            className={[
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition",
              viewMode === "LIST"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500",
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
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500",
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
        <>
          <AssignmentList
            items={assignments}
            onOpen={(id) => navigate(`/mentee/assignments/${id}`)}
          />

          <TodoList
            items={todos}
            onAddAtTop={(title) => addAtTop(title)}
            onToggleDone={(id, args) =>
              args?.timeRange
                ? toggleDone(id, { timeList: toIsoTimeSlot(selectedDate, args.timeRange) })
                : toggleDone(id)
            }
            onUpdateTitle={(id, title) => updateTitle(id, title)}
            onDelete={(id) => remove(id)}
          />
        </>
      ) : (
        <TimeTable items={items} startHour={5} endHour={5} />
      )}
    </div>
  );
}
