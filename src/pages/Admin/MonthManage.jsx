import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function MonthManage() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [deletingYear, setDeletingYear] = useState(null);
  const [message, setMessage] = useState(null);
  const msgTimerRef = useRef(null);

  const fetchMonths = () => {
    setLoading(true);
    axios.get('/api/months')
      .then(({ data }) => setMonths(data.data || []))
      .catch(() => setMonths([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMonths();
    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    msgTimerRef.current = setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteMonth = async (yearMonth) => {
    if (!window.confirm(`确定要删除 ${yearMonth} 的全部数据吗？此操作不可恢复！`)) return;
    setDeleting(yearMonth);
    try {
      await axios.delete(`/api/months/${yearMonth}`);
      setMonths((prev) => prev.filter((m) => m.yearMonth !== yearMonth));
      showMessage('success', `已删除 ${yearMonth} 的数据`);
    } catch {
      showMessage('error', '删除失败，请重试');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteYear = async (year) => {
    const yearMonths = months.filter((m) => m.yearMonth.startsWith(`${year}-`));
    const totalProjects = yearMonths.reduce((sum, m) => sum + (m.projectCount || 0), 0);
    if (!window.confirm(`确定要删除 ${year} 年全部数据吗？\n共 ${yearMonths.length} 个月份、${totalProjects} 条记录，此操作不可恢复！`)) return;
    setDeletingYear(year);
    try {
      const { data } = await axios.delete(`/api/months/year/${year}`);
      setMonths((prev) => prev.filter((m) => !m.yearMonth.startsWith(`${year}-`)));
      showMessage('success', data.message || `已删除 ${year} 年数据`);
    } catch (err) {
      showMessage('error', err.response?.data?.message || '删除失败，请重试');
    } finally {
      setDeletingYear(null);
    }
  };

  const years = [...new Set(months.map((m) => m.yearMonth.split('-')[0]))].sort().reverse();
  const getYearStats = (year) => {
    const yearMonths = months.filter((m) => m.yearMonth.startsWith(`${year}-`));
    return {
      monthCount: yearMonths.length,
      projectCount: yearMonths.reduce((sum, m) => sum + (m.projectCount || 0), 0),
    };
  };

  const DeleteButton = ({ yearMonth }) => (
    <button
      onClick={() => handleDeleteMonth(yearMonth)}
      disabled={deleting === yearMonth}
      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-40 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {deleting === yearMonth ? '删除中' : '删除'}
    </button>
  );

  return (
    <div className="card p-4 lg:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">月份数据管理</h3>
        <button
          onClick={fetchMonths}
          className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
        >
          刷新
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
        }`}>
          {message.type === 'success' ? (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-0 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        </div>
      ) : months.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-500 dark:text-slate-400">
          <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-medium">暂无月份数据</p>
          <p className="text-xs mt-1">请先在「数据导入」中上传并确认导入</p>
        </div>
      ) : (
        <>
          {years.length > 1 && (
            <div className="mb-5 p-4 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">按年删除</span>
                <span className="text-xs text-red-500/70 dark:text-red-400/50">删除整年数据，不可恢复</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {years.map((year) => {
                  const stats = getYearStats(year);
                  return (
                    <button
                      key={year}
                      onClick={() => handleDeleteYear(year)}
                      disabled={deletingYear === year}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {deletingYear === year ? '删除中...' : `${year} 年（${stats.monthCount} 月 / ${stats.projectCount} 条）`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">月份</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">项目数</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">已填报</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {months.map((m) => (
                  <tr key={m.yearMonth} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{m.yearMonth}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200 font-mono">{m.projectCount}</td>
                    <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200 font-mono">{m.filledCount}</td>
                    <td className="px-4 py-3 text-center">
                      <DeleteButton yearMonth={m.yearMonth} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {months.map((m) => (
              <div key={m.yearMonth} className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{m.yearMonth}</span>
                  <DeleteButton yearMonth={m.yearMonth} />
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                  <div className="flex flex-col">
                    <span className="text-slate-500 dark:text-slate-400">项目数</span>
                    <span className="text-slate-600 dark:text-slate-300 font-mono">{m.projectCount}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 dark:text-slate-400">已填报</span>
                    <span className="text-slate-600 dark:text-slate-300 font-mono">{m.filledCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
