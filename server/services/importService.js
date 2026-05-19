import { getDao } from '../db/index.js';
import { parseAllSheets, parseCostTable, extractMonths } from '../utils/excelParser.js';
import { validateImportData } from '../utils/validator.js';
import config from '../config.js';
import dayjs from 'dayjs';
import fs from 'fs';

const importStore = new Map();

export async function parseAndValidate(filePath) {
  const allSheets = parseAllSheets(filePath);
  const availableMonths = Object.keys(allSheets).sort();

  if (availableMonths.length === 0) {
    const parsed = parseCostTable(filePath);
    const validation = validateImportData(parsed);
    return { parsedByMonth: {}, parsed, validation, availableMonths: [] };
  }

  const parsedByMonth = {};
  let firstParsed = null;
  let combinedValidation = { valid: true, errors: [], warnings: [] };

  for (const month of availableMonths) {
    const parsed = allSheets[month];
    parsedByMonth[month] = parsed;
    if (!firstParsed) firstParsed = parsed;

    const validation = validateImportData(parsed);
    if (!validation.valid) {
      combinedValidation.valid = false;
      combinedValidation.errors.push(...validation.errors.map((e) => `[${month}] ${e}`));
    }
    if (validation.warnings?.length) {
      combinedValidation.warnings.push(...validation.warnings.map((w) => `[${month}] ${w}`));
    }
  }

  return {
    parsedByMonth,
    parsed: firstParsed,
    validation: combinedValidation,
    availableMonths,
  };
}

export async function importData(parsed, yearMonth, importLogId) {
  const dao = await getDao();

  try {
    const branches = await dao.all('SELECT * FROM branches ORDER BY sort_order');
    const branchMap = {};
    branches.forEach((b) => {
      branchMap[b.name] = b.id;
    });

    const parsedBranchNames = new Set((parsed.branches || []).map((b) => b.name));
    for (const branchName of parsedBranchNames) {
      if (!branchName || branchMap[branchName]) continue;
      const sortResult = await dao.get('SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM branches');
      await dao.run('INSERT INTO branches (name, sort_order) VALUES (?, ?)', [branchName, sortResult.next_sort]);
      const newBranch = await dao.get('SELECT * FROM branches WHERE name = ?', [branchName]);
      branchMap[branchName] = newBranch.id;
    }

    const importedProjectNames = new Set(
      (parsed.projects || []).map((p) => `${p.branch_name}::${p.project_name}`),
    );

    for (const branch of branches) {
      const existingProjects = await dao.all(
        'SELECT id, name FROM projects WHERE branch_id = ?',
        [branch.id],
      );
      for (const ep of existingProjects) {
        const key = `${branch.name}::${ep.name}`;
        if (!importedProjectNames.has(key)) {
          await dao.run('DELETE FROM monthly_cost_data WHERE project_id = ? AND year_month = ?', [ep.id, yearMonth]);
        }
      }
    }

    let rowCount = 0;

    for (const project of parsed.projects || []) {
      const branchId = branchMap[project.branch_name];
      if (!branchId) continue;

      let existingProject = await dao.get(
        'SELECT id FROM projects WHERE branch_id = ? AND name = ?',
        [branchId, project.project_name],
      );

      let projectId;
      if (existingProject) {
        projectId = existingProject.id;
        await dao.run(
          'UPDATE projects SET is_online = ?, updated_at = datetime(\'now\', \'localtime\') WHERE id = ?',
          [project.is_online, projectId],
        );
      } else {
        const sortResult = await dao.get(
          'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM projects WHERE branch_id = ?',
          [branchId],
        );
        await dao.run(
          'INSERT INTO projects (branch_id, name, is_online, is_approved, sort_order) VALUES (?, ?, ?, 1, ?)',
          [branchId, project.project_name, project.is_online, sortResult.next_sort],
        );
        const newProject = await dao.get(
          'SELECT id FROM projects WHERE branch_id = ? AND name = ? ORDER BY id DESC LIMIT 1',
          [branchId, project.project_name],
        );
        projectId = newProject ? newProject.id : null;
      }

      const existingCost = await dao.get(
        'SELECT id FROM monthly_cost_data WHERE project_id = ? AND year_month = ?',
        [projectId, yearMonth],
      );

      if (existingCost) {
        await dao.run(
          `UPDATE monthly_cost_data SET
            exchange_rate = ?, contract_general = ?, contract_self = ?,
            bid_cost_general = ?, bid_cost_self = ?,
            standard_cost_general = ?, standard_cost_self = ?,
            bid_profit_rate = ?, price_diff_rate = ?,
            baseline_benefit_rate = ?, responsibility_profit_rate = ?,
            owner_confirmed_value = ?, actual_value = ?, actual_cost = ?,
            actual_profit_rate = ?, measurement_confirm_rate = ?, value_confirm_rate = ?,
            later_expected_value = ?, later_forecast_cost = ?, later_forecast_profit_rate = ?,
            total_expected_value = ?, total_expected_cost = ?, total_expected_profit_rate = ?,
            receivable = ?, received = ?, unreceived = ?, collection_rate = ?,
            updated_at = datetime('now', 'localtime')
          WHERE id = ?`,
          [
            project.exchange_rate, project.contract_general, project.contract_self,
            project.bid_cost_general, project.bid_cost_self,
            project.standard_cost_general, project.standard_cost_self,
            project.bid_profit_rate, project.price_diff_rate,
            project.baseline_benefit_rate, project.responsibility_profit_rate,
            project.owner_confirmed_value, project.actual_value, project.actual_cost,
            project.actual_profit_rate, project.measurement_confirm_rate, project.value_confirm_rate,
            project.later_expected_value, project.later_forecast_cost, project.later_forecast_profit_rate,
            project.total_expected_value, project.total_expected_cost, project.total_expected_profit_rate,
            project.receivable, project.received, project.unreceived, project.collection_rate,
            existingCost.id,
          ],
        );
      } else {
        await dao.run(
          `INSERT INTO monthly_cost_data (
            project_id, year_month, exchange_rate,
            contract_general, contract_self, bid_cost_general, bid_cost_self,
            standard_cost_general, standard_cost_self,
            bid_profit_rate, price_diff_rate, baseline_benefit_rate, responsibility_profit_rate,
            owner_confirmed_value, actual_value, actual_cost, actual_profit_rate,
            measurement_confirm_rate, value_confirm_rate,
            later_expected_value, later_forecast_cost, later_forecast_profit_rate,
            total_expected_value, total_expected_cost, total_expected_profit_rate,
            receivable, received, unreceived, collection_rate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            projectId, yearMonth, project.exchange_rate,
            project.contract_general, project.contract_self,
            project.bid_cost_general, project.bid_cost_self,
            project.standard_cost_general, project.standard_cost_self,
            project.bid_profit_rate, project.price_diff_rate,
            project.baseline_benefit_rate, project.responsibility_profit_rate,
            project.owner_confirmed_value, project.actual_value, project.actual_cost,
            project.actual_profit_rate, project.measurement_confirm_rate, project.value_confirm_rate,
            project.later_expected_value, project.later_forecast_cost, project.later_forecast_profit_rate,
            project.total_expected_value, project.total_expected_cost, project.total_expected_profit_rate,
            project.receivable, project.received, project.unreceived, project.collection_rate,
          ],
        );
      }

      rowCount++;
    }

    await dao.run(
      `DELETE FROM projects WHERE id NOT IN (SELECT DISTINCT project_id FROM monthly_cost_data)`,
    );

    await dao.run(
      `DELETE FROM branches WHERE id NOT IN (SELECT DISTINCT branch_id FROM projects)`,
    );

    await dao.run(
      "UPDATE import_logs SET status = 'success', row_count = ? WHERE id = ?",
      [rowCount, importLogId],
    );

    return { success: true, rowCount };
  } catch (err) {
    await dao.run(
      "UPDATE import_logs SET status = 'failed', error_message = ? WHERE id = ?",
      [err.message, importLogId],
    );
    throw err;
  }
}

export function storePreview(id, data) {
  importStore.set(id, data);
  setTimeout(() => {
    const preview = importStore.get(id);
    if (preview?.filePath) {
      try { fs.unlinkSync(preview.filePath); } catch {}
    }
    importStore.delete(id);
  }, 30 * 60 * 1000);
}

export function getPreview(id) {
  return importStore.get(id) || null;
}

export function deletePreview(id) {
  const preview = importStore.get(id);
  if (preview?.filePath) {
    try { fs.unlinkSync(preview.filePath); } catch {}
  }
  importStore.delete(id);
}
