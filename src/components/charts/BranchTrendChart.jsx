import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor } from '../../utils/constants';
import { getCategoryAxisLabel, getChartGrid } from './axisLayout';

export default function BranchTrendChart({ branchTrends = [], valueKey = 'currentProfitRate', valueFormatter }) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    if (!branchTrends || branchTrends.length === 0) return {};

    const months = (branchTrends[0]?.trend || []).map((t) => {
      const m = t.month;
      return m ? `${parseInt(m.split('-')[1], 10)}月` : m;
    });

    const series = branchTrends.map((branch) => {
      const color = getBranchColor(branch.branchName);
      return {
        name: branch.branchName,
        type: 'line',
        cursor: 'default',
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, color },
        itemStyle: { color },
        emphasis: { lineStyle: { width: 3 } },
        data: (branch.trend || []).map((t) => t[valueKey] ?? null),
      };
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`;
          params.forEach((p) => {
            if (p.value === null || p.value === undefined) return;
            const formatted = valueFormatter ? valueFormatter(p.value) : p.value;
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>
              <span>${p.seriesName}：</span>
              <span style="font-weight:600">${formatted}</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
        itemWidth: 14,
        itemHeight: 3,
        itemGap: 12,
        type: 'scroll',
        pageIconColor: isDark ? '#475569' : '#64748b',
        pageIconInactiveColor: isDark ? '#1e293b' : '#cbd5e1',
        pageTextStyle: { color: isDark ? '#64748b' : '#475569' },
      },
      grid: getChartGrid(months.length, { left: 8, right: 8, top: 32, bottom: 8, compactBottom: 24, crowdedAt: 7 }),
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: getCategoryAxisLabel(isDark, months.length, { rotate: 30, width: 42, crowdedAt: 7 }),
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
          formatter: (v) => {
            if (valueKey.includes('Rate') || valueKey === 'collectionRate' || valueKey === 'measurementConfirmRate' || valueKey === 'valueConfirmRate') {
              return `${(v * 100).toFixed(0)}%`;
            }
            if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
            return `${(v / 1000).toFixed(0)}k`;
          },
        },
        splitLine: {
          lineStyle: { color: isDark ? '#1e293b' : '#e2e8f0', type: 'dashed' },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series,
    };
  }, [branchTrends, valueKey, isDark, valueFormatter]);

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
