import { useEffect, useState } from 'react';

import AssignmentDetailHeader from '@/components/mentee/assignmentDetail/AssignmentDetailHeader';
import AssignmentDetailTabs from '@/components/mentee/assignmentDetail/AssignmentDetailTabs';
import AssignmentFeedback from '@/components/mentee/assignmentDetail/AssignmentFeedback';
import AssignmentInfo from '@/components/mentee/assignmentDetail/AssignmentInfo';

// --- Dummy Data ---
const MOCK_ASSIGNMENT: Assignment = {
  id: 1,
  subject: '국어',
  title: '비문학 독해 연습',
  description: '목표: 과학 지문 3개 풀이 및 오답 분석',
  submissionDate: '2026.02.02 14:30',
  status: '미완료',
};

interface AssignmentDetailPageProps {
  assignment?: Assignment;
}

export function AssignmentDetailPage({ assignment = MOCK_ASSIGNMENT }: AssignmentDetailPageProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'feedback'>('info');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className="relative">
      {/* 과제 헤더 */}
      <AssignmentDetailHeader assignment={assignment} />

      {/* 탭 */}
      <AssignmentDetailTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* 콘텐츠 */}
      {activeTab === 'info' && <AssignmentInfo assignment={assignment} />}
      {activeTab === 'feedback' && <AssignmentFeedback />}
    </div>
  );
}
