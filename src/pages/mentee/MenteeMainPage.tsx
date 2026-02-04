import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar } from "@/components/mentee/main/Calendar";
import { AssignmentList } from "@/components/mentee/main/AssignmentList";
import type { AssignmentItem } from "@/components/mentee/main/AssignmentCard";
import { CommentModal } from "@/components/mentee/main/CommentModal";
import { TodoList } from "@/components/mentee/main/TodoList";
import { useTodoStore } from "@/stores/useTodoStore";
import { TimeTable, type TimelineItem } from "@/components/mentee/main/TimeTable";

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 0 1-3.5-.6L3 20l1.3-3.3A7.6 7.6 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
      />
    </svg>
  );
}

export function MenteeMainPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [commentOpen, setCommentOpen] = useState(false);

  const menteeName = "김멘티님";
  const isStarred = true;
  const {
    todos,
    addAtTop,
    toggleDone,
    updateTitle,
    remove,
  } = useTodoStore();

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
        dueAtText: "2025.02.04 (월) 18:00",
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
          <span className="text-lg font-semibold text-gray-900">{menteeName}</span>
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
            className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-gray-700 transition active:scale-[0.98]"
          >
            <ChatIcon className="h-5 w-5" />
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
            onClick={() => navigate("/mentee/mypage")}
            aria-label="프로필"
            className="h-10 w-10 overflow-hidden rounded-full bg-gray-200 transition active:scale-[0.98]"
          >
            <div className="h-full w-full" />
          </button>
        </div>
      </div>

      <Calendar
        value={selectedDate}
        onChange={setSelectedDate}
        metaByDate={metaByDate}
        defaultExpanded={false}
      />

      <h1 className="my-8 font-bold">오늘의 학습 목록</h1>

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

      <TimeTable items={items} startHour={5} endHour={5} />
    </div>
  );
}
