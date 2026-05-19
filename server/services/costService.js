import { getDao } from '../db/index.js';
import { aggregateBranch, aggregateCompany, calculateRates } from './aggregateService.js';

function enrichRow(row) {
  const actualValue = row.actual_value;
  const actualCost = row.actual_cost;
  const totalExpectedValue = row.total_expected_value;
  const totalExpectedCost = row.total_expected_cost;

  const currentProfit = (actualValue != null && actualCost != null)
    ? actualValue - actualCost
    : null;
  const expectedProfit = (totalExpectedValue != null && totalExpectedCost != null)
    ? totalExpectedValue - totalExpectedCost
    : null;

  return {
    ...row,
    branchName: row.name,
    projectName: row.name || row.project_name,
    currentProfitRate: row.actual_profit_rate,
    expectedProfitRate: row.total_expected_profit_rate,
    currentProfit,
    expectedProfit,
    selfOperatedValue: row.actual_value,
    onSiteExpense: row.actual_cost,
    collectionRate: row.collection_rate,
    measurementConfirmRate: row.measurement_confirm_rate,
    valueConfirmRate: row.value_confirm_rate,
    receivedAmount: row.received,
    unreceivedAmount: row.unreceived,
  };
}

export async function getOverview(month) {
  const dao = await getDao();

  const branches = await dao.all('SELECT * FROM branches ORDER BY sort_order');

  const branchDetails = [];
  for (const branch of branches) {
    const detail = await getBranchDetail(branch.id, month);
    branchDetails.push(enrichRow({
      ...branch,
      ...detail.summary,
      projectCount: detail.projects.length,
    }));
  }

  const companySummary = enrichRow(aggregateCompany(branchDetails));

  return {
    month,
    company: companySummary,
    branches: branchDetails,
  };
}

export async function getBranchDetail(branchId, month) {
  const dao = await getDao();

  const branch = await dao.get('SELECT * FROM branches WHERE id = ?', [branchId]);
  if (!branch) throw new Error('Branch not found');

  const projects = await dao.all(
    `SELECT p.*, m.exchange_rate, m.contract_general, m.contract_self,
      m.bid_cost_general, m.bid_cost_self, m.standard_cost_general, m.standard_cost_self,
      m.bid_profit_rate, m.price_diff_rate, m.baseline_benefit_rate, m.responsibility_profit_rate,
      m.owner_confirmed_value, m.actual_value, m.actual_cost, m.actual_profit_rate,
      m.measurement_confirm_rate, m.value_confirm_rate,
      m.later_expected_value, m.later_forecast_cost, m.later_forecast_profit_rate,
      m.total_expected_value, m.total_expected_cost, m.total_expected_profit_rate,
      m.receivable, m.received, m.unreceived, m.collection_rate
    FROM projects p
    INNER JOIN monthly_cost_data m ON p.id = m.project_id AND m.year_month = ?
    WHERE p.branch_id = ?
    ORDER BY p.sort_order`,
    [month, branchId],
  );

  const projectsWithRates = projects.map((p) => enrichRow(calculateRates(p)));
  const summary = enrichRow({ ...aggregateBranch(projectsWithRates), name: branch.name });

  return {
    branch,
    projects: projectsWithRates,
    summary,
  };
}

export async function getProjectDetail(projectId, month) {
  const dao = await getDao();

  const project = await dao.get(
    `SELECT p.*, b.name as branch_name, m.exchange_rate, m.contract_general, m.contract_self,
      m.bid_cost_general, m.bid_cost_self, m.standard_cost_general, m.standard_cost_self,
      m.bid_profit_rate, m.price_diff_rate, m.baseline_benefit_rate, m.responsibility_profit_rate,
      m.owner_confirmed_value, m.actual_value, m.actual_cost, m.actual_profit_rate,
      m.measurement_confirm_rate, m.value_confirm_rate,
      m.later_expected_value, m.later_forecast_cost, m.later_forecast_profit_rate,
      m.total_expected_value, m.total_expected_cost, m.total_expected_profit_rate,
      m.receivable, m.received, m.unreceived, m.collection_rate
    FROM projects p
    INNER JOIN branches b ON p.branch_id = b.id
    INNER JOIN monthly_cost_data m ON p.id = m.project_id AND m.year_month = ?
    WHERE p.id = ?`,
    [month, projectId],
  );

  if (!project) throw new Error('Project not found');

  return enrichRow(calculateRates(project));
}

export async function getAvailableMonths() {
  const dao = await getDao();
  const rows = await dao.all(
    "SELECT DISTINCT year_month FROM monthly_cost_data ORDER BY year_month DESC",
  );
  return rows.map((r) => r.year_month);
}

export async function getAnnualData(year) {
  const dao = await getDao();
  const yearPrefix = `${year}-`;

  const monthRows = await dao.all(
    "SELECT DISTINCT year_month FROM monthly_cost_data WHERE year_month LIKE ? ORDER BY year_month ASC",
    [`${yearPrefix}%`],
  );
  const months = monthRows.map((r) => r.year_month);

  if (months.length === 0) {
    return { year, months: [], monthlyData: [], branchTrends: [] };
  }

  const branches = await dao.all('SELECT * FROM branches ORDER BY sort_order');

  const monthlyData = [];
  for (const month of months) {
    const branchDetails = [];
    for (const branch of branches) {
      const detail = await getBranchDetail(branch.id, month);
      branchDetails.push(enrichRow({
        ...branch,
        ...detail.summary,
        projectCount: detail.projects.length,
      }));
    }
    const companySummary = enrichRow(aggregateCompany(branchDetails));
    monthlyData.push({
      month,
      company: companySummary,
      branches: branchDetails,
    });
  }

  const branchTrends = branches.map((branch) => {
    const trend = months.map((month, idx) => {
      const b = monthlyData[idx].branches.find((bd) => bd.id === branch.id);
      return {
        month,
        currentProfitRate: b?.currentProfitRate ?? null,
        expectedProfitRate: b?.expectedProfitRate ?? null,
        currentProfit: b?.currentProfit ?? null,
        expectedProfit: b?.expectedProfit ?? null,
        selfOperatedValue: b?.selfOperatedValue ?? null,
        actualCost: b?.actual_cost ?? null,
        collectionRate: b?.collectionRate ?? null,
        measurementConfirmRate: b?.measurementConfirmRate ?? null,
        valueConfirmRate: b?.valueConfirmRate ?? null,
        receivedAmount: b?.receivedAmount ?? null,
        unreceivedAmount: b?.unreceivedAmount ?? null,
      };
    });
    return {
      branchId: branch.id,
      branchName: branch.name,
      trend,
    };
  });

  return {
    year,
    months,
    monthlyData,
    branchTrends,
  };
}
