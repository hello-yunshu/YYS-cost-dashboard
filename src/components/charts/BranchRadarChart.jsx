import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor, getBranchColorLight } from '../../utils/constants';

export default function BranchRadarChart({ monthlyData = [] }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    if (monthlyData.length === 0) return {};

    const latest = monthlyData[monthlyData.length - 1];
    if (!latest?.branches || latest.branches.length === 0) return {};

    const branches = latest.branches.filter((b) =>
      (b.selfOperatedValue || 0) > 0
    );
    if (branches.length === 0) return {};

    const indicators = [
      { name: '当前利润率', max: 20 },
      { name: '预期利润率', max: 20 },
      { name: '收款率', max: 100 },
      { name: '计量确认率', max: 100 },
      { name: '价值确认率', max: 100 },
    ];

    const seriesData = branches.map((b) => {
      const color = getBranchColor(b.branchName);
      return {
        value: [
          (b.currentProfitRate || 0) * 100,
          (b.expectedProfitRate || 0) * 100,
          (b.collectionRate || 0) * 100,
          (b.measurementConfirmRate || 0) * 100,
          (b.valueConfirmRate || 0) * 100,
        ],
        name: b.branchName,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { width: 1.5, color },
        itemStyle: { color },
        areaStyle: { color: getBranchColorLight(b.branchName, 0.06) },
      };
    });

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: (params) => {
          const names = indicators.map((i) => i.name);
          const vals = params.value;
          let html = `<div style="font-weight:600;margin-bottom:4px">${params.name}</div>`;
          names.forEach((name, idx) => {
            const unit = name.includes('利润率') || name.includes('收款率') || name.includes('确认率') ? '%' : '万元';
            html += `<div style="margin:2px 0">${name}：<span style="font-weight:600">${(vals[idx] || 0).toFixed(1)}${unit}</span></div>`;
          });
          return html;
        },
      },
      legend: {
        bottom: '6%',
        textStyle: { color: '#64748b', fontSize: 11 },
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 12,
        type: 'scroll',
        pageIconColor: isDark ? '#475569' : '#64748b',
        pageIconInactiveColor: isDark ? '#334155' : '#cbd5e1',
        pageTextStyle: { color: isDark ? '#64748b' : '#475569' },
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        center: ['50%', '44%'],
        radius: '55%',
        axisName: {
          color: '#64748b',
          fontSize: 11,
        },
        splitArea: {
          areaStyle: {
            color: isDark
              ? ['rgba(51,65,85,0.6)', 'rgba(51,65,85,0.3)']
              : ['rgba(226,232,240,0.6)', 'rgba(226,232,240,0.3)'],
          },
        },
        axisLine: {
          lineStyle: { color: isDark ? '#475569' : '#cbd5e1' },
        },
        splitLine: {
          lineStyle: { color: isDark ? '#475569' : '#cbd5e1' },
        },
      },
      series: [{
        type: 'radar',
        cursor: 'default',
        data: seriesData,
      }],
    };
  }, [monthlyData, isDark]);

  return (
    <div className="chart-container">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
