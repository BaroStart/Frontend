import type { ReactNode } from 'react';

import {
  Award,
  BookOpen,
  CalendarDays,
  Clock,
  Coffee,
  Crown,
  Flame,
  Hourglass,
  LockKeyhole,
  MessageCircleQuestion,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from 'lucide-react';

export type BadgeItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  acquired: boolean;
};

type Props = {
  title?: string;
  items: BadgeItem[];
  className?: string;
  onClickAll?: () => void;
};

export function BadgeSection({
  title = '획득한 배지',
  items,
  className,
}: Props) {
  const iconFor = (b: BadgeItem): ReactNode => {
    if (b.icon) return b.icon;
    switch (b.id) {
      case 'badge_attendance_7':
        return <Flame className="h-5 w-5" />;
      case 'badge_weekly_goal_7days':
        return <Trophy className="h-5 w-5" />;
      case 'badge_first_assignment':
        return <Star className="h-5 w-5" />;
      case 'badge_total_100h':
        return <Clock className="h-5 w-5" />;
      case 'badge_korean_master':
        return <BookOpen className="h-5 w-5" />;
      case 'badge_math_master':
        return <Target className="h-5 w-5" />;
      case 'badge_english_master':
        return <Sparkles className="h-5 w-5" />;
      case 'badge_attendance_30':
        return <CalendarDays className="h-5 w-5" />;
      case 'badge_todo_streak_7':
        return <TrendingUp className="h-5 w-5" />;
      case 'badge_question_king':
        return <Crown className="h-5 w-5" />;
      case 'badge_pomodoro_master':
        return <Timer className="h-5 w-5" />;
      case 'badge_morning_routine':
        return <Coffee className="h-5 w-5" />;
      case 'badge_100h_study':
        return <Hourglass className="h-5 w-5" />;
      case 'badge_questions_10':
        return <MessageCircleQuestion className="h-5 w-5" />;
      default:
        return <Award className="h-5 w-5" />;
    }
  };

  return (
    <section className={['', className ?? ''].join(' ').trim()}>
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>

      <div className="grid grid-cols-4 gap-y-4 gap-x-2">
        {items.map((b) => {
          const base =
            'flex h-16 w-16 flex-col items-center justify-center rounded-full border text-center shadow-sm';
          const acquiredCls = b.acquired
            ? 'border-gray-900 bg-gray-900 text-white'
            : 'border-gray-200 bg-gray-100 text-gray-400';

          return (
            <div key={b.id} className="flex flex-col items-center gap-2">
              <div className={[base, acquiredCls].join(' ')}>
                <div className="leading-none">
                  {b.acquired ? iconFor(b) : <LockKeyhole className="h-5 w-5" />}
                </div>
              </div>

              <div className="text-center">
                <p
                  className={[
                    'text-[11px] font-semibold',
                    b.acquired ? 'text-gray-900' : 'text-gray-400',
                  ].join(' ')}
                >
                  {b.title}
                </p>
                {b.subtitle && (
                  <p
                    className={[
                      'text-[10px]',
                      b.acquired ? 'text-gray-500' : 'text-gray-300',
                    ].join(' ')}
                  >
                    {b.subtitle}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
