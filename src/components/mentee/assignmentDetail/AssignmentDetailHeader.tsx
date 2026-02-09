import { useNavigate } from 'react-router-dom';

import { ArrowLeft, CalendarDays } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';

export default function AssignmentDetailHeader({ assignment }: { assignment: Assignment }) {
  const navigate = useNavigate();
  const isCompleted = assignment.status === '완료';
  return (
    <>
      <header className="flex items-center px-5 py-2 border-b bg-white/95 backdrop-blur-sm border-slate-50">
        <button
          onClick={() => navigate('/mentee/assignments')}
          className="p-1 -ml-1 transition-colors rounded-full text-slate-800 hover:bg-slate-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>
      <div className="px-6 pt-2 pb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="black" className="rounded-sm px-2 py-0.5 text-[11px] font-bold shrink-0">
            {assignment.subject}
          </Badge>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 shrink-0">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" aria-hidden />
            {assignment.submissionDate}
          </span>
          <span
            className={`inline-flex h-5 items-center justify-center rounded-md px-2 py-0.5 text-[10px] font-bold shrink-0 ${
              isCompleted
                ? 'bg-[hsl(var(--brand))] text-white'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {assignment.status}
          </span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{assignment.title}</h1>
        <p className="text-sm text-slate-500">{assignment.description}</p>
      </div>
    </>
  );
}
