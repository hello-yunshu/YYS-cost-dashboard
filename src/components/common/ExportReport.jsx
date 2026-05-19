import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useDashboardStore from '../../stores/useDashboardStore';
import { generateMonthlyReport, generateAnnualReport } from '../../utils/reportGenerator';

const STEPS = [
  '加载字体...',
  '获取数据...',
  '渲染图表...',
  '生成PDF...',
];

export default function ExportReport({ isAnnualPage }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const { overview, selectedMonth, annualData, selectedYear } = useDashboardStore();

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      setProgress(0);

      if (isAnnualPage) {
        if (!annualData) {
          throw new Error('暂无年度数据，请先选择年份并等待数据加载');
        }
        setProgress(1);
        await generateAnnualReport(annualData, selectedYear);
      } else {
        if (!overview) {
          throw new Error('暂无月度数据，请先选择月份并等待数据加载');
        }
        setProgress(1);
        await generateMonthlyReport(overview, selectedMonth);
      }

      setProgress(3);
      setOpen(false);
    } catch (err) {
      console.error('导出报告失败:', err);
      setError(err.message || '导出失败，请重试');
    } finally {
      setLoading(false);
      setProgress(0);
    }
  }, [isAnnualPage, overview, selectedMonth, annualData, selectedYear]);

  const reportType = isAnnualPage ? '年度报告' : '月度报告';
  const timeLabel = isAnnualPage ? `${selectedYear} 年` : (selectedMonth || '全量');

  const modal = open ? (
    <div
      className="fixed inset-0 z-[100] grid min-h-dvh place-items-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={() => !loading && setOpen(false)}
    >
      <div
        className="w-full max-w-[380px] rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {!loading && !error && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">导出报告</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6 space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-700/50">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-500/10">
                  <svg className="h-5 w-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">{reportType}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">数据期间：{timeLabel}</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleExport}
              className="w-full rounded-xl bg-brand-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
            >
              生成并下载 PDF
            </button>
          </>
        )}

        {loading && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-3 border-brand-200 border-t-brand-500" />
            <div className="mb-1 text-sm font-medium text-slate-900 dark:text-white">正在生成报告</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{STEPS[Math.min(progress, STEPS.length - 1)]}</div>
          </div>
        )}

        {error && !loading && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mb-1 text-sm font-medium text-slate-900 dark:text-white">导出失败</div>
            <div className="mb-4 text-xs text-slate-500 dark:text-slate-400">{error}</div>
            <div className="flex gap-3">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
              >
                关闭
              </button>
              <button
                onClick={handleExport}
                className="flex-1 rounded-xl bg-brand-500 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600"
              >
                重试
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); }}
        className="flex items-center gap-1.5 pl-3 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 font-medium cursor-pointer hover:border-brand-400 dark:hover:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>导出报告</span>
      </button>

      {modal ? createPortal(modal, document.body) : null}
    </>
  );
}
