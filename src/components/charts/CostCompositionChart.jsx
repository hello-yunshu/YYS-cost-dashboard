import { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor } from '../../utils/constants';

export default function CostCompositionChart({ monthlyData = [], selectedMonth }) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const [vw, setVw] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 0);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isWide = vw >= 768;
  const isMedium = vw >= 400 && vw < 768;
  const isTiny = vw < 400;

  const option = useMemo(() => {
    const target = selectedMonth
      ? monthlyData.find((d) => d.month === selectedMonth)
      : monthlyData[monthlyData.length - 1];

    if (!target || !target.branches || target.branches.length === 0) return {};

    const branches = target.branches.filter((b) => (b.actualCost || 0) > 0);
    const names = branches.map((b) => b.branchName);
    const values = branches.map((b) => b.actualCost || 0);

    const legendFormatter = (name) => {
      const idx = names.indexOf(name);
      if (idx === -1) return name;
      const val = values[idx];
      const label = Math.abs(val) >= 10000
        ? `${(val / 10000).toFixed(1)}亿`
        : `${(val / 1000).toFixed(0)}k`;
      const text = `${name}  ${label}`;
      return text.length > 10 ? text.slice(0, 10) + '...' : text;
    };

    const baseTextStyle = { color: isDark ? '#94a3b8' : '#64748b', fontSize: 11 };

    const scrollIconColor = isDark ? '#475569' : '#64748b';
    const scrollInactiveColor = isDark ? '#1e293b' : '#cbd5e1';

    let pieCenter, pieRadius, legendConfig;

    if (isWide) {
      pieCenter = ['35%', '46%'];
      pieRadius = ['42%', '72%'];
      legendConfig = {
        show: true,
        orient: 'vertical',
        left: '68%',
        top: 'center',
        textStyle: baseTextStyle,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 8,
        type: 'scroll',
        pageIconColor: scrollIconColor,
        pageIconInactiveColor: scrollInactiveColor,
        pageTextStyle: { color: isDark ? '#64748b' : '#475569' },
        formatter: legendFormatter,
      };
    } else if (isMedium) {
      pieCenter = ['50%', '40%'];
      pieRadius = ['36%', '62%'];
      legendConfig = {
        show: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '6%',
        textStyle: baseTextStyle,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        type: 'scroll',
        pageIconColor: scrollIconColor,
        pageIconInactiveColor: scrollInactiveColor,
        pageTextStyle: { color: isDark ? '#64748b' : '#475569' },
        formatter: legendFormatter,
      };
    } else {
      pieCenter = ['50%', '46%'];
      pieRadius = ['36%', '62%'];
      legendConfig = { show: false };
    }

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: (p) => {
          const val = Math.abs(p.value) >= 10000
            ? `${(p.value / 10000).toFixed(2)} 亿元`
            : `${p.value.toFixed(2)} 万元`;
          return `<div style="font-weight:600;margin-bottom:4px">${p.name}</div>
            <div>成本：<span style="font-weight:600">${val}</span></div>
            <div>占比：<span style="font-weight:600">${p.percent.toFixed(1)}%</span></div>`;
        },
      },
      legend: legendConfig,
      series: [
        {
          type: 'pie',
          cursor: 'default',
          radius: pieRadius,
          center: pieCenter,
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 2,
          },
          label: {
            show: isTiny,
            formatter: '{b}\n{d}%',
            fontSize: 10,
            lineHeight: 14,
            color: isDark ? '#94a3b8' : '#64748b',
          },
          labelLine: {
            show: isTiny,
            lineStyle: { color: '#64748b', width: 1 },
          },
          emphasis: {
            label: {
              show: true,
              formatter: '{b}\n{d}%',
              fontSize: 13,
              fontWeight: 'bold',
              lineHeight: 18,
              color: isDark ? '#f1f5f9' : '#0f172a',
            },
            labelLine: {
              show: true,
              lineStyle: {
                color: '#64748b',
                width: 1,
              },
            },
          },
          data: names.map((name, idx) => ({
            name,
            value: values[idx],
            itemStyle: { color: getBranchColor(name) },
          })),
        },
      ],
    };
  }, [monthlyData, selectedMonth, isDark, isWide, isMedium, isTiny]);

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
