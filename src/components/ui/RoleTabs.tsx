import type { UserRole } from '@/types/auth';

interface RoleTabsProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
}

export function RoleTabs({ value, onChange }: RoleTabsProps) {
  return (
    <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
      <button
        type="button"
        onClick={() => onChange('mentee')}
        className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
          value === 'mentee'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        멘티로 시작하기
      </button>
      <button
        type="button"
        onClick={() => onChange('mentor')}
        className={`flex-1 rounded-md py-2.5 text-sm font-medium transition ${
          value === 'mentor'
            ? 'bg-white text-slate-800 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        멘토로 관리하기
      </button>
    </div>
  );
}
