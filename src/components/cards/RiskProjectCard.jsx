import clsx from 'clsx';
import { formatPercent } from '../../utils/format';
import { RISK_THRESHOLD } from '../../utils/constants';

export default function RiskProjectCard({ project, onClick, riskThreshold = 0.05 }) {
  const profitRate = project.currentProfitRate;
  const isHighRisk = profitRate < 0;
  const isMediumRisk = profitRate >= 0 && profitRate < riskThreshold;

  const levelConfig = {
    high: {
      label: '高风险',
      className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50',
      dotClass: 'bg-emerald-500',
      cardBorder: 'border-emerald-200 dark:border-emerald-800/30 hover:border-emerald-300 dark:hover:border-emerald-700',
    },
    medium: {
      label: '中风险',
      className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/50',
      dotClass: 'bg-amber-500',
      cardBorder: 'border-amber-200 dark:border-amber-800/30 hover:border-amber-300 dark:hover:border-amber-700',
    },
    low: {
      label: '低风险',
      className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800/50',
      dotClass: 'bg-red-500',
      cardBorder: 'border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600',
    },
  };

  const level = isHighRisk ? 'high' : isMediumRisk ? 'medium' : 'low';
  const config = levelConfig[level];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'card-hover p-4 cursor-pointer border',
        config.cardBorder
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {isHighRisk && (
              <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {project.projectName}
            </h4>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            {project.branchName && (
              <span>{project.branchName}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border', config.className)}>
            <span className={clsx('w-1.5 h-1.5 rounded-full', config.dotClass)} />
            {config.label}
          </span>
          <span className={clsx(
            'text-lg font-display font-bold',
            isHighRisk ? 'text-emerald-600 dark:text-emerald-400' : isMediumRisk ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
          )}>
            {formatPercent(profitRate)}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">当前利润率</span>
        </div>
      </div>
    </div>
  );
}
