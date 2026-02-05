import { Edit, Send, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/Button';

export default function AssignmentActions({ assignment }: { assignment: Assignment }) {
  const isCompleted = assignment.status === '완료';
  return (
    <>
      <div className="flex justify-center w-full gap-3 px-6 pb-5">
        {!isCompleted ? (
          // 미제출 상태
          <Button
            icon={Send}
            className="w-full h-12 gap-2 text-sm font-bold shadow-lg rounded-xl bg-[#1a1a1a] hover:bg-black text-white"
          >
            과제 제출하기
          </Button>
        ) : (
          // 제출 완료 상태
          <>
            <Button
              icon={Trash2}
              className="flex-1 h-12 gap-2 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl hover:text-red-600"
            >
              삭제하기
            </Button>
            <Button
              icon={Edit}
              className="flex-1 h-12 gap-2 text-sm font-bold text-white shadow-lg bg-slate-900 hover:bg-black rounded-xl"
            >
              수정하기
            </Button>
          </>
        )}
      </div>
    </>
  );
}
