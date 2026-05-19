const BRANCH_COLOR_LIST = [
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#06b6d4',
  '#f97316',
  '#64748b',
];

const BRANCH_COLOR_MAP = {
  '马来公司': '#3b82f6',
  '印尼公司': '#8b5cf6',
  '装饰公司': '#ec4899',
  '安装公司': '#f59e0b',
  '老挝公司': '#10b981',
  '中东公司': '#06b6d4',
  '大洋洲公司': '#f97316',
  '其他公司': '#64748b',
};

export function getBranchColor(name) {
  if (!name) return BRANCH_COLOR_LIST[0];
  if (BRANCH_COLOR_MAP[name]) return BRANCH_COLOR_MAP[name];
  for (const key of Object.keys(BRANCH_COLOR_MAP)) {
    if (name.includes(key.replace('公司', ''))) return BRANCH_COLOR_MAP[key];
  }
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return BRANCH_COLOR_LIST[Math.abs(hash) % BRANCH_COLOR_LIST.length];
}

export function getBranchColorLight(name, opacity = 0.35) {
  const hex = getBranchColor(name);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const BRANCH_COLORS = BRANCH_COLOR_LIST;

export const FIELD_LABELS = {
  branchName: '分公司',
  projectName: '项目名称',
  selfOperatedValue: '自营产值',
  onSiteExpense: '实际成本',
  measurementConfirmRate: '计量确认率',
  valueConfirmRate: '价值确认率',
  currentProfitRate: '当前利润率',
  expectedProfitRate: '预期利润率',
  currentProfit: '当前利润',
  expectedProfit: '预期利润',
  receivedAmount: '已收款',
  unreceivedAmount: '未收款',
  collectionRate: '收款率',
  totalRevenue: '总收入',
  totalCost: '总成本',
  month: '月份',
};

export const RISK_THRESHOLD = {
  profitRate: 0.05,
  label: '利润率低于5%',
};

export const CHART_COLORS = {
  current: '#3b82f6',
  expected: '#8b5cf6',
  positive: '#ef4444',
  negative: '#10b981',
  warning: '#f59e0b',
  received: '#3b82f6',
  unreceived: '#94a3b8',
};
