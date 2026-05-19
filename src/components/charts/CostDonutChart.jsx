import { useMemo, useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor } from '../../utils/constants';

export default function CostDonutChart({ data = [] }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
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
    const filtered = data.filter((b) => (b.onSiteExpense || 0) > 0);
    if (filtered.length === 0) return {};

    const names = filtered.map((b) => b.branchName);
    const values = filtered.map((b) => b.onSiteExpense || 0);
    const total = values.reduce((s, v) => s + v, 0);
    const totalText = Math.abs(total) >= 10000
      ? `${(total / 10000).toFixed(1)}亿`
      : `${(total / 1000).toFixed(0)}k`;

    const labelColor = '#64748b';
    const valueColor = isDark ? '#f1f5f9' : '#0f172a';
    const baseTextStyle = { color: '#64748b', fontSize: 11 };

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

    const scrollIconColor = isDark ? '#475569' : '#64748b';
    const scrollInactiveColor = isDark ? '#334155' : '#cbd5e1';

    let pieCenter, pieRadius, legendConfig;

    if (isWide) {
      pieCenter = ['35%', '50%'];
      pieRadius = ['42%', '72%'];
      legendConfig = {
        show: true,
        orient: 'vertical',
        left: '68%',
        top: 'center',
        data: names,
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
        bottom: 8,
        data: names,
        textStyle: baseTextStyle,
        itemWidth: 12,
        itemHeight: 8,
        itemGap: 12,
        type: 'scroll',
        pageIconColor: scrollIconColor,
        pageIconInactiveColor: scrollInactiveColor,
        pageTextStyle: { color: isDark ? '#64748b' : '#475569' },
        formatter: legendFormatter,
      };
    } else {
      pieCenter = ['50%', '50%'];
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
          if (p.seriesName === 'center') return '';
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
          name: 'cost',
          type: 'pie',
          cursor: 'default',
          radius: pieRadius,
          center: pieCenter,
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
            color: labelColor,
          },
          labelLine: {
            show: isTiny,
            lineStyle: { color: '#64748b', width: 1 },
          },
          emphasis: {
            scaleSize: 5,
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
        {
          name: 'center',
          type: 'pie',
          radius: ['0%', '0%'],
          center: pieCenter,
          silent: true,
          animation: false,
          label: {
            show: true,
            position: 'center',
            formatter: `{label|总成本}\n{value|${totalText}}`,
            rich: {
              label: { fontSize: 11, color: labelColor, lineHeight: 18 },
              value: { fontSize: 15, fontWeight: 700, color: valueColor, lineHeight: 22 },
            },
          },
          labelLine: { show: false },
          emphasis: { disabled: true },
          data: [{ value: 0, name: '', itemStyle: { color: 'transparent' } }],
        },
      ],
    };
  }, [data, isDark, isWide, isMedium, isTiny]);

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
