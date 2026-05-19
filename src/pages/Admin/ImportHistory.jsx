import { useEffect, useState } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import dayjs from 'dayjs';

export default function ImportHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchHistory = () => {
    setLoading(true);
    axios.get('/api/import/history')
      .then(({ data }) => {
        setRecords(data.data || data || []);
      })
      .catch(() => {
        setRecords([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这条导入记录吗？')) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/import/${id}`);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert('删除失败，请重试');
    } finally {
      setDeleting(null);
    }
  };

  const statusConfig = {
    success: { label: '成功', className: 'badge-success' },
    failed: { label: '失败', className: 'badge-danger' },
    processing: { label: '导入中', className: 'badge-info' },
  };

  const getStatus = (status) => statusConfig[status] || { label: '未知', className: 'badge-warning' };

  const DeleteButton = ({ id, yearMonth }) => (
    <button
      onClick={() => handleDelete(id)}
      disabled={deleting === id}
      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-40 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
      {deleting === id ? '删除中' : '删除'}
    </button>
  );

  return (
    <div className="card p-4 lg:p-6">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">导入历史</h3>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700" />
            <div className="absolute inset-0 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          </div>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-slate-500 dark:text-slate-400">
          <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-sm font-medium">暂无导入记录</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">文件名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">导入时间</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">状态</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">数据行数</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">月份</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30">
                {records.map((record, idx) => {
                  const status = getStatus(record.status);
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{record.filename || '--'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                        {record.importedAt ? dayjs(record.importedAt).format('YYYY-MM-DD HH:mm') : '--'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={status.className}>{status.label}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-200 font-mono">
                        {record.rowCount ?? '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{record.yearMonth || '--'}</td>
                      <td className="px-4 py-3 text-center">
                        <DeleteButton id={record.id} yearMonth={record.yearMonth} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-2">
            {records.map((record, idx) => {
              const status = getStatus(record.status);
              return (
                <div key={idx} className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/30 p-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-900 dark:text-white truncate">{record.filename || '--'}</span>
                    <span className={status.className}>{status.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-slate-500 dark:text-slate-400">导入时间</span>
                      <span className="text-slate-600 dark:text-slate-300">
                        {record.importedAt ? dayjs(record.importedAt).format('MM-DD HH:mm') : '--'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 dark:text-slate-400">月份</span>
                      <span className="text-slate-600 dark:text-slate-300">{record.yearMonth || '--'}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-500 dark:text-slate-400">数据行数</span>
                      <span className="text-slate-600 dark:text-slate-300 font-mono">{record.rowCount ?? '--'}</span>
                    </div>
                    <div className="flex items-end">
                      <DeleteButton id={record.id} yearMonth={record.yearMonth} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
