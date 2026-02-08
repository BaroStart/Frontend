import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';

import AssignmentDetailHeader from '@/components/mentee/assignmentDetail/AssignmentDetailHeader';
import AssignmentDetailTabs from '@/components/mentee/assignmentDetail/AssignmentDetailTabs';
import AssignmentFeedback from '@/components/mentee/assignmentDetail/AssignmentFeedback';
import AssignmentInfo from '@/components/mentee/assignmentDetail/AssignmentInfo';
import { MOCK_ASSIGNMENT_DETAILS, MOCK_INCOMPLETE_ASSIGNMENTS } from '@/data/menteeDetailMock';
import { useAuthStore } from '@/stores/useAuthStore';
import { getSubmittedAssignments, markAssignmentSubmitted } from '@/lib/menteeAssignmentSubmissionStorage';

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
  const userKey = user?.id ?? '';

  const { assignment, detail } = useMemo(() => {
    const id = assignmentId ?? 'a1';
    const base = MOCK_INCOMPLETE_ASSIGNMENTS.find((a) => a.menteeId === menteeId && a.id === id);
    const submitted = userKey ? getSubmittedAssignments(userKey)[id] : undefined;
    const isDone = base?.status === 'completed' || !!submitted;

    const dateYmd = base?.completedAtDate ?? base?.deadlineDate ?? '2026-02-02';
    const submissionDate = (() => {
      if (submitted?.submittedAt) {
        const d = new Date(submitted.submittedAt);
        const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(
          2,
          '0'
        )}`;
        const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        return `${ymdToDot(ymd)} ${hm}`;
      }
      return isDone ? toSubmissionText(dateYmd, base?.completedAt) : toSubmissionText(dateYmd, base?.deadline);
    })();

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
  }, [assignmentId, menteeId, userKey]);

  const onChangeToEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  useEffect(() => {
    if (assignment.status !== '완료' && activeTab === 'feedback') {
      setActiveTab('info');
    }
  }, [assignment.status, activeTab, setActiveTab]);

  return (
    <div className="relative">
      {/* 과제 헤더 */}
      <AssignmentDetailHeader assignment={assignment} />

      {/* 탭 */}
      <AssignmentDetailTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCompleted={assignment.status === '완료'}
      />

      {/* 콘텐츠 */}
      {activeTab === 'info' && (
        <AssignmentInfo
          assignment={assignment}
          detail={detail}
          isEditing={isEditing}
          onChangeToEditMode={onChangeToEditMode}
          onSubmitAssignment={() => {
            if (!userKey) return;
            markAssignmentSubmitted(userKey, assignment.id);
          }}
        />
      )}
      {activeTab === 'feedback' && assignment.status === '완료' && <AssignmentFeedback />}
    </div>
  );
}
