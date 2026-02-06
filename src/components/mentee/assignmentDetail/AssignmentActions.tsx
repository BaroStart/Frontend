import { Check, Edit, Send, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';

interface AssignmentActionsProps {
  assignment: Assignment;
  isEditing: boolean;
  onChangeToEditMode: () => void;
  onSubmitAssignment?: () => void;
}

export default function AssignmentActions({
  assignment,
  isEditing,
  onChangeToEditMode,
  onSubmitAssignment,
}: AssignmentActionsProps) {
  const isSubmitted = assignment.status === '완료';

  const renderButtons = () => {
    // 1. 미제출 상태: 제출하기
    if (!isSubmitted) {
      return (
        <Button
          type="button"
          onClick={onSubmitAssignment}
          className="w-full h-12 gap-2 text-sm font-bold shadow-lg rounded-xl bg-[#1a1a1a] hover:bg-black text-white"
        >
          <Send className="w-4 h-4" />
          과제 제출하기
        </Button>
      );
    }

    // 2. 제출 완료 + 수정 모드: 수정 완료
    if (isEditing) {
      return (
        <Button className="w-full h-12 gap-2 text-sm font-bold text-white shadow-lg bg-[#1a1a1a] hover:bg-black rounded-xl">
          <Check className="w-4 h-4" />
          수정 완료
        </Button>
      );
    }

    // 3. 제출 완료 + 일반(조회) 모드: 삭제/수정
    return (
      <>
        <Button className="flex-1 h-12 gap-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl hover:text-red-600">
          <Trash2 className="w-4 h-4" />
          삭제하기
        </Button>
        <Button
          onClick={onChangeToEditMode}
          className="flex-1 h-12 gap-2 text-sm font-bold text-white shadow-lg bg-slate-900 hover:bg-black rounded-xl"
        >
          <Edit className="w-4 h-4" />
          수정하기
        </Button>
      </>
    );
  };

  return <div className="flex justify-center w-full gap-3 px-6 pb-5">{renderButtons()}</div>;
}
