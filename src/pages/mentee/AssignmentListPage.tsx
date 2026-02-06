import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CalendarDays,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightSmall,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { AssignmentIcon, EnglishIcon, KoreanIcon, MathIcon } from '@/components/icons';
import { MOCK_INCOMPLETE_ASSIGNMENTS, SUBJECTS } from '@/data/menteeDetailMock';
import { useAuthStore } from '@/stores/useAuthStore';

// --- Types ---
type Status = '완료' | '미완료';

const TABS = SUBJECTS;

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toYmdKeyLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function addDays(d: Date, diff: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + diff);
  return copy;
}

function formatKoreanDate(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function ymdToDot(ymd: string) {
  // "2026-02-02" -> "2026.02.02"
  return ymd.replaceAll('-', '.');
}

function toSubmissionText(dateYmd: string, timeText?: string) {
  if (!timeText) return ymdToDot(dateYmd);
  // mock 데이터는 "오전 10:45" 같은 포맷이라 그대로 붙임
  return `${ymdToDot(dateYmd)} ${timeText}`;
}

export function AssignmentListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('전체');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date(2026, 1, 2)); // 2026-02-02 (목데이터 기준)

  const { user } = useAuthStore();
  // 실 API 로그인 시 user.id가 loginId일 수 있어서, mock 데이터(s1/s2)가 없으면 s1로 폴백
  const menteeId = user?.role === 'mentee' && /^s\d+$/i.test(user.id) ? user.id : 's1';

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case '수학':
        return <MathIcon className="h-6 w-6 text-[#0E9ABE]" />;
      case '영어':
        return <EnglishIcon className="h-6 w-6 text-[#0E9ABE]" />;
      case '국어':
        return <KoreanIcon className="h-6 w-6 text-[#0E9ABE]" />;
      default:
        return <AssignmentIcon className="h-6 w-6 text-[#0E9ABE]" />;
    }
  };

  const filteredAssignments = useMemo(() => {
    const dateKey = toYmdKeyLocal(selectedDate);
    const base = MOCK_INCOMPLETE_ASSIGNMENTS.filter((a) => a.menteeId === menteeId).map(
      (a): Assignment => {
        const dateYmd = a.completedAtDate ?? a.deadlineDate ?? dateKey;
        const isDone = a.status === 'completed';
        return {
          id: a.id,
          subject: a.subject,
          title: a.title,
          description: a.description ?? '',
          submissionDate: isDone
            ? toSubmissionText(dateYmd, a.completedAt)
            : toSubmissionText(dateYmd, a.deadline),
          status: (isDone ? '완료' : '미완료') satisfies Status,
        };
      }
    );

    const byDate = base.filter((a) => a.submissionDate.startsWith(ymdToDot(dateKey)));
    const bySubject = activeTab === '전체' ? byDate : byDate.filter((item) => item.subject === activeTab);
    return bySubject;
  }, [activeTab, menteeId, selectedDate]);

  return (
    <div className="flex flex-col h-full gap-2 px-4 pt-4 bg-white">
      {/* 헤더 */}
      <header>
        <div className="grid grid-cols-3 items-center">
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, -1))}
              className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
              aria-label="이전 날짜"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <CalendarDays className="w-4 h-4" />
              <span className="text-sm font-semibold tracking-tight">{formatKoreanDate(selectedDate)}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600"
              aria-label="다음 날짜"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 과목 필터링 */}
      <div className="px-4 mb-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 py-3">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={twMerge(
                'px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 shadow-sm, hover:shadow-md hover:text-gray-600 h-10',
                activeTab === tab
                  ? 'bg-[#0E9ABE] text-white shadow-[#0E9ABE]/30'
                  : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50 ',
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 과제 리스트 박스 */}
      <div className="flex-1 px-6 pb-20 space-y-5">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => (
            // 과제 리스트
            <div
              key={assignment.id}
              className="p-6 transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-3xl hover:shadow-md hover:bg-gray-50"
            >
              <div className="flex items-start gap-5 mb-5">
                {/* Icon Box */}
                <div className="flex items-center justify-center flex-shrink-0 w-14 h-14 rounded-2xl bg-[#0E9ABE]/10">
                  {getSubjectIcon(assignment.subject)}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-[#0E9ABE] font-bold text-xs uppercase tracking-wider mb-1 block">
                      {assignment.subject}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        assignment.status === '완료'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {assignment.status}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold leading-tight text-gray-900 truncate">
                    {assignment.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-500 line-clamp-2">
                    {assignment.description}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 border-dashed">
                {assignment.status === '완료' ? (
                  <span className="px-2 py-1 text-xs font-medium text-gray-400 rounded bg-gray-50">
                    {assignment.submissionDate} 제출 완료
                  </span>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => navigate(`/mentee/assignments/${assignment.id}`)}
                  className="flex items-center text-[#0E9ABE] text-sm font-bold hover:underline decoration-2 underline-offset-2"
                >
                  상세보기
                  <ChevronRightSmall className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ))
        ) : (
          /* 등록된 과제 없음 */
          <div className="flex flex-col items-center justify-center w-full h-full mt-10 text-center">
            <div className="flex items-center justify-center w-16 h-16 mb-4 text-gray-400 bg-gray-100 rounded-full">
              <BookOpen className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-medium text-gray-500">등록된 과제가 없습니다.</p>
            <p className="mt-1 text-sm text-gray-400">오늘은 자유로운 하루네요!</p>
          </div>
        )}
      </div>
    </div>
  );
}
