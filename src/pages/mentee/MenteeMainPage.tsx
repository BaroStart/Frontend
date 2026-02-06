import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/mentee/main/Calendar";
import { AssignmentList } from "@/components/mentee/main/AssignmentList";
import type { AssignmentItem } from "@/components/mentee/main/AssignmentCard";
import { CommentModal } from "@/components/mentee/main/CommentModal";
import { TodoList } from "@/components/mentee/main/TodoList";
import { useTodoStore } from "@/stores/useTodoStore";
import { TimeTable, type TimelineItem } from "@/components/mentee/main/TimeTable";
import { CommentIcon, ListIcon, TimeIcon, UserIcon } from "@/components/icons";

export function MenteeMainPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [commentOpen, setCommentOpen] = useState(false);

  const [viewMode, setViewMode] = useState<"LIST" | "TIMETABLE">("LIST");

  const menteeName = "김멘티님";
  const isStarred = true;

  const { todos, addAtTop, toggleDone, updateTitle, remove } = useTodoStore();

  const metaByDate = useMemo(
    () => ({
      "2026-02-03": { assignmentCount: 2, todoCount: 0 },
      "2026-02-04": { assignmentCount: 2, todoCount: 1 },
      "2026-02-05": { assignmentCount: 0, todoCount: 1 },
    }),
    []
  );

  const assignments: AssignmentItem[] = useMemo(
    () => [
      {
        id: "a1",
        title: "물리 실험 보고서 작성",
        status: "PENDING",
        dueAtText: "2026.02.04 (월) 18:00",
      },
      {
        id: "a2",
        title: "수학 문제집 3단원",
        status: "DONE",
        startedAtText: "02:30",
        endedAtText: "04:00",
      },
    ],
    [selectedDate]
  );

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
          <span className="text-lg font-semibold text-slate-900">{menteeName}</span>
          {isStarred && (
            <span aria-label="즐겨찾기" className="text-base leading-none">
              ⭐
            </span>
          )}
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
              console.log("comment submit:", values);
            }}
          />

          <button
            type="button"
            aria-label="프로필"
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
            onAddAtTop={addAtTop}
            onToggleDone={toggleDone}
            onUpdateTitle={updateTitle}
            onDelete={remove}
          />
        </>
      ) : (
        <TimeTable items={items} startHour={5} endHour={5} />
      )}
    </div>
  );
}
