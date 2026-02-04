import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import AssignmentFeedback from '@/components/mentee/assignmentDetail/AssignmentFeedback';
import AssignmentInfo from '@/components/mentee/assignmentDetail/AssignmentInfo';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface Assignment {
  id: number;
  subject: string;
  title: string;
  description: string;
  submissionDate: string;
  status: string;
}

// --- Dummy Data ---
const MOCK_ASSIGNMENT: Assignment = {
  id: 1,
  subject: '국어',
  title: '비문학 독해 연습',
  description: '목표: 과학 지문 3개 풀이 및 오답 분석',
  submissionDate: '2025.02.02 14:30',
  status: '완료',
};

interface AssignmentDetailPageProps {
  assignment?: Assignment;
}

export function AssignmentDetailPage({ assignment = MOCK_ASSIGNMENT }: AssignmentDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'feedback'>('info');
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className="relative">
      {/* 헤더 */}
      <header className="flex items-center px-5 py-2 border-b bg-white/95 backdrop-blur-sm border-slate-50">
        <button
          onClick={() => navigate('/mentee/assignments')}
          className="p-1 -ml-1 transition-colors rounded-full text-slate-800 hover:bg-slate-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      {/* 제목 섹션 */}
      <div className="px-6 pt-2 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="black" className="rounded-sm px-2 py-0.5 text-[11px] font-bold">
            {assignment.subject}
          </Badge>
          <span className="text-sm font-medium text-slate-400">{assignment.submissionDate}</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{assignment.title}</h1>
        <p className="text-sm text-slate-500">{assignment.description}</p>
      </div>

      {/* 탭 */}
      <div className="sticky z-10 flex px-6 bg-white top-14">
        <button
          onClick={() => setActiveTab('info')}
          className={cn(
            'flex-1 pb-3 py-4 text-sm font-bold text-center border-b-2 transition-colors',
            activeTab === 'info'
              ? 'border-[#0E9ABE] text-slate-900'
              : 'border-transparent text-slate-400',
          )}
        >
          과제 정보
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={cn(
            'flex-1 pb-3 py-4 text-sm font-bold text-center border-b-2 transition-colors',
            activeTab === 'feedback'
              ? 'border-[#0E9ABE] text-slate-900'
              : 'border-transparent text-slate-400',
          )}
        >
          피드백
        </button>
      </div>

      {/* 콘텐츠 */}
      {activeTab === 'info' ? <AssignmentInfo /> : <AssignmentFeedback />}
    </div>
  );
}
