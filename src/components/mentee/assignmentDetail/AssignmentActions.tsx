import { Edit, Send, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export default function AssignmentActions({ assignment }: { assignment: Assignment }) {
  const isCompleted = assignment.status === '완료';
  return (
    <>
      <div className="flex justify-center w-full gap-3 px-6 pb-5">
        {!isCompleted ? (
          // 미제출 상태
          <Button className="w-full h-12 gap-2 text-sm font-bold shadow-lg rounded-xl bg-[#1a1a1a] hover:bg-black text-white">
            <Send className="w-4 h-4" />
            과제 제출하기
          </Button>
        ) : (
          // 제출 완료 상태
          <>
            <Button className="flex-1 h-12 gap-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl hover:text-red-600">
              <Trash2 className="w-4 h-4" />
              삭제하기
            </Button>
            <Button className="flex-1 h-12 gap-2 text-sm font-bold text-white shadow-lg bg-slate-900 hover:bg-black rounded-xl">
              <Edit className="w-4 h-4" />
              수정하기
            </Button>
          </>
        )}
      </div>
    </>
  );
}
