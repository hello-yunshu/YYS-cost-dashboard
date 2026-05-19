import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { CHART_COLORS } from '../../utils/constants';
import { getCategoryAxisLabel, getChartGrid } from './axisLayout';

export default function ProjectBarChart({ data = [], dataKeys = [], labels = [], title }) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const isRateChart = dataKeys.some((k) => k.toLowerCase().includes('rate'));

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};
    const names = data.map((d) => {
      const name = d.projectName || d.name || '';
      return name.length > 8 ? name.slice(0, 8) + '...' : name;
    });

    const series = dataKeys.map((key, idx) => ({
      name: labels[idx] || key,
      type: 'bar',
      cursor: 'default',
      barWidth: `${Math.max(12, 60 / dataKeys.length)}%`,
      itemStyle: {
        color: idx === 0 ? CHART_COLORS.current : CHART_COLORS.expected,
        borderRadius: [4, 4, 0, 0],
      },
      data: data.map((d) => d[key]),
    }));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: isRateChart
          ? (params) => {
              if (!params || params.length === 0) return '';
              let html = `<div style="font-weight:600;margin-bottom:4px">${params[0].axisValue}</div>`;
              params.forEach((p) => {
                html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
                  <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>
                  <span>${p.seriesName}：</span>
                  <span style="font-weight:600">${((p.value || 0) * 100).toFixed(2)}%</span>
                </div>`;
              });
              return html;
            }
          : undefined,
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
      },
      grid: getChartGrid(names.length, { left: 8, right: 8, top: 28, bottom: 8, compactBottom: 28 }),
      xAxis: {
        type: 'category',
        data: names,
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: getCategoryAxisLabel(isDark, names.length, {
          fontSize: 10,
          rotate: 38,
          width: 58,
          crowdedAt: 5,
          forceAll: true,
        }),
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
          formatter: isRateChart ? (v) => `${(v * 100).toFixed(0)}%` : undefined,
        },
        splitLine: {
          lineStyle: { color: isDark ? '#1e293b' : '#e2e8f0', type: 'dashed' },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series,
      dataZoom: names.length > 10 ? [
        {
          type: 'inside',
          start: 0,
          end: 60,
        },
      ] : undefined,
    };
  }, [data, dataKeys, labels, isDark, isRateChart]);

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
