import { cn } from '@/lib/utils';

interface AssignmentDetailTabsProps {
  activeTab: 'info' | 'feedback';
  setActiveTab: (tab: 'info' | 'feedback') => void;
}

export default function AssignmentDetailTabs({
  activeTab,
  setActiveTab,
}: AssignmentDetailTabsProps) {
  return (
    <>
      <div className="sticky z-10 flex px-6 bg-white top-14">
        <button
          onClick={() => setActiveTab('info')}
          className={cn(
            'flex-1 pb-3 py-4 text-sm font-bold text-center border-b-2 transition-colors',
            activeTab === 'info'
              ? 'border-[#0E9ABE] text-slate-900'
              : 'border-transparent text-slate-400',
          )}
        >
          과제 정보
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={cn(
            'flex-1 pb-3 py-4 text-sm font-bold text-center border-b-2 transition-colors',
            activeTab === 'feedback'
              ? 'border-[#0E9ABE] text-slate-900'
              : 'border-transparent text-slate-400',
          )}
        >
          피드백
        </button>
      </div>
    </>
  );
}
