import { useMemo, useRef, useCallback } from 'react';
import clsx from 'clsx';
import ReactECharts from 'echarts-for-react';
import useThemeStore from '../../stores/useThemeStore';
import { getBranchColor, getBranchColorLight } from '../../utils/constants';

export default function ProfitAmountChart({ data = [], onBranchClick }) {
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const chartRef = useRef(null);

  const option = useMemo(() => {
    if (!data || data.length === 0) return {};
    const sorted = [...data].sort((a, b) => (b.currentProfit || 0) - (a.currentProfit || 0));
    const branches = sorted.map((d) => {
      const name = d.branchName || '';
      return name.length > 6 ? name.slice(0, 6) + '…' : name;
    });
    const currentProfits = sorted.map((d) => d.currentProfit);
    const expectedProfitsNeg = sorted.map((d) => -(d.expectedProfit || 0));
    const expectedColors = sorted.map((d) => getBranchColor(d.branchName));
    const currentColors = sorted.map((d) => getBranchColorLight(d.branchName, 0.4));

    const formatAmount = (v) => {
      const abs = Math.abs(v);
      if (abs >= 10000) return `${(abs / 10000).toFixed(2)} 亿元`;
      return `${abs.toFixed(2)} 万元`;
    };

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
            const val = Math.abs(p.value);
            const color = p.seriesName === '预期利润'
              ? expectedColors[p.dataIndex]
              : currentColors[p.dataIndex];
            html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0">
              <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:${color}"></span>
              <span>${p.seriesName}：</span>
              <span style="font-weight:600">${formatAmount(val)}</span>
            </div>`;
          });
          const diff = (item?.currentProfit || 0) - (item?.expectedProfit || 0);
          const diffColor = diff >= 0 ? '#ef4444' : '#10b981';
          html += `<div style="border-top:1px solid ${isDark ? '#334155' : '#e2e8f0'};margin-top:4px;padding-top:4px">
            <span>偏差：</span><span style="font-weight:600;color:${diffColor}">${diff >= 0 ? '+' : ''}${formatAmount(diff)}</span>
          </div>`;
          return html;
        },
      },
      legend: {
        top: 0,
        right: 0,
        textStyle: { color: isDark ? '#94a3b8' : '#64748b', fontSize: 12 },
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
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
          formatter: (v) => {
            const abs = Math.abs(v);
            if (abs >= 10000) return `${(abs / 10000).toFixed(0)}亿`;
            if (abs >= 1000) return `${(abs / 1000).toFixed(0)}k`;
            return abs.toFixed(0);
          },
        },
        splitLine: {
          lineStyle: { color: isDark ? '#1e293b' : '#e2e8f0', type: 'dashed' },
        },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: branches,
        axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
        axisTick: { show: false },
        axisLabel: {
          color: isDark ? '#94a3b8' : '#64748b',
          fontSize: 11,
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
          emphasis: {
            itemStyle: { opacity: 0.8 },
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
          emphasis: {
            itemStyle: { opacity: 0.8 },
          },
          data: currentProfits,
        },
      ],
    };
  }, [data, isDark]);

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
        const sorted = [...data].sort((a, b) => (b.currentProfit || 0) - (a.currentProfit || 0));
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
