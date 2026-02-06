import AssignmentActions from '@/components/mentee/assignmentDetail/AssignmentActions';
import AssignmentContent from '@/components/mentee/assignmentDetail/AssignmentContent';
import AssignmentResources from '@/components/mentee/assignmentDetail/AssignmentResources';
import StudyVerification from '@/components/mentee/assignmentDetail/StudyVerification';

interface AssignmentInfoProps {
  assignment: Assignment;
  isEditing: boolean;
  onChangeToEditMode: () => void;
}

export default function AssignmentInfo({
  assignment,
  isEditing,
  onChangeToEditMode,
}: AssignmentInfoProps) {
  return (
    <>
      <div className="px-6 py-6 space-y-8">
        {/* 과제 내용 */}
        <AssignmentContent />

        {/* 학습 자료 */}
        <AssignmentResources />

        {/* 공부 인증 + 메모 */}
        <StudyVerification assignment={assignment} />
      </div>

      {/* 하단 버튼 */}
      <AssignmentActions
        assignment={assignment}
        isEditing={isEditing}
        onChangeToEditMode={onChangeToEditMode}
      />
    </>
  );
}
