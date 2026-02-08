import { cn } from '@/lib/utils';

interface AssignmentDetailTabsProps {
  activeTab: 'info' | 'feedback';
  setActiveTab: (tab: 'info' | 'feedback') => void;
  /** 완료된 과제일 때만 피드백 탭 표시 */
  isCompleted?: boolean;
}

export default function AssignmentDetailTabs({
  activeTab,
  setActiveTab,
  isCompleted = false,
}: AssignmentDetailTabsProps) {
  return (
    <div className="sticky top-0 z-10 flex bg-white px-6">
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
      {isCompleted && (
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
      )}
    </div>
  );
}
