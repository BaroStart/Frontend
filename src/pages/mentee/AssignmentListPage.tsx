import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  CalendarDays,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightSmall,
} from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { EnglishIcon, KoreanIcon, MathIcon } from '@/components/icons';

// --- Types ---
type Subject = '국어' | '영어' | '수학';
type Status = '완료' | '미완료';

interface Assignment {
  id: number;
  subject: Subject;
  title: string;
  description: string;
  submissionDate: string;
  status: Status;
}

// --- Dummy Data ---
const ASSIGNMENTS: Assignment[] = [
  {
    id: 1,
    subject: '수학',
    title: '미적분 II - 치환적분 연습',
    description: '부분적분과 치환적분을 활용한 정적분 문제 풀이 및 심화 응용',
    submissionDate: '2026.02.02 14:30',
    status: '완료',
  },
  {
    id: 2,
    subject: '영어',
    title: '영어 독해 - 주제문 찾기',
    description: '고난도 지문 3개 분석 및 주제 파악 연습 (수능 기출 변형)',
    submissionDate: '2026.02.02 11:20',
    status: '완료',
  },
  {
    id: 3,
    subject: '국어',
    title: '현대시 감상 - 표현 기법',
    description: '은유, 직유, 의인법 등 표현 기법 분석 및 에세이 작성',
    submissionDate: '2026.02.02 09:40',
    status: '완료',
  },
  {
    id: 5,
    subject: '수학',
    title: '확률과 통계 - 조건부 확률',
    description: '조건부 확률의 정의와 곱셈정리를 이용한 문제 해결',
    submissionDate: '2026.02.03 10:00',
    status: '미완료',
  },
];

const TABS = ['전체', '국어', '영어', '수학'];

export function AssignmentListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('전체');

  const getSubjectIcon = (subject: Subject) => {
    switch (subject) {
      case '수학':
        return <MathIcon className="h-6 w-6 text-[#0E9ABE]" />;
      case '영어':
        return <EnglishIcon className="h-6 w-6 text-[#0E9ABE]" />;
      case '국어':
        return <KoreanIcon className="h-6 w-6 text-[#0E9ABE]" />;
      default:
        return <KoreanIcon className="h-6 w-6 text-[#0E9ABE]" />;
    }
  };

  const filteredAssignments =
    activeTab === '전체' ? ASSIGNMENTS : ASSIGNMENTS.filter((item) => item.subject === activeTab);

  return (
    <div className="flex flex-col h-full gap-2 px-4 pt-4 bg-white">
      {/* 헤더 */}
      <header>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
            <CalendarDays className="w-4 h-4" />
            {/* TODO: 클릭시 달력 모달 열기 */}
            <span className="text-sm font-semibold tracking-tight">2026년 2월 2일</span>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button className="flex items-center justify-center w-10 h-10 text-gray-400 transition-colors rounded-full hover:bg-gray-100 hover:text-gray-600">
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
