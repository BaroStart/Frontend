import { useNavigate } from 'react-router-dom';

import { ArrowLeft } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';

export default function AssignmentDetailHeader({ assignment }: { assignment: Assignment }) {
  const navigate = useNavigate();
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
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="black" className="rounded-sm px-2 py-0.5 text-[11px] font-bold">
            {assignment.subject}
          </Badge>
          <span className="text-sm font-medium text-slate-400">{assignment.submissionDate}</span>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">{assignment.title}</h1>
        <p className="text-sm text-slate-500">{assignment.description}</p>
      </div>
    </>
  );
}
