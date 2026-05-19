export function getCategoryAxisLabel(isDark, count, options = {}) {
  const {
    fontSize = 11,
    rotate = 30,
    width = 56,
    crowdedAt = 6,
    forceAll = false,
  } = options;
  const crowded = count >= crowdedAt;

  return {
    color: isDark ? '#94a3b8' : '#64748b',
    fontSize,
    rotate: crowded ? rotate : 0,
    interval: forceAll ? 0 : 'auto',
    hideOverlap: true,
    margin: crowded ? 6 : 4,
    overflow: 'truncate',
    width: crowded ? width : Math.max(width, 64),
    align: crowded ? 'right' : 'center',
    verticalAlign: crowded ? 'middle' : 'top',
  };
}

export function getChartGrid(count, options = {}) {
  const {
    left = 8,
    right = 8,
    top = 28,
    bottom = 8,
    compactBottom = 24,
    crowdedAt = 6,
  } = options;

  return {
    left,
    right,
    top,
    bottom: count >= crowdedAt ? Math.max(bottom, compactBottom) : bottom,
    containLabel: true,
  };
}
