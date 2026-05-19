import { useEffect } from 'react';
import useDashboardStore from '../../stores/useDashboardStore';

export default function MonthSelector() {
  const { months, selectedMonth, fetchMonths, setSelectedMonth } = useDashboardStore();

  useEffect(() => {
    fetchMonths();
  }, []);

  return (
    <div className="relative">
      <select
        value={selectedMonth || ''}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 font-medium cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
      >
        {months.length === 0 && (
          <option value="">暂无数据</option>
        )}
        {months.map((month) => (
          <option key={month} value={month}>{month}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}
