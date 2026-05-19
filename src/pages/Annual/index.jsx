import { useEffect, useMemo, useState } from 'react';
import useDashboardStore from '../../stores/useDashboardStore';
import useSettingsStore from '../../stores/useSettingsStore';
import KpiCard from '../../components/cards/KpiCard';
import ProfitTrendChart from '../../components/charts/ProfitTrendChart';
import ProfitAmountTrendChart from '../../components/charts/ProfitAmountTrendChart';
import BranchTrendChart from '../../components/charts/BranchTrendChart';
import RevenueCostTrendChart from '../../components/charts/RevenueCostTrendChart';
import CollectionTrendChart from '../../components/charts/CollectionTrendChart';
import CostCompositionChart from '../../components/charts/CostCompositionChart';
import BranchRadarChart from '../../components/charts/BranchRadarChart';
import BranchScatterChart from '../../components/charts/BranchScatterChart';
import Loading from '../../components/common/Loading';
import { formatPercent, formatCurrency } from '../../utils/format';

export default function Annual() {
  const { annualData, selectedYear, annualLoading, fetchAnnualData, fetchMonths, months } = useDashboardStore();
  const { getRiskThreshold } = useSettingsStore();
  const riskThreshold = getRiskThreshold();
  const [branchTab, setBranchTab] = useState('profitRate');
  const [costTab, setCostTab] = useState('revenue');
  const [analysisTab, setAnalysisTab] = useState('radar');

  useEffect(() => {
    fetchMonths();
  }, []);

  useEffect(() => {
    fetchAnnualData(selectedYear);
  }, [selectedYear]);

  const monthlyData = useMemo(() => annualData?.monthlyData || [], [annualData]);
  const branchTrends = useMemo(() => annualData?.branchTrends || [], [annualData]);

  const yearSummary = useMemo(() => {
    if (monthlyData.length === 0) return null;
    const first = monthlyData[0].company;
    const last = monthlyData[monthlyData.length - 1].company;
    const latestMonth = monthlyData[monthlyData.length - 1].month;
    const profitRateChange = last.currentProfitRate - first.currentProfitRate;
    const profitChange = last.currentProfit - first.currentProfit;
    const profitChangePercent = first.currentProfit !== 0
      ? (profitChange / Math.abs(first.currentProfit)) * 100
      : null;
    return {
      currentProfitRate: last.currentProfitRate,
      expectedProfitRate: last.expectedProfitRate,
      currentProfit: last.currentProfit,
      expectedProfit: last.expectedProfit,
      profitRateChange,
      profitChange,
      profitChangePercent,
      latestMonth,
      firstMonth: monthlyData[0].month,
    };
  }, [monthlyData]);

  const kpiCards = useMemo(() => {
    if (!yearSummary) return [];
    return [
      {
        title: '当前利润率',
        value: yearSummary.currentProfitRate,
        unit: '%',
        type: yearSummary.currentProfitRate >= riskThreshold ? 'success' : yearSummary.currentProfitRate >= 0 ? 'warning' : 'danger',
        trend: yearSummary.profitRateChange * 100,
      },
      {
        title: '预期利润率',
        value: yearSummary.expectedProfitRate,
        unit: '%',
        type: 'accent',
      },
      {
        title: '当前利润',
        value: yearSummary.currentProfit,
        unit: '万元',
        type: yearSummary.currentProfit >= 0 ? 'success' : 'danger',
        trend: yearSummary.profitChangePercent,
      },
      {
        title: '预期利润',
        value: yearSummary.expectedProfit,
        unit: '万元',
        type: 'default',
      },
    ];
  }, [yearSummary]);

  const branchTabs = useMemo(() => [
    { key: 'profitRate', label: '利润率' },
    { key: 'profit', label: '利润额' },
  ], []);

  const costTabs = useMemo(() => [
    { key: 'revenue', label: '产值与成本' },
    { key: 'collection', label: '收款情况' },
    { key: 'composition', label: '成本构成' },
  ], []);

  const analysisTabs = useMemo(() => [
    { key: 'radar', label: '综合对比' },
    { key: 'scatter', label: '产值-利润率' },
  ], []);

  if (annualLoading && !annualData) return <Loading />;

  if (!annualData || monthlyData.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-lg lg:text-xl font-display font-bold text-slate-900 dark:text-white">年度看板</h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 lg:mt-1">
            {selectedYear} 年暂无数据
          </p>
        </div>
        <div className="card p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm text-slate-500 dark:text-slate-400">{selectedYear} 年没有可用数据，请先导入月度数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg lg:text-xl font-display font-bold text-slate-900 dark:text-white">年度看板</h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 lg:mt-1">
            {selectedYear} 年度数据 · {monthlyData.length} 个月 · {yearSummary?.firstMonth} 至 {yearSummary?.latestMonth}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">利润率月度趋势</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">全公司汇总</span>
        </div>
        <div className="h-[280px] md:h-[320px] lg:h-[360px]">
          <ProfitTrendChart monthlyData={monthlyData} />
        </div>
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">利润额月度趋势</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">全公司汇总</span>
        </div>
        <div className="h-[280px] md:h-[320px] lg:h-[360px]">
          <ProfitAmountTrendChart monthlyData={monthlyData} />
        </div>
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">分公司趋势</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">各分公司月度变化</span>
        </div>
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {branchTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBranchTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                branchTab === tab.key
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-[280px] md:h-[320px] lg:h-[360px]">
          {branchTab === 'profitRate' && (
            <BranchTrendChart
              branchTrends={branchTrends}
              valueKey="currentProfitRate"
              valueFormatter={(v) => `${(v * 100).toFixed(2)}%`}
            />
          )}
          {branchTab === 'profit' && (
            <BranchTrendChart
              branchTrends={branchTrends}
              valueKey="currentProfit"
              valueFormatter={(v) => formatCurrency(v)}
            />
          )}
        </div>
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">产值与成本</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">收入、成本与收款分析</span>
        </div>
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {costTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setCostTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                costTab === tab.key
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-[280px] md:h-[320px] lg:h-[360px]">
          {costTab === 'revenue' && (
            <RevenueCostTrendChart monthlyData={monthlyData} />
          )}
          {costTab === 'collection' && (
            <CollectionTrendChart monthlyData={monthlyData} />
          )}
          {costTab === 'composition' && (
            <CostCompositionChart
              monthlyData={monthlyData}
              selectedMonth={monthlyData[monthlyData.length - 1]?.month}
            />
          )}
        </div>
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">综合分析</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">分公司多维度对比</span>
        </div>
        <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
          {analysisTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setAnalysisTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                analysisTab === tab.key
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="h-[280px] md:h-[320px] lg:h-[360px]">
          {analysisTab === 'radar' && (
            <BranchRadarChart monthlyData={monthlyData} />
          )}
          {analysisTab === 'scatter' && (
            <BranchScatterChart monthlyData={monthlyData} riskThreshold={riskThreshold} />
          )}
        </div>
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">月度数据对比</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">各月关键指标一览</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">月份</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">当前利润率</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">预期利润率</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">当前利润</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">预期利润</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">自营产值</th>
                <th className="text-right py-2.5 px-3 text-xs font-medium text-slate-500 dark:text-slate-400">收款率</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((d) => {
                const c = d.company || {};
                return (
                  <tr key={d.month} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">{d.month ? `${parseInt(d.month.split('-')[1], 10)}月` : d.month}</td>
                    <td className={`py-2.5 px-3 text-right font-medium ${c.currentProfitRate >= riskThreshold ? 'text-red-600 dark:text-red-400' : c.currentProfitRate >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatPercent(c.currentProfitRate)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {formatPercent(c.expectedProfitRate)}
                    </td>
                    <td className={`py-2.5 px-3 text-right ${c.currentProfit >= 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {formatCurrency(c.currentProfit)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(c.expectedProfit)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {formatCurrency(c.selfOperatedValue)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                      {formatPercent(c.collectionRate)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
