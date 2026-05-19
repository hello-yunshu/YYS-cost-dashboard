import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor, getBranchColorLight } from '../../utils/constants';
import { getCategoryAxisLabel, getChartGrid } from './axisLayout';
import { formatCurrency } from '../../utils/format';

function formatWan(val) {
  if (val == null) return '--';
  if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(2)} 亿元`;
  return `${val.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 万元`;
}

export default function ExpenseChart({ data = [] }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};

    const branches = data.map((d) => {
      const name = d.branchName || '';
      return name.length > 6 ? name.slice(0, 6) + '…' : name;
    });
    const selfValues = data.map((d) => d.selfOperatedValue ?? 0);
    const expenses = data.map((d) => d.onSiteExpense ?? 0);
    const valueColors = data.map((d) => getBranchColorLight(d.branchName, 0.2));
    const valueBorderColors = data.map((d) => getBranchColor(d.branchName));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const originalName = data[params[0].dataIndex]?.branchName || params[0].axisValue;
          const item = data[params[0].dataIndex];
          let html = `<div style="font-weight:600;margin-bottom:4px">${originalName}</div>`;
          params.forEach((p) => {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>
              <span>${p.seriesName}：</span>
              <span style="font-weight:600">${formatWan(p.value)}</span>
            </div>`;
          });
          if (item) {
            const profit = (item.selfOperatedValue || 0) - (item.onSiteExpense || 0);
            const profitRate = item.selfOperatedValue ? (profit / item.selfOperatedValue * 100).toFixed(2) : '0.00';
            const profitColor = profit >= 0 ? '#ef4444' : '#10b981';
            html += `<div style="border-top:1px solid ${isDark ? '#334155' : '#e2e8f0'};margin-top:4px;padding-top:4px">
              <span>利润空间：</span><span style="font-weight:600;color:${profitColor}">${formatWan(profit)} (${profitRate}%)</span>
            </div>`;
          }
          return html;
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: '#64748b', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 16,
      },
      grid: getChartGrid(branches.length, { left: 8, right: 8, top: 28, bottom: 8 }),
      xAxis: {
        type: 'category',
        data: branches,
        axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: getCategoryAxisLabel(isDark, branches.length, { rotate: 34, width: 48 }),
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
          name: '自营产值',
          type: 'bar',
          cursor: 'default',
          barWidth: '44%',
          barGap: '-80%',
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params) => valueColors[params.dataIndex],
            borderColor: (params) => valueBorderColors[params.dataIndex],
            borderWidth: 1.5,
          },
          emphasis: {
            itemStyle: {
              color: (params) => getBranchColorLight(data[params.dataIndex]?.branchName, 0.35),
            },
          },
          data: selfValues,
          z: 1,
        },
        {
          name: '实际成本',
          type: 'bar',
          cursor: 'default',
          barWidth: '28%',
          itemStyle: {
            color: '#f59e0b',
            borderRadius: [4, 4, 0, 0],
          },
          emphasis: {
            itemStyle: { opacity: 0.8 },
          },
          data: expenses,
          z: 2,
        },
      ],
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
