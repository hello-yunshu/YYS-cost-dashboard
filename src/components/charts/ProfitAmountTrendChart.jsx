import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { CHART_COLORS } from '../../utils/constants';
import { getCategoryAxisLabel, getChartGrid } from './axisLayout';

export default function ProfitAmountTrendChart({ monthlyData = [] }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return {};
    const months = monthlyData.map((d) => {
      const m = d.month;
      return m ? `${parseInt(m.split('-')[1], 10)}月` : m;
    });
    const currentProfits = monthlyData.map((d) => d.company?.currentProfit ?? null);
    const expectedProfits = monthlyData.map((d) => d.company?.expectedProfit ?? null);

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
            const val = Math.abs(p.value) >= 10000
              ? `${(p.value / 10000).toFixed(2)} 亿元`
              : `${(p.value || 0).toFixed(2)} 万元`;
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>
              <span>${p.seriesName}：</span>
              <span style="font-weight:600">${val}</span>
            </div>`;
          });
          return html;
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: '#64748b', fontSize: 12 },
        itemWidth: 16,
        itemHeight: 3,
        itemGap: 16,
      },
      grid: getChartGrid(months.length, { left: 8, right: 8, top: 28, bottom: 8, compactBottom: 24, crowdedAt: 7 }),
      xAxis: {
        type: 'category',
        data: months,
        axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: getCategoryAxisLabel(isDark, months.length, { rotate: 30, width: 42, crowdedAt: 7 }),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          formatter: (v) => {
            if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
            return `${(v / 1000).toFixed(0)}k`;
          },
        },
        splitLine: {
          lineStyle: { color: isDark ? '#334155' : '#e2e8f0', type: 'dashed' },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          name: '当前利润',
          type: 'bar',
          cursor: 'default',
          barWidth: '36%',
          itemStyle: {
            color: CHART_COLORS.current,
            borderRadius: [4, 4, 0, 0],
          },
          data: currentProfits,
        },
        {
          name: '预期利润',
          type: 'line',
          cursor: 'default',
          smooth: true,
          symbol: 'diamond',
          symbolSize: 6,
          lineStyle: { width: 2, color: CHART_COLORS.expected, type: 'dashed' },
          itemStyle: { color: CHART_COLORS.expected },
          data: expectedProfits,
        },
      ],
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
