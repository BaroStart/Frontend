import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import AssignmentDetailHeader from '@/components/mentee/assignmentDetail/AssignmentDetailHeader';
import AssignmentDetailTabs from '@/components/mentee/assignmentDetail/AssignmentDetailTabs';
import AssignmentFeedback from '@/components/mentee/assignmentDetail/AssignmentFeedback';
import AssignmentInfo from '@/components/mentee/assignmentDetail/AssignmentInfo';
import { MOCK_ASSIGNMENT_DETAILS, MOCK_INCOMPLETE_ASSIGNMENTS } from '@/data/menteeDetailMock';
import { useAuthStore } from '@/stores/useAuthStore';

function ymdToDot(ymd: string) {
  return ymd.replaceAll('-', '.');
}

function toSubmissionText(dateYmd: string, timeText?: string) {
  if (!timeText) return ymdToDot(dateYmd);
  return `${ymdToDot(dateYmd)} ${timeText}`;
}

export function AssignmentDetailPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'info' | 'feedback'>('info');
  const [isEditing, setIsEditing] = useState(false);

  const menteeId = user?.role === 'mentee' && /^s\d+$/i.test(user.id) ? user.id : 's1';

  const { assignment, detail } = useMemo(() => {
    const id = assignmentId ?? 'a1';
    const base = MOCK_INCOMPLETE_ASSIGNMENTS.find((a) => a.menteeId === menteeId && a.id === id);
    const isDone = base?.status === 'completed';

    const dateYmd = base?.completedAtDate ?? base?.deadlineDate ?? '2026-02-02';
    const submissionDate = isDone
      ? toSubmissionText(dateYmd, base?.completedAt)
      : toSubmissionText(dateYmd, base?.deadline);

    const d = MOCK_ASSIGNMENT_DETAILS[id] ?? null;

    const a: Assignment = {
      id,
      subject: d?.subject ?? base?.subject ?? '-',
      title: d?.title ?? base?.title ?? '과제',
      description: d?.goal ?? base?.description ?? '',
      submissionDate,
      status: isDone ? '완료' : '미완료',
    };

    return { assignment: a, detail: d };
  }, [assignmentId, menteeId]);

  const onChangeToEditMode = () => {
    setIsEditing((prev) => !prev);
  };

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
      {/* 과제 정보 */}
      {activeTab === 'info' && (
        <AssignmentInfo
          assignment={assignment}
          detail={detail}
          isEditing={isEditing}
          onChangeToEditMode={onChangeToEditMode}
        />
      )}
      {activeTab === 'feedback' && <AssignmentFeedback />}
    </div>
  );
}
