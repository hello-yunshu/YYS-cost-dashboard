import { getBranchColor, getBranchColorLight, CHART_COLORS } from './constants';
import { getCategoryAxisLabel, getChartGrid } from '../components/charts/axisLayout';

export function getProfitRateOption(data) {
  const sorted = [...data].sort((a, b) => (b.currentProfitRate || 0) - (a.currentProfitRate || 0));
  const branches = sorted.map((d) => {
    const name = d.branchName || '';
    return name.length > 6 ? name.slice(0, 6) + '…' : name;
  });
  const currentRates = sorted.map((d) => d.currentProfitRate);
  const expectedRates = sorted.map((d) => d.expectedProfitRate);

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
    },
    grid: {
      left: 8,
      right: 20,
      top: 28,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => `${(v * 100).toFixed(0)}%`,
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: branches,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        width: 70,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: '当前利润率',
        type: 'bar',
        barWidth: '32%',
        itemStyle: {
          color: CHART_COLORS.current,
          borderRadius: [0, 4, 4, 0],
        },
        data: currentRates,
      },
      {
        name: '预期利润率',
        type: 'bar',
        barWidth: '32%',
        itemStyle: {
          color: CHART_COLORS.expected,
          borderRadius: [0, 4, 4, 0],
        },
        data: expectedRates,
      },
    ],
  };
}

export function getProfitAmountOption(data) {
  const sorted = [...data].sort((a, b) => (b.currentProfit || 0) - (a.currentProfit || 0));
  const branches = sorted.map((d) => {
    const name = d.branchName || '';
    return name.length > 6 ? name.slice(0, 6) + '…' : name;
  });
  const currentProfits = sorted.map((d) => d.currentProfit);
  const expectedProfitsNeg = sorted.map((d) => -(d.expectedProfit || 0));
  const expectedColors = sorted.map((d) => getBranchColor(d.branchName));
  const currentColors = sorted.map((d) => getBranchColorLight(d.branchName, 0.4));

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
      data: [
        {
          name: '预期利润',
          icon: 'roundRect',
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '当前利润',
          icon: 'roundRect',
          itemStyle: { color: 'rgba(59, 130, 246, 0.4)' },
        },
      ],
    },
    grid: {
      left: 8,
      right: 20,
      top: 28,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => {
          const abs = Math.abs(v);
          if (abs >= 10000) return `${(abs / 10000).toFixed(0)}亿`;
          if (abs >= 1000) return `${(abs / 1000).toFixed(0)}k`;
          return abs.toFixed(0);
        },
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: branches,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        width: 70,
        overflow: 'truncate',
      },
    },
    series: [
      {
        name: '预期利润',
        type: 'bar',
        barWidth: '32%',
        barGap: '-100%',
        itemStyle: {
          borderRadius: [4, 0, 0, 4],
          color: (params) => expectedColors[params.dataIndex],
        },
        data: expectedProfitsNeg,
      },
      {
        name: '当前利润',
        type: 'bar',
        barWidth: '32%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: (params) => currentColors[params.dataIndex],
        },
        data: currentProfits,
      },
    ],
  };
}

export function getCollectionOption() {
  return null;
}

export function getConfirmRateOption(data) {
  if (!data || data.length === 0) return null;

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
    legend: {
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 12,
      type: 'scroll',
    },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      center: ['50%', '44%'],
      radius: '55%',
      axisName: {
        color: '#64748b',
        fontSize: 12,
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(226,232,240,0.8)', 'rgba(226,232,240,0.4)'],
        },
      },
      axisLine: {
        lineStyle: { color: '#cbd5e1' },
      },
      splitLine: {
        lineStyle: { color: '#cbd5e1' },
      },
    },
    series: [{
      type: 'radar',
      data: seriesData,
    }],
  };
}

export function getExpenseOption(data) {
  const branches = data.map((d) => {
    const name = d.branchName || '';
    return name.length > 6 ? name.slice(0, 6) + '…' : name;
  });
  const selfValues = data.map((d) => d.selfOperatedValue ?? 0);
  const expenses = data.map((d) => d.onSiteExpense ?? 0);
  const valueColors = data.map((d) => getBranchColorLight(d.branchName, 0.2));
  const valueBorderColors = data.map((d) => getBranchColor(d.branchName));

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 16,
    },
    grid: {
      left: 8,
      right: 8,
      top: 28,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: branches,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: getCategoryAxisLabel(false, branches.length, { rotate: 34, width: 48, fontSize: 12 }),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => {
          if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
          return `${(v / 1000).toFixed(0)}k`;
        },
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '自营产值',
        type: 'bar',
        barWidth: '44%',
        barGap: '-80%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: (params) => valueColors[params.dataIndex],
          borderColor: (params) => valueBorderColors[params.dataIndex],
          borderWidth: 1.5,
        },
        data: selfValues,
        z: 1,
      },
      {
        name: '实际成本',
        type: 'bar',
        barWidth: '28%',
        itemStyle: {
          color: '#f59e0b',
          borderRadius: [4, 4, 0, 0],
        },
        data: expenses,
        z: 2,
      },
    ],
  };
}

export function getCostDonutOption(data) {
  const filtered = data.filter((b) => (b.onSiteExpense || 0) > 0);
  if (filtered.length === 0) return null;

  const names = filtered.map((b) => b.branchName);
  const values = filtered.map((b) => b.onSiteExpense || 0);
  const total = values.reduce((s, v) => s + v, 0);
  const totalText = Math.abs(total) >= 10000
    ? `${(total / 10000).toFixed(1)}亿`
    : `${(total / 1000).toFixed(0)}k`;

  return {
    legend: {
      orient: 'vertical',
      right: '4%',
      top: 'center',
      data: names,
      textStyle: { color: '#64748b', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
      type: 'scroll',
      formatter: (name) => {
        const idx = names.indexOf(name);
        if (idx === -1) return name;
        const val = values[idx];
        const label = Math.abs(val) >= 10000
          ? `${(val / 10000).toFixed(1)}亿`
          : `${(val / 1000).toFixed(0)}k`;
        const text = `${name}  ${label}`;
        return text.length > 10 ? text.slice(0, 10) + '...' : text;
      },
    },
    series: [
      {
        name: 'cost',
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['35%', '40%'],
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: { show: false },
        labelLine: { show: false },
        data: names.map((name, idx) => ({
          name,
          value: values[idx],
          itemStyle: { color: getBranchColor(name) },
        })),
      },
      {
        name: 'center',
        type: 'pie',
        radius: ['0%', '0%'],
        center: ['38%', '40%'],
        silent: true,
        animation: false,
        label: {
          show: true,
          position: 'center',
          formatter: `{label|总成本}\n{value|${totalText}}`,
          rich: {
            label: { fontSize: 12, color: '#64748b', lineHeight: 18 },
            value: { fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 22 },
          },
        },
        labelLine: { show: false },
        data: [{ value: 0, name: '', itemStyle: { color: 'transparent' } }],
      },
    ],
  };
}

export function getProfitTrendOption(monthlyData) {
  const months = monthlyData.map((d) => {
    const m = d.month;
    return m ? `${parseInt(m.split('-')[1], 10)}月` : m;
  });
  const currentRates = monthlyData.map((d) => d.company?.currentProfitRate ?? null);
  const expectedRates = monthlyData.map((d) => d.company?.expectedProfitRate ?? null);

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 16,
      itemHeight: 3,
      itemGap: 16,
    },
    grid: getChartGrid(months.length, { left: 8, right: 8, top: 28, bottom: 8, compactBottom: 24, crowdedAt: 7 }),
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: getCategoryAxisLabel(false, months.length, { rotate: 30, width: 42, crowdedAt: 7, fontSize: 12 }),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => `${(v * 100).toFixed(0)}%`,
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '当前利润率',
        type: 'bar',
        barWidth: '36%',
        itemStyle: {
          color: CHART_COLORS.current,
          borderRadius: [4, 4, 0, 0],
        },
        data: currentRates,
      },
      {
        name: '预期利润率',
        type: 'line',
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2, color: CHART_COLORS.expected, type: 'dashed' },
        itemStyle: { color: CHART_COLORS.expected },
        data: expectedRates,
      },
    ],
  };
}

export function getProfitAmountTrendOption(monthlyData) {
  const months = monthlyData.map((d) => {
    const m = d.month;
    return m ? `${parseInt(m.split('-')[1], 10)}月` : m;
  });
  const currentProfits = monthlyData.map((d) => d.company?.currentProfit ?? null);
  const expectedProfits = monthlyData.map((d) => d.company?.expectedProfit ?? null);

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 16,
      itemHeight: 3,
      itemGap: 16,
    },
    grid: getChartGrid(months.length, { left: 8, right: 8, top: 28, bottom: 8, compactBottom: 24, crowdedAt: 7 }),
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: getCategoryAxisLabel(false, months.length, { rotate: 30, width: 42, crowdedAt: 7, fontSize: 12 }),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => {
          if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
          return `${(v / 1000).toFixed(0)}k`;
        },
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '当前利润',
        type: 'bar',
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
        smooth: true,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: { width: 2, color: CHART_COLORS.expected, type: 'dashed' },
        itemStyle: { color: CHART_COLORS.expected },
        data: expectedProfits,
      },
    ],
  };
}

export function getBranchTrendOption(branchTrends, valueKey) {
  if (!branchTrends.length) return null;

  const months = branchTrends[0].trend.map((t) => {
    const m = t.month;
    return m ? `${parseInt(m.split('-')[1], 10)}月` : m;
  });

  const series = branchTrends.map((branch) => {
    const color = getBranchColor(branch.branchName);
    return {
      name: branch.branchName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { width: 2, color },
      itemStyle: { color },
      data: branch.trend.map((t) => t[valueKey] ?? null),
    };
  });

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 14,
      itemHeight: 3,
      itemGap: 12,
      type: 'scroll',
    },
    grid: getChartGrid(months.length, { left: 8, right: 8, top: 32, bottom: 8, compactBottom: 24, crowdedAt: 7 }),
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: getCategoryAxisLabel(false, months.length, { rotate: 30, width: 42, crowdedAt: 7, fontSize: 12 }),
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => {
          if (valueKey.includes('Rate') || valueKey === 'collectionRate' || valueKey === 'measurementConfirmRate' || valueKey === 'valueConfirmRate') {
            return `${(v * 100).toFixed(0)}%`;
          }
          if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
          return `${(v / 1000).toFixed(0)}k`;
        },
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series,
  };
}

export function getRevenueCostTrendOption(monthlyData) {
  const months = monthlyData.map((d) => {
    const m = d.month;
    return m ? `${parseInt(m.split('-')[1], 10)}月` : m;
  });
  const revenues = monthlyData.map((d) => d.company?.selfOperatedValue ?? null);
  const costs = monthlyData.map((d) => d.company?.actualCost ?? null);

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 16,
      itemHeight: 3,
      itemGap: 16,
    },
    grid: getChartGrid(months.length, { left: 8, right: 8, top: 28, bottom: 8, compactBottom: 24, crowdedAt: 7 }),
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: getCategoryAxisLabel(false, months.length, { rotate: 30, width: 42, crowdedAt: 7, fontSize: 12 }),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => {
          if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
          return `${(v / 1000).toFixed(0)}k`;
        },
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '自营产值',
        type: 'bar',
        barWidth: '30%',
        itemStyle: {
          color: '#10b981',
          borderRadius: [4, 4, 0, 0],
        },
        data: revenues,
      },
      {
        name: '实际成本',
        type: 'bar',
        barWidth: '30%',
        itemStyle: {
          color: '#f59e0b',
          borderRadius: [4, 4, 0, 0],
        },
        data: costs,
      },
    ],
  };
}

export function getCollectionTrendOption(monthlyData) {
  const months = monthlyData.map((d) => {
    const m = d.month;
    return m ? `${parseInt(m.split('-')[1], 10)}月` : m;
  });
  const received = monthlyData.map((d) => d.company?.receivedAmount ?? null);
  const unreceived = monthlyData.map((d) => d.company?.unreceivedAmount ?? null);

  return {
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 16,
      itemHeight: 3,
      itemGap: 16,
    },
    grid: getChartGrid(months.length, { left: 8, right: 8, top: 28, bottom: 8, compactBottom: 24, crowdedAt: 7 }),
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      axisTick: { show: false },
      axisLabel: getCategoryAxisLabel(false, months.length, { rotate: 30, width: 42, crowdedAt: 7, fontSize: 12 }),
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => {
          if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
          return `${(v / 1000).toFixed(0)}k`;
        },
      },
      splitLine: {
        lineStyle: { color: '#e2e8f0', type: 'dashed' },
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '已收款',
        type: 'bar',
        stack: 'total',
        barWidth: '40%',
        itemStyle: {
          color: '#3b82f6',
        },
        data: received,
      },
      {
        name: '未收款',
        type: 'bar',
        stack: 'total',
        barWidth: '40%',
        itemStyle: {
          color: '#cbd5e1',
          borderRadius: [4, 4, 0, 0],
        },
        data: unreceived,
      },
    ],
  };
}

export function getCostCompositionOption(monthlyData, selectedMonth) {
  const target = selectedMonth
    ? monthlyData.find((d) => d.month === selectedMonth)
    : monthlyData[monthlyData.length - 1];

  if (!target || !target.branches || target.branches.length === 0) return null;

  const branches = target.branches.filter((b) => (b.actualCost || 0) > 0);
  const names = branches.map((b) => b.branchName);
  const values = branches.map((b) => b.actualCost || 0);

  return {
    legend: {
      orient: 'vertical',
      left: '68%',
      top: 'center',
      textStyle: { color: '#64748b', fontSize: 12 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 8,
      type: 'scroll',
      formatter: (name) => {
        const idx = names.indexOf(name);
        if (idx === -1) return name;
        const val = values[idx];
        const label = Math.abs(val) >= 10000
          ? `${(val / 10000).toFixed(1)}亿`
          : `${(val / 1000).toFixed(0)}k`;
        const text = `${name}  ${label}`;
        return text.length > 10 ? text.slice(0, 10) + '...' : text;
      },
    },
    series: [
      {
        type: 'pie',
        radius: ['42%', '72%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        data: names.map((name, idx) => ({
          name,
          value: values[idx],
          itemStyle: { color: getBranchColor(name) },
        })),
      },
    ],
  };
}

export function getBranchRadarOption(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) return null;

  const latest = monthlyData[monthlyData.length - 1];
  if (!latest?.branches || latest.branches.length === 0) return null;

  const branches = latest.branches.filter((b) =>
    (b.selfOperatedValue || 0) > 0
  );
  if (branches.length === 0) return null;

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
      areaStyle: { color: getBranchColorLight(b.branchName, 0.04) },
    };
  });

  return {
    legend: {
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 12,
      itemHeight: 8,
      itemGap: 12,
      type: 'scroll',
    },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      center: ['50%', '44%'],
      radius: '55%',
      axisName: { color: '#64748b', fontSize: 12 },
      splitArea: {
        areaStyle: {
          color: ['rgba(226,232,240,0.8)', 'rgba(226,232,240,0.4)'],
        },
      },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      splitLine: { lineStyle: { color: '#cbd5e1' } },
    },
    series: [{
      type: 'radar',
      data: seriesData,
    }],
  };
}

export function getBranchScatterOption(monthlyData) {
  if (!monthlyData || monthlyData.length === 0) return null;

  const latest = monthlyData[monthlyData.length - 1];
  if (!latest?.branches || latest.branches.length === 0) return null;

  const branches = latest.branches.filter((b) =>
    (b.selfOperatedValue || 0) > 0
  );
  if (branches.length === 0) return null;

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

  const maxRevenue = Math.max(...branches.map((b) => b.selfOperatedValue || 0), 1);
  const symbolSizeFunc = (val) => {
    const ratio = (val[2] || 0) / maxRevenue;
    return Math.max(10, Math.min(40, ratio * 50 + 10));
  };

  return {
    legend: {
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 13 },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
      type: 'scroll',
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
      nameTextStyle: { color: '#64748b', fontSize: 12 },
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => {
          if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}亿`;
          return `${(v / 1000).toFixed(0)}k`;
        },
      },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      name: '利润率',
      nameLocation: 'middle',
      nameGap: 36,
      nameTextStyle: { color: '#64748b', fontSize: 12 },
      axisLabel: {
        color: '#64748b',
        fontSize: 12,
        formatter: (v) => `${v.toFixed(0)}%`,
      },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'scatter',
        symbolSize: symbolSizeFunc,
        data: seriesData,
        label: {
          show: true,
          formatter: '{b}',
          position: 'right',
          fontSize: 11,
          color: '#64748b',
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,0.2)',
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 },
          data: [
            {
              yAxis: 5,
              label: {
                formatter: '风险线 5%',
                position: 'insideStartTop',
                color: '#64748b',
                fontSize: 10,
              },
            },
          ],
        },
      },
    ],
  };
}
