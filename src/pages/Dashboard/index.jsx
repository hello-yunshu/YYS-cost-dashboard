import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardStore from '../../stores/useDashboardStore';
import useSettingsStore from '../../stores/useSettingsStore';
import KpiCard from '../../components/cards/KpiCard';
import RankCard from '../../components/cards/RankCard';
import ProfitRateChart from '../../components/charts/ProfitRateChart';
import ProfitAmountChart from '../../components/charts/ProfitAmountChart';
import CollectionChart from '../../components/charts/CollectionChart';
import ConfirmRateChart from '../../components/charts/ConfirmRateChart';
import ExpenseChart from '../../components/charts/ExpenseChart';
import CostDonutChart from '../../components/charts/CostDonutChart';
import CostTable from '../../components/tables/CostTable';
import Loading from '../../components/common/Loading';
import { formatPercent } from '../../utils/format';

export default function Dashboard() {
  const navigate = useNavigate();
  const { overview, selectedMonth, loading, fetchOverview, fetchMonths } = useDashboardStore();
  const { getRiskThreshold } = useSettingsStore();
  const riskThreshold = getRiskThreshold();

  useEffect(() => {
    const init = async () => {
      const months = await fetchMonths();
      const monthToUse = selectedMonth && months.includes(selectedMonth) ? selectedMonth : months[0];
      if (monthToUse) fetchOverview(monthToUse);
    };
    init();
  }, [selectedMonth]);

  const kpiCards = useMemo(() => {
    if (!overview) return [];
    const summary = overview.company || overview.summary || overview;
    return [
      {
        title: '当前利润率',
        value: summary.currentProfitRate,
        unit: '%',
        type: summary.currentProfitRate >= riskThreshold ? 'success' : summary.currentProfitRate >= 0 ? 'warning' : 'danger',
        trend: (summary.currentProfitRate - (summary.expectedProfitRate || 0)) * 100,
      },
      {
        title: '预期利润率',
        value: summary.expectedProfitRate,
        unit: '%',
        type: 'accent',
      },
      {
        title: '当前利润',
        value: summary.currentProfit,
        unit: '万元',
        type: summary.currentProfit >= 0 ? 'success' : 'danger',
      },
      {
        title: '预期利润',
        value: summary.expectedProfit,
        unit: '万元',
        type: 'default',
      },
    ];
  }, [overview]);

  const branches = useMemo(() => overview?.branches || [], [overview]);

  const profitRateRanking = useMemo(() =>
    [...branches]
      .sort((a, b) => (b.currentProfitRate || 0) - (a.currentProfitRate || 0))
      .map((b, i) => ({
        rank: i + 1,
        name: b.branchName,
        value: formatPercent(b.currentProfitRate),
      })),
    [branches]
  );

  const tableColumns = useMemo(() => [
    { key: 'branchName', label: '分公司' },
    { key: 'currentProfitRate', label: '当前利润率' },
    { key: 'expectedProfitRate', label: '预期利润率' },
    { key: 'currentProfit', label: '当前利润' },
    { key: 'expectedProfit', label: '预期利润' },
    { key: 'selfOperatedValue', label: '自营产值' },
    { key: 'collectionRate', label: '收款率' },
  ], []);

  const handleBranchClick = (branch) => {
    if (branch.id || branch.branchId) {
      navigate(`/branch/${branch.id || branch.branchId}`);
    }
  };

  if (loading && !overview) return <Loading />;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg lg:text-xl font-display font-bold text-slate-900 dark:text-white">月度看板</h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 lg:mt-1">
            {selectedMonth ? `${selectedMonth} 月度数据` : '全量数据概览'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">利润率对比</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">点击条形查看详情</span>
          </div>
          <div className="h-[280px] md:h-[320px] lg:h-[360px]">
            <ProfitRateChart data={branches} onBranchClick={handleBranchClick} riskThreshold={riskThreshold} />
          </div>
        </div>
        <div className="card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">利润额对比</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">点击条形查看详情</span>
          </div>
          <div className="h-[280px] md:h-[320px] lg:h-[360px]">
            <ProfitAmountChart data={branches} onBranchClick={handleBranchClick} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <div className="card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">收款率</h3>
          <div className="h-[280px] md:h-[300px] lg:h-[320px]">
            <CollectionChart data={branches} />
          </div>
        </div>
        <div className="card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">综合评价</h3>
          <div className="h-[280px] md:h-[300px] lg:h-[320px]">
            <ConfirmRateChart data={branches} />
          </div>
        </div>
        <div className="card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">产值与经费</h3>
          <div className="h-[280px] md:h-[300px] lg:h-[320px]">
            <ExpenseChart data={branches} />
          </div>
        </div>
        {profitRateRanking.length > 0 && (
          <div className="card p-4 md:p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">利润率排名</h3>
            <div>
              {profitRateRanking.map((item) => (
                <RankCard key={item.rank} {...item} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-4 md:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">成本构成</h3>
        <div className="h-[280px] md:h-[320px] lg:h-[340px]">
          <CostDonutChart data={branches} />
        </div>
      </div>

      <div className="card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">分公司汇总</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">点击行查看详情</span>
        </div>
        <CostTable
          columns={tableColumns}
          data={branches}
          onRowClick={handleBranchClick}
          riskThreshold={riskThreshold}
        />
      </div>
    </div>
  );
}
