import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/Button';

export function AssignmentManagePage() {
  return (
    <div className="min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-slate-800 sm:text-2xl">과제 관리</h1>
        <Link to="/mentor/assignments/new">
          <Button size="sm">
            <Plus className="h-4 w-4" />
            새 과제 등록
          </Button>
        </Link>
      </div>
      <p className="mt-2 text-sm text-slate-500 sm:text-base">준비 중입니다.</p>
    </div>
  );
}
