import { useState, useEffect, useRef } from 'react';
import useThemeStore from '../../stores/useThemeStore';
import useSettingsStore from '../../stores/useSettingsStore';

export default function Settings() {
  const { theme, setTheme } = useThemeStore();
  const { settings, fetchSettings, saveSettings, loading } = useSettingsStore();
  const [riskThreshold, setRiskThreshold] = useState(String(settings.riskThreshold));
  const [amountUnit, setAmountUnit] = useState(settings.amountUnit);
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    fetchSettings();
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setRiskThreshold(String(settings.riskThreshold));
    setAmountUnit(settings.amountUnit);
  }, [settings]);

  const handleSave = async () => {
    const result = await saveSettings({
      riskThreshold: Number(riskThreshold),
      amountUnit,
    });
    if (result) {
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card p-4 lg:p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 lg:mb-6">显示设置</h3>

        <div className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">主题模式</label>
            <div className="flex items-center gap-2">
              {[
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
                { value: 'system', label: '跟随系统' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    theme === opt.value
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">风险利润率阈值（%）</label>
            <input
              type="number"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(e.target.value)}
              className="input max-w-xs"
              step="0.5"
              min="0"
              max="100"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">利润率低于此阈值的项目将被标记为风险项目</p>
          </div>
        </div>
      </div>

      <div className="card p-4 lg:p-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 lg:mb-6">数据设置</h3>
        <div className="space-y-5 max-w-lg">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">金额单位</label>
            <select
              className="input max-w-xs"
              value={amountUnit}
              onChange={(e) => setAmountUnit(e.target.value)}
            >
              <option value="wan">万元</option>
              <option value="yi">亿元</option>
              <option value="yuan">元</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={loading} className="btn-primary disabled:opacity-50">
          保存设置
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-fade-in">
            设置已保存
          </span>
        )}
      </div>
    </div>
  );
}
