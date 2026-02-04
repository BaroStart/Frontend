import AssignmentActions from '@/components/mentee/assignmentDetail/AssignmentActions';
import AssignmentContent from '@/components/mentee/assignmentDetail/AssignmentContent';
import AssignmentResources from '@/components/mentee/assignmentDetail/AssignmentResources';
import StudyVerification from '@/components/mentee/assignmentDetail/StudyVerification';

export default function AssignmentInfo({ assignment }: { assignment: Assignment }) {
  return (
    <>
      <div className="px-6 py-6 space-y-8">
        {/* 과제 내용 */}
        <AssignmentContent />

        {/* 학습 자료 */}
        <AssignmentResources />

        {/* 공부 인증 - 미제출/수정 화면 */}
        <StudyVerification assignment={assignment} />
      </div>

      {/* 하단 버튼 */}
      <AssignmentActions assignment={assignment} />
    </>
  );
}
