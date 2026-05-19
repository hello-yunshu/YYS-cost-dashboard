import clsx from 'clsx';
import { formatNumber, formatPercent } from '../../utils/format';

export default function KpiCard({ title, value, unit, trend, type = 'default', precision }) {
  const isPositive = trend !== undefined && trend !== null && trend >= 0;
  const isPercent = unit === '%';

  const displayValue = isPercent
    ? formatPercent(value)
    : precision !== undefined
      ? formatNumber(value)
      : formatNumber(value);

  const valueLen = displayValue.length;
  const sizeClass = valueLen >= 12
    ? 'text-base lg:text-lg'
    : valueLen >= 8
      ? 'text-lg lg:text-xl'
      : 'text-lg lg:text-2xl';

  const colorMap = {
    default: 'from-slate-50 to-white dark:from-slate-800 dark:to-slate-800/50',
    success: 'from-red-50 to-white dark:from-red-900/20 dark:to-slate-800/50',
    warning: 'from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-800/50',
    danger: 'from-emerald-50 to-white dark:from-emerald-900/20 dark:to-slate-800/50',
    accent: 'from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800/50',
  };

  const valueColorMap = {
    default: 'text-slate-900 dark:text-white',
    success: 'text-red-600 dark:text-red-400',
    warning: 'text-amber-600 dark:text-amber-400',
    danger: 'text-emerald-600 dark:text-emerald-400',
    accent: 'text-brand-600 dark:text-brand-400',
  };

  return (
    <div className={clsx(
      'relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/50 bg-gradient-to-br p-3 lg:p-5 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5',
      colorMap[type]
    )}>
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br from-current/5 to-transparent pointer-events-none" />
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] lg:text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 lg:mb-2">
            {title}
          </p>
          <div className="flex items-baseline gap-1 min-w-0">
            <span className={clsx('font-display font-bold tracking-tight min-w-0 shrink', sizeClass, valueColorMap[type])}>
              {displayValue}
            </span>
            {unit && !isPercent && (
              <span className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap shrink-0">{unit}</span>
            )}
          </div>
        </div>
        {trend !== undefined && trend !== null && (
          <div className={clsx(
            'flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-semibold',
            isPositive
              ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
              : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
          )}>
            <svg className={clsx('w-3 h-3', !isPositive && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
            {Math.abs(trend).toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
}
