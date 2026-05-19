import clsx from 'clsx';

export default function RankCard({ rank, name, value, unit, subtitle }) {
  const isTop3 = rank <= 3;

  const medalColors = {
    1: 'from-amber-400 to-amber-500 text-white shadow-amber-400/30',
    2: 'from-slate-300 to-slate-400 text-white shadow-slate-400/20',
    3: 'from-amber-600 to-amber-700 text-white shadow-amber-600/20',
  };

  return (
    <div className={clsx(
      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
      isTop3
        ? 'bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/50 dark:to-transparent hover:from-slate-100 dark:hover:from-slate-800'
        : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
    )}>
      <div className={clsx(
        'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold',
        isTop3
          ? `bg-gradient-to-br ${medalColors[rank]} shadow-md`
          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
      )}>
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{name}</p>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className={clsx(
          'text-sm font-display font-bold',
          isTop3 ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'
        )}>
          {typeof value === 'number' ? value.toLocaleString('zh-CN', { maximumFractionDigits: 2 }) : value}
        </span>
        {unit && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{unit}</span>
        )}
      </div>
    </div>
  );
}
