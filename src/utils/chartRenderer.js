export async function renderChart(option, width = 780, height = 400) {
  if (!option || !option.series || option.series.length === 0) return null;

  const echarts = await import('echarts');

  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:0',
    'top:0',
    `width:${width}px`,
    `height:${height}px`,
    'opacity:0',
    'pointer-events:none',
    'overflow:hidden',
    'z-index:-1',
  ].join(';');
  document.body.appendChild(container);

  return new Promise((resolve, reject) => {
    let settled = false;
    let fallbackTimer = null;
    let chart = null;

    const cleanup = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (chart && !chart.isDisposed()) chart.dispose();
      container.remove();
    };

    const capture = () => {
      if (settled || !chart || chart.isDisposed()) return;
      settled = true;
      requestAnimationFrame(() => {
        try {
          const dataUrl = chart.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
          cleanup();
          resolve(dataUrl);
        } catch (err) {
          cleanup();
          reject(err);
        }
      });
    };

    try {
      chart = echarts.init(container, null, { width, height, renderer: 'canvas' });

      const onRendered = () => {
        chart.off('rendered', onRendered);
        capture();
      };

      chart.on('rendered', onRendered);
      chart.setOption({ ...option, animation: false }, true);
      chart.resize({ width, height });

      fallbackTimer = setTimeout(capture, 1000);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}

export async function renderCharts(charts) {
  const results = await Promise.all(
    charts.map(({ option, width, height }) => renderChart(option, width, height))
  );
  return results;
}
