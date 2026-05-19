import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { formatNumber, formatPercent, formatCurrency } from '../../utils/format';
import { FIELD_LABELS, RISK_THRESHOLD } from '../../utils/constants';

export default function CostTable({ columns = [], data = [], onRowClick, highlightKey, riskThreshold = 0.05 }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va === null || va === undefined) return 1;
      if (vb === null || vb === undefined) return -1;
      const diff = typeof va === 'string' ? va.localeCompare(vb, 'zh-CN') : va - vb;
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [data, sortKey, sortDir]);

  const formatCell = (key, value) => {
    if (value === null || value === undefined) return '--';
    if (key.toLowerCase().endsWith('rate')) return formatPercent(value);
    if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('profit')) return formatCurrency(value);
    if (key.toLowerCase().includes('value') || key.toLowerCase().includes('expense')) return formatCurrency(value);
    if (typeof value === 'number') return formatNumber(value);
    return value;
  };

  const getCellClass = (key, value) => {
    if (key === 'currentProfitRate' && value !== null && value !== undefined) {
      if (value < 0) return 'text-emerald-600 dark:text-emerald-400 font-semibold';
      if (value < riskThreshold) return 'text-amber-600 dark:text-amber-400 font-semibold';
      return 'text-red-600 dark:text-red-400 font-semibold';
    }
    return 'text-slate-700 dark:text-slate-200';
  };

  const firstCol = columns[0];
  const restCols = columns.slice(1);

  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={clsx(
                    'px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap',
                    col.sortable !== false && 'cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label || FIELD_LABELS[col.key] || col.key}</span>
                    {sortKey === col.key && (
                      <svg className={clsx('w-3.5 h-3.5 text-brand-500', sortDir === 'desc' && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              sortedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={clsx(
                    'transition-colors duration-150',
                    onRowClick && 'cursor-pointer',
                    rowIdx % 2 === 0
                      ? 'bg-white dark:bg-slate-800/30'
                      : 'bg-slate-50/50 dark:bg-slate-800/10',
                    'hover:bg-brand-50/50 dark:hover:bg-brand-900/10'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={clsx('px-4 py-3 whitespace-nowrap', getCellClass(col.key, row[col.key]))}
                    >
                      {col.render ? col.render(row[col.key], row) : formatCell(col.key, row[col.key])}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-2">
        {sortedData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">暂无数据</div>
        ) : (
          sortedData.map((row, rowIdx) => (
            <div
              key={rowIdx}
              onClick={() => onRowClick?.(row)}
              className={clsx(
                'rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 p-3',
                onRowClick && 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/50'
              )}
            >
              {firstCol && (
                <div className="text-xs font-semibold text-slate-900 dark:text-white mb-2 truncate">
                  {firstCol.render ? firstCol.render(row[firstCol.key], row) : (row[firstCol.key] ?? '--')}
                </div>
              )}
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {restCols.map((col) => (
                  <div key={col.key} className="flex flex-col">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {col.label || FIELD_LABELS[col.key] || col.key}
                    </span>
                    <span className={clsx('text-xs mt-0.5', getCellClass(col.key, row[col.key]))}>
                      {col.render ? col.render(row[col.key], row) : formatCell(col.key, row[col.key])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
