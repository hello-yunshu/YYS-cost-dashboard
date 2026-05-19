import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor, getBranchColorLight } from '../../utils/constants';

export default function ConfirmRateChart({ data = [] }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const topBranches = [...data]
      .sort((a, b) => (b.selfOperatedValue || 0) - (a.selfOperatedValue || 0));

    const indicators = [
      { name: '当前利润率', max: 20 },
      { name: '预期利润率', max: 20 },
      { name: '计量确认率', max: 100 },
      { name: '价值确认率', max: 100 },
      { name: '收款率', max: 100 },
    ];

    const seriesData = topBranches.map((d) => {
      const color = getBranchColor(d.branchName);
      return {
        value: [
          (d.currentProfitRate || 0) * 100,
          (d.expectedProfitRate || 0) * 100,
          (d.measurementConfirmRate || 0) * 100,
          (d.valueConfirmRate || 0) * 100,
          (d.collectionRate || 0) * 100,
        ],
        name: d.branchName,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 1.5,
          color,
        },
        itemStyle: {
          color,
        },
        areaStyle: {
          color: getBranchColorLight(d.branchName, 0.04),
        },
      };
    });

    return {
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: (params) => {
          const d = topBranches[params.dataIndex];
          if (!d) return '';
          const names = ['当前利润率', '预期利润率', '计量确认率', '价值确认率', '收款率'];
          const color = getBranchColor(d.branchName);
          let html = `<div style="font-weight:600;margin-bottom:4px">${d.branchName}</div>`;
          params.value.forEach((v, i) => {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color}"></span>
              <span>${names[i]}：</span>
              <span style="font-weight:600">${v.toFixed(2)}%</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        bottom: 8,
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
        center: ['50%', '40%'],
        radius: '55%',
        axisName: {
          color: '#64748b',
          fontSize: 10,
        },
        splitArea: {
          areaStyle: {
            color: isDark
              ? ['rgba(51,65,85,0.3)', 'rgba(51,65,85,0.15)']
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
        emphasis: {
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.2 },
        },
      }],
    };
  }, [data, isDark]);

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
