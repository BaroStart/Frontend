import type { ReactNode } from 'react';

import { Award, BookOpen, CalendarDays, Clock, Flame, Hourglass, Star, TrendingUp, Trophy } from 'lucide-react';

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
      case 'b1':
        return <Flame className="h-5 w-5" />;
      case 'b2':
        return <Trophy className="h-5 w-5" />;
      case 'b3':
        return <Star className="h-5 w-5" />;
      case 'b4':
        return <Clock className="h-5 w-5" />;
      case 'b5':
        return <BookOpen className="h-5 w-5" />;
      case 'b6':
        return <TrendingUp className="h-5 w-5" />;
      case 'b7':
        return <CalendarDays className="h-5 w-5" />;
      case 'b8':
        return <Hourglass className="h-5 w-5" />;
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
                <div className="leading-none">{iconFor(b)}</div>
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
