import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useDashboardStore from '../../stores/useDashboardStore';
import useSettingsStore from '../../stores/useSettingsStore';
import Loading from '../../components/common/Loading';
import KpiCard from '../../components/cards/KpiCard';
import RiskProjectCard from '../../components/cards/RiskProjectCard';
import ProjectBarChart from '../../components/charts/ProjectBarChart';
import CostTable from '../../components/tables/CostTable';

export default function BranchView() {
  const { id } = useParams();
  const { branchDetail, selectedMonth, loading, fetchBranchDetail } = useDashboardStore();
  const { getRiskThreshold, getAmountUnit } = useSettingsStore();
  const riskThreshold = getRiskThreshold();
  const amountUnit = getAmountUnit();
  const currencyUnit = amountUnit === 'yi' ? '亿元' : amountUnit === 'yuan' ? '元' : '万元';

  useEffect(() => {
    if (id) fetchBranchDetail(id, selectedMonth);
  }, [id, selectedMonth]);

  const branchName = branchDetail?.branch?.name || branchDetail?.summary?.branchName || '分公司详情';

  const kpiCards = useMemo(() => {
    if (!branchDetail) return [];
    const s = branchDetail.summary || branchDetail;
    return [
      {
        title: '当前利润率',
        value: s.currentProfitRate,
        unit: '%',
        type: s.currentProfitRate >= riskThreshold ? 'success' : s.currentProfitRate >= 0 ? 'warning' : 'danger',
        trend: (s.currentProfitRate - (s.expectedProfitRate || 0)) * 100,
      },
      {
        title: '预期利润率',
        value: s.expectedProfitRate,
        unit: '%',
        type: 'accent',
      },
      {
        title: '当前利润',
        value: s.currentProfit,
        unit: currencyUnit,
        type: s.currentProfit >= 0 ? 'success' : 'danger',
      },
      {
        title: '预期利润',
        value: s.expectedProfit,
        unit: currencyUnit,
        type: 'default',
      },
    ];
  }, [branchDetail]);

  const projects = useMemo(() => branchDetail?.projects || [], [branchDetail]);

  const riskProjects = useMemo(
    () => projects.filter((p) => p.currentProfitRate < riskThreshold),
    [projects, riskThreshold]
  );

  const tableColumns = useMemo(() => [
    { key: 'projectName', label: '项目名称' },
    { key: 'currentProfitRate', label: '当前利润率' },
    { key: 'expectedProfitRate', label: '预期利润率' },
    { key: 'currentProfit', label: '当前利润' },
    { key: 'selfOperatedValue', label: '自营产值' },
    { key: 'onSiteExpense', label: '实际成本' },
    { key: 'collectionRate', label: '收款率' },
  ], []);

  if (loading && !branchDetail) return <Loading />;

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg lg:text-xl font-display font-bold text-slate-900 dark:text-white">{branchName}</h1>
          <p className="text-xs lg:text-sm text-slate-500 dark:text-slate-400 mt-0.5 lg:mt-1">
            {selectedMonth ? `${selectedMonth} 月度数据` : '全量数据'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} />
        ))}
      </div>

      <div className="card p-4 md:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">项目利润率对比</h3>
        <div className="h-[300px] md:h-[360px] lg:h-[400px]">
          <ProjectBarChart
            data={projects}
            dataKeys={['currentProfitRate', 'expectedProfitRate']}
            labels={['当前利润率', '预期利润率']}
          />
        </div>
      </div>

      {riskProjects.length > 0 && (
        <div className="card p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">风险项目</h3>
            <span className="badge-warning">{riskProjects.length} 个</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {riskProjects.map((project, idx) => (
              <RiskProjectCard key={idx} project={project} riskThreshold={riskThreshold} />
            ))}
          </div>
        </div>
      )}

      <div className="card p-4 md:p-5">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">项目明细</h3>
        <CostTable columns={tableColumns} data={projects} riskThreshold={riskThreshold} />
      </div>
    </div>
  );
}
