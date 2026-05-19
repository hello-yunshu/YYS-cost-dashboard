import { useState, useRef, useCallback } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import useDashboardStore from '../../stores/useDashboardStore';

export default function DataImport() {
  const { selectedMonth, fetchMonths } = useDashboardStore();
  const [file, setFile] = useState(null);
  const [importMonth, setImportMonth] = useState('');
  const [availableMonths, setAvailableMonths] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const [importingAll, setImportingAll] = useState(false);
  const inputRef = useRef(null);

  const handleFile = useCallback(async (f) => {
    if (!f) return;
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(f.type) && !f.name.match(/\.(xlsx?|xls)$/i)) {
      setResult({ type: 'error', message: '请上传 Excel 文件（.xlsx 或 .xls）' });
      return;
    }
    setFile(f);
    setResult(null);
    setPreview(null);
    setPreviewId(null);
    setImportMonth('');
    setAvailableMonths([]);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', f);

    try {
      const { data } = await axios.post('/api/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });

      if (data.success) {
        const d = data.data;
        setPreviewId(d.previewId);
        setPreview({
          filename: d.filename,
          fileSize: d.fileSize,
          branchCount: d.branchCount,
          projectCount: d.projectCount,
          validation: d.validation,
        });
        const months = d.availableMonths || [];
        setAvailableMonths(months);
        if (months.length > 0) {
          const defaultMonth = selectedMonth && months.includes(selectedMonth) ? selectedMonth : months[0];
          setImportMonth(defaultMonth);
        }
      }
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || err.response?.data?.error || '上传失败' });
      setFile(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [selectedMonth]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleConfirm = async () => {
    if (!previewId || !importMonth) {
      setResult({ type: 'error', message: '请选择导入月份' });
      return;
    }
    setUploading(true);

    try {
      const { data } = await axios.post('/api/import/confirm', {
        previewId,
        yearMonth: importMonth,
      });

      if (data.success) {
        setResult({ type: 'success', message: `成功导入 ${(data.data?.rowCount || 0)} 条数据至 ${importMonth}` });
        fetchMonths();
        const remaining = availableMonths.filter((m) => m !== importMonth);
        if (remaining.length === 0) {
          setFile(null);
          setPreview(null);
          setPreviewId(null);
          setImportMonth('');
          setAvailableMonths([]);
          if (inputRef.current) inputRef.current.value = '';
        } else {
          setAvailableMonths(remaining);
          setImportMonth(remaining[0]);
        }
      }
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || err.response?.data?.error || err.message || '导入失败' });
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmAll = async () => {
    if (!previewId || availableMonths.length === 0) {
      setResult({ type: 'error', message: '没有可导入的月份' });
      return;
    }
    setImportingAll(true);

    try {
      const { data } = await axios.post('/api/import/confirm-all', { previewId });

      if (data.success) {
        const d = data.data;
        const failedMonths = d.months.filter((m) => !m.success);
        if (failedMonths.length === 0) {
          setResult({ type: 'success', message: `全部导入成功：${d.totalMonths} 个月份，共 ${d.totalRows} 条数据` });
        } else {
          setResult({
            type: failedMonths.length === d.totalMonths ? 'error' : 'success',
            message: `${d.totalMonths - failedMonths.length}/${d.totalMonths} 个月份导入成功，共 ${d.totalRows} 条数据。失败：${failedMonths.map((m) => m.yearMonth).join('、')}`,
          });
        }
        setFile(null);
        setPreview(null);
        setPreviewId(null);
        setImportMonth('');
        setAvailableMonths([]);
        if (inputRef.current) inputRef.current.value = '';
        fetchMonths();
      }
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.message || err.response?.data?.error || err.message || '批量导入失败' });
    } finally {
      setImportingAll(false);
    }
  };

  const handleCancel = () => {
    if (previewId) {
      axios.post('/api/import/cancel', { previewId }).catch(() => {});
    }
    setFile(null);
    setPreview(null);
    setPreviewId(null);
    setResult(null);
    setImportMonth('');
    setAvailableMonths([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="card p-4 lg:p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">上传数据文件</h3>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={clsx(
            'relative flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300',
            dragOver
              ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/10'
              : file
                ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-700 dark:bg-emerald-900/10'
                : 'border-slate-300 dark:border-slate-600 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <>
              <svg className="w-10 h-10 text-emerald-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-slate-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {(file.size / 1024).toFixed(1)} KB · 点击更换文件
              </p>
            </>
          ) : (
            <>
              <svg className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">拖拽文件到此处，或点击选择</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">支持 .xlsx、.xls 格式，每个 Sheet 代表一个月的数据</p>
            </>
          )}
        </div>

        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
              <span>处理中...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {result && (
          <div className={clsx(
            'mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2',
            result.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
              : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
          )}>
            {result.type === 'success' ? (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {result.message}
          </div>
        )}

        {preview && (
          <div className="mt-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">数据预览</span>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:gap-4 text-center">
              <div>
                <p className="text-lg lg:text-2xl font-bold text-brand-600 dark:text-brand-400">{preview.branchCount}</p>
                <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400">分公司</p>
              </div>
              <div>
                <p className="text-lg lg:text-2xl font-bold text-brand-600 dark:text-brand-400">{preview.projectCount}</p>
                <p className="text-[10px] lg:text-xs text-slate-500 dark:text-slate-400">项目</p>
              </div>
              <div>
                <p className="text-lg lg:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {preview.validation?.valid ? '✓' : '⚠'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {preview.validation?.valid ? '验证通过' : `${preview.validation?.errors?.length || 0} 个错误`}
                </p>
              </div>
            </div>
            {availableMonths.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 dark:text-slate-400">检测到月份：</span>
                {availableMonths.map((m) => (
                  <span key={m} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
                    {m}
                  </span>
                ))}
              </div>
            )}
            {preview.validation?.warnings?.length > 0 && (
              <div className="mt-3 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                {preview.validation.warnings.map((w, i) => (
                  <p key={i}>⚠ {w}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {file && !uploading && (
          <div className="mt-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <svg className="w-4 h-4 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">选择导入月份</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">数据将导入至所选月份</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {availableMonths.length > 0 ? (
                <select
                  value={importMonth}
                  onChange={(e) => setImportMonth(e.target.value)}
                  className="input max-w-xs"
                >
                  <option value="" disabled>请选择月份</option>
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="month"
                  value={importMonth}
                  onChange={(e) => setImportMonth(e.target.value)}
                  className="input max-w-xs"
                />
              )}
              {importMonth && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  数据将覆盖该月份已有记录
                </span>
              )}
            </div>
          </div>
        )}

        {file && !uploading && (
          <div className="flex items-center gap-3 mt-5">
            <button
              onClick={handleConfirm}
              disabled={!importMonth || importingAll}
              className={clsx(
                'btn-primary',
                (!importMonth || importingAll) && 'opacity-50 cursor-not-allowed'
              )}
            >
              确认导入
            </button>
            {availableMonths.length > 1 && (
              <button
                onClick={handleConfirmAll}
                disabled={importingAll}
                className={clsx(
                  'btn-primary bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600',
                  importingAll && 'opacity-50 cursor-not-allowed'
                )}
              >
                {importingAll ? '导入中...' : `全部导入（${availableMonths.length} 个月份）`}
              </button>
            )}
            <button onClick={handleCancel} className="btn-secondary" disabled={importingAll}>
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
