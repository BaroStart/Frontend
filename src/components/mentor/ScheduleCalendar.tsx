import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export interface ScheduleItem {
  id: string;
  title: string;
  subject: string;
  date: string; // YYYY-MM-DD
  status?: 'default' | 'completed' | 'urgent';
}

interface ScheduleCalendarProps {
  year: number;
  month: number;
  selectedDate: string | null;
  scheduleItems: ScheduleItem[];
  onDateSelect: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  onItemClick?: (item: ScheduleItem) => void;
  className?: string;
}

export function ScheduleCalendar({
  year,
  month,
  selectedDate,
  scheduleItems,
  onDateSelect,
  onMonthChange,
  onItemClick,
  className,
}: ScheduleCalendarProps) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const getItemsForDate = (dateStr: string) =>
    scheduleItems.filter((item) => item.date === dateStr);

  const handlePrevMonth = () => {
    if (month === 1) onMonthChange(year - 1, 12);
    else onMonthChange(year, month - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) onMonthChange(year + 1, 1);
    else onMonthChange(year, month + 1);
  };

  const formatDate = (day: number) => {
    const m = String(month).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white p-3', className)}>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-slate-900">
          {year}년 {month}월
        </span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 text-center font-medium text-slate-500">
            {day}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} className="min-h-[60px]" />;
          const dateStr = formatDate(day);
          const items = getItemsForDate(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <div
              key={dateStr}
              className={cn(
                'min-h-[60px] cursor-pointer rounded border p-1 transition-colors',
                isSelected ? 'border-slate-800 bg-slate-50' : 'border-transparent hover:bg-slate-50'
              )}
              onClick={() => onDateSelect(dateStr)}
            >
              <span className="text-sm font-medium text-slate-700">{day}</span>
              <div className="mt-0.5 space-y-0.5">
                {items.slice(0, 2).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onItemClick?.(item);
                    }}
                    className={cn(
                      'block w-full truncate rounded px-1 py-0.5 text-left text-[10px]',
                      item.status === 'urgent' && 'bg-slate-800 text-white',
                      item.status === 'completed' && 'bg-slate-200 text-slate-700',
                      (!item.status || item.status === 'default') && 'bg-slate-100 text-slate-800'
                    )}
                  >
                    {item.title}
                  </button>
                ))}
                {items.length > 2 && (
                  <span className="block truncate px-1 text-[10px] text-slate-400">
                    +{items.length - 2}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
