import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor, getBranchColorLight } from '../../utils/constants';

export default function BranchScatterChart({ monthlyData = [] }) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    if (monthlyData.length === 0) return {};

    const latest = monthlyData[monthlyData.length - 1];
    if (!latest?.branches || latest.branches.length === 0) return {};

    const branches = latest.branches.filter((b) =>
      (b.selfOperatedValue || 0) > 0
    );
    if (branches.length === 0) return {};

    const seriesData = branches.map((b) => ({
      value: [
        b.selfOperatedValue || 0,
        (b.currentProfitRate || 0) * 100,
        b.actualCost || 0,
      ],
      name: b.branchName,
      itemStyle: {
        color: getBranchColor(b.branchName),
        opacity: 0.8,
      },
    }));

    const maxCost = Math.max(1, ...branches.map((b) => b.actualCost || 0).filter(v => v != null));
    const symbolSizeFunc = (val) => {
      const ratio = (val[2] || 0) / maxCost;
      return Math.max(10, Math.min(40, ratio * 50 + 10));
    };

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: (params) => {
          const d = params.data;
          const revenue = Math.abs(d.value[0]) >= 10000
            ? `${(d.value[0] / 10000).toFixed(2)} 亿`
            : `${d.value[0].toFixed(2)} 万`;
          const cost = Math.abs(d.value[2]) >= 10000
            ? `${(d.value[2] / 10000).toFixed(2)} 亿`
            : `${d.value[2].toFixed(2)} 万`;
          return `<div style="font-weight:600;margin-bottom:4px">${d.name}</div>
            <div>自营产值：<span style="font-weight:600">${revenue}</span></div>
            <div>当前利润率：<span style="font-weight:600">${d.value[1].toFixed(2)}%</span></div>
            <div>实际成本：<span style="font-weight:600">${cost}</span></div>`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 12,
        type: 'scroll',
        pageIconColor: isDark ? '#475569' : '#64748b',
        pageIconInactiveColor: isDark ? '#1e293b' : '#cbd5e1',
        pageTextStyle: { color: isDark ? '#64748b' : '#475569' },
      },
      grid: {
        left: 24,
        right: 60,
        top: 16,
        bottom: 32,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        name: '自营产值',
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
          formatter: (v) => {
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
      yAxis: {
        type: 'value',
        name: '利润率',
        nameLocation: 'middle',
        nameGap: 36,
        nameTextStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
          formatter: (v) => `${v.toFixed(0)}%`,
        },
        splitLine: {
          lineStyle: { color: isDark ? '#1e293b' : '#e2e8f0', type: 'dashed' },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [
        {
          type: 'scatter',
          cursor: 'default',
          symbolSize: symbolSizeFunc,
          data: seriesData,
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            fontSize: 10,
            color: isDark ? '#94a3b8' : '#64748b',
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              shadowBlur: 10,
              shadowColor: 'rgba(0,0,0,0.2)',
            },
            label: {
              fontSize: 12,
              fontWeight: 'bold',
              color: isDark ? '#f1f5f9' : '#0f172a',
            },
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: isDark ? '#475569' : '#cbd5e1', type: 'dashed', width: 1 },
            data: [
              {
                yAxis: 5,
                label: {
                  formatter: '风险线 5%',
                  position: 'insideStartTop',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontSize: 10,
                },
              },
            ],
          },
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
