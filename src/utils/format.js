export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) return '--';
  return Number(num).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(rate) {
  if (rate === null || rate === undefined || isNaN(rate)) return '--';
  return `${(Number(rate) * 100).toFixed(2)}%`;
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '--';
  const wan = Number(amount);
  if (Math.abs(wan) >= 10000) {
    return `${(wan / 10000).toFixed(2)} 亿元`;
  }
  return `${formatNumber(wan)} 万元`;
}

export function formatBillion(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '--';
  const yi = Number(amount) / 10000;
  return `${yi.toFixed(2)} 亿元`;
}
