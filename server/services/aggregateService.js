const SUM_FIELDS = [
  'contract_general', 'contract_self',
  'bid_cost_general', 'bid_cost_self',
  'standard_cost_general', 'standard_cost_self',
  'owner_confirmed_value', 'actual_value', 'actual_cost',
  'later_expected_value', 'later_forecast_cost',
  'total_expected_value', 'total_expected_cost',
  'receivable', 'received', 'unreceived',
];

const RATE_FIELDS = [
  'bid_profit_rate', 'price_diff_rate', 'baseline_benefit_rate',
  'responsibility_profit_rate', 'actual_profit_rate',
  'measurement_confirm_rate', 'value_confirm_rate',
  'later_forecast_profit_rate', 'total_expected_profit_rate',
  'collection_rate',
];

const WEIGHTED_RATE_FIELDS = ['price_diff_rate', 'baseline_benefit_rate', 'responsibility_profit_rate'];

function calculateWeightedAvgRates(summary, items, weightField) {
  if (summary[weightField] > 0) {
    for (const field of WEIGHTED_RATE_FIELDS) {
      summary[field] = items.reduce((sum, p) => sum + (Number(p[field]) || 0) * (Number(p[weightField]) || 0), 0) / summary[weightField];
    }
  }
}

export function calculateRates(row) {
  const result = { ...row };

  if (result.actual_value && result.actual_value !== 0) {
    const cost = result.actual_cost ?? 0;
    result.actual_profit_rate = (result.actual_value - cost) / result.actual_value;
  }

  if (result.total_expected_value && result.total_expected_value !== 0) {
    const totalCost = result.total_expected_cost ?? 0;
    result.total_expected_profit_rate = (result.total_expected_value - totalCost) / result.total_expected_value;
  }

  if (result.later_expected_value && result.later_expected_value !== 0) {
    const laterCost = result.later_forecast_cost ?? 0;
    result.later_forecast_profit_rate = (result.later_expected_value - laterCost) / result.later_expected_value;
  }

  if (result.actual_cost && result.actual_cost !== 0) {
    result.measurement_confirm_rate = result.owner_confirmed_value / result.actual_cost;
  }

  if (result.actual_value && result.actual_value !== 0) {
    result.value_confirm_rate = result.owner_confirmed_value / result.actual_value;
  }

  if (result.receivable && result.receivable !== 0) {
    result.collection_rate = result.received / result.receivable;
  }

  if (result.contract_self && result.contract_self !== 0) {
    const bidCost = result.bid_cost_self ?? 0;
    result.bid_profit_rate = (result.contract_self - bidCost) / result.contract_self;
  }

  result.unreceived = (result.receivable || 0) - (result.received || 0);

  return result;
}

export function aggregateBranch(projects) {
  if (!projects || projects.length === 0) {
    return createEmptySummary();
  }

  const projectsWithData = projects.filter((p) => p.actual_value != null && p.actual_value !== 0);

  if (projectsWithData.length === 0) {
    const summary = createEmptySummary();
    summary.projectCount = projects.length;
    summary.onlineCount = projects.filter((p) => p.is_online === 1).length;
    return summary;
  }

  const summary = createEmptySummary();

  for (const field of SUM_FIELDS) {
    summary[field] = projectsWithData.reduce((sum, p) => sum + (Number(p[field]) || 0), 0);
  }

  summary.projectCount = projects.length;
  summary.onlineCount = projects.filter((p) => p.is_online === 1).length;

  calculateWeightedAvgRates(summary, projectsWithData, 'contract_self');
  return calculateRates(summary);
}

export function aggregateCompany(branchDetails) {
  if (!branchDetails || branchDetails.length === 0) {
    return createEmptySummary();
  }

  const branchesWithData = branchDetails.filter((b) => b.actual_value != null && b.actual_value !== 0);

  if (branchesWithData.length === 0) {
    const summary = createEmptySummary();
    summary.branchCount = branchDetails.length;
    summary.projectCount = branchDetails.reduce((sum, b) => sum + (b.projectCount || 0), 0);
    summary.onlineCount = branchDetails.reduce((sum, b) => sum + (b.onlineCount || 0), 0);
    return summary;
  }

  const summary = createEmptySummary();

  for (const field of SUM_FIELDS) {
    summary[field] = branchesWithData.reduce((sum, b) => sum + (Number(b[field]) || 0), 0);
  }

  summary.branchCount = branchDetails.length;
  summary.projectCount = branchDetails.reduce((sum, b) => sum + (b.projectCount || 0), 0);
  summary.onlineCount = branchDetails.reduce((sum, b) => sum + (b.onlineCount || 0), 0);

  calculateWeightedAvgRates(summary, branchesWithData, 'contract_self');
  return calculateRates(summary);
}

function createEmptySummary() {
  const summary = {};
  for (const field of SUM_FIELDS) {
    summary[field] = 0;
  }
  for (const field of RATE_FIELDS) {
    summary[field] = 0;
  }
  summary.projectCount = 0;
  summary.onlineCount = 0;
  summary.branchCount = 0;
  return summary;
}
