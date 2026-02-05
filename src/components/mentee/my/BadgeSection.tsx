export type BadgeItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
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
                <div className="text-lg leading-none">
                  {b.icon ?? '🏅'}
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
