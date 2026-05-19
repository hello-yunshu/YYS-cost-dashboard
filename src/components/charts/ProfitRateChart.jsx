import { useMemo, useRef, useCallback } from 'react';
import clsx from 'clsx';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { CHART_COLORS } from '../../utils/constants';

export default function ProfitRateChart({ data = [], onBranchClick, riskThreshold = 0.05 }) {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const chartRef = useRef(null);

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};
    const sorted = [...data].sort((a, b) => (b.currentProfitRate || 0) - (a.currentProfitRate || 0));
    const branches = sorted.map((d) => {
      const name = d.branchName || '';
      return name.length > 6 ? name.slice(0, 6) + '…' : name;
    });
    const currentRates = sorted.map((d) => d.currentProfitRate);
    const expectedRates = sorted.map((d) => d.expectedProfitRate);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        textStyle: { color: isDark ? '#f1f5f9' : '#0f172a', fontSize: 13 },
        formatter: (params) => {
          if (!params || params.length === 0) return '';
          const item = sorted[params[0].dataIndex];
          const originalName = item?.branchName || params[0].axisValue;
          let html = `<div style="font-weight:600;margin-bottom:4px">${originalName}</div>`;
          params.forEach((p) => {
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${p.color}"></span>
              <span>${p.seriesName}：</span>
              <span style="font-weight:600">${((p.value || 0) * 100).toFixed(2)}%</span>
            </div>`;
          });
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
          fontSize: 11,
          formatter: (v) => `${(v * 100).toFixed(0)}%`,
        },
        splitLine: {
          lineStyle: { color: isDark ? '#334155' : '#e2e8f0', type: 'dashed' },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: branches,
        axisLine: { lineStyle: { color: isDark ? '#475569' : '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
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
          emphasis: {
            itemStyle: { opacity: 0.8 },
          },
          data: currentRates,
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: isDark ? '#fbbf24' : CHART_COLORS.warning,
              type: 'dashed',
              width: 2,
            },
            label: {
              formatter: `风险阈值 ${(riskThreshold * 100).toFixed(0)}%`,
              color: isDark ? '#fbbf24' : CHART_COLORS.warning,
              fontSize: 11,
              fontWeight: 'bold',
              position: 'insideStartTop',
            },
            data: [{ xAxis: riskThreshold }],
          },
        },
        {
          name: '预期利润率',
          type: 'bar',
          barWidth: '32%',
          itemStyle: {
            color: CHART_COLORS.expected,
            borderRadius: [0, 4, 4, 0],
          },
          emphasis: {
            itemStyle: { opacity: 0.8 },
          },
          data: expectedRates,
        },
      ],
    };
  }, [data, isDark, riskThreshold]);

  const handleChartReady = useCallback((chart) => {
    if (!chart || !onBranchClick) return;
    const zr = chart.getZr();
    const dom = chart.getDom();
    const canvases = dom.querySelectorAll('canvas');

    zr.off('click');
    zr.off('mousemove');
    zr.off('globalout');

    zr.on('click', (params) => {
      const point = [params.offsetX, params.offsetY];
      if (chart.containPixel('grid', point)) {
        const pixel = chart.convertFromPixel({ seriesIndex: 0 }, point);
        const idx = Math.round(pixel[1]);
        const sorted = [...data].sort((a, b) => (b.currentProfitRate || 0) - (a.currentProfitRate || 0));
        if (idx >= 0 && idx < sorted.length) {
          onBranchClick(sorted[idx]);
        }
      }
    });

    zr.on('mousemove', (e) => {
      const point = [e.offsetX, e.offsetY];
      if (chart.containPixel('grid', point)) {
        dom.style.cursor = 'pointer';
        canvases.forEach((c) => { c.style.cursor = 'pointer'; });
      } else {
        try {
          const hovered = zr.handler.findHover(e.offsetX, e.offsetY);
          let isPointer = false;
          let el = hovered?.target;
          while (el) {
            if (el.cursor === 'pointer') { isPointer = true; break; }
            el = el.parent;
          }
          const cursor = isPointer ? 'pointer' : 'default';
          dom.style.cursor = cursor;
          canvases.forEach((c) => { c.style.cursor = cursor; });
        } catch {
          dom.style.cursor = 'default';
          canvases.forEach((c) => { c.style.cursor = 'default'; });
        }
      }
    });

    zr.on('globalout', () => {
      dom.style.cursor = 'default';
      canvases.forEach((c) => { c.style.cursor = 'default'; });
    });
  }, [data, onBranchClick]);

  return (
    <div className={clsx('chart-container', onBranchClick && 'chart-clickable')}>
      <ReactECharts
        ref={chartRef}
        option={option}
        onChartReady={handleChartReady}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
}
