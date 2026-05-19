import XLSX from 'xlsx';

const CHINESE_NUMERAL_RE = /^[一二三四五六七八九十]+$/;

const SKIP_KEYWORDS = [
  '需求', '修改需求', '日期选择', '日期筛选', '显示', '隐藏',
  '表头', '冻结', '计算逻辑', '编号', '汇总黄色', '注：',
];

const COLUMN_MAP = {
  1: 'seq',
  2: 'project_name',
  3: 'exchange_rate',
  4: 'contract_general',
  5: 'contract_self',
  6: 'bid_cost_general',
  7: 'bid_cost_self',
  8: 'standard_cost_general',
  9: 'standard_cost_self',
  10: 'bid_profit_rate',
  11: 'price_diff_rate',
  12: 'baseline_benefit_rate',
  13: 'responsibility_profit_rate',
  14: 'owner_confirmed_value',
  15: 'actual_value',
  16: 'actual_cost',
  17: 'actual_profit_rate',
  18: 'measurement_confirm_rate',
  19: 'value_confirm_rate',
  20: 'later_expected_value',
  21: 'later_forecast_cost',
  22: 'later_forecast_profit_rate',
  23: 'total_expected_value',
  24: 'total_expected_cost',
  25: 'total_expected_profit_rate',
  26: 'receivable',
  27: 'received',
  28: 'unreceived',
  29: 'collection_rate',
};

function toNumber(val) {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).trim();
  if (!s) return null;
  if (s === '/' || s === '未上线' || s === '汇总' || s === '汇总黄色' || s === '取数') return null;
  if (s.includes('取数') || s.includes('公式') || s.includes('注：') || s.includes('新增')) return null;
  if (s.startsWith('=')) return null;
  const num = Number(s.replace(/,/g, ''));
  return Number.isNaN(num) ? null : num;
}

function isHeaderOrMetaRow(row) {
  if (!row || row.length < 3) return true;
  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').trim();
  const col2 = String(row[2] || '').trim();
  if (!col0 && !col1 && !col2) return true;
  for (const kw of SKIP_KEYWORDS) {
    if (col0.includes(kw) || col1.includes(kw) || col2.includes(kw)) return true;
  }
  if (['序号'].includes(col1)) return true;
  if (['汇率'].includes(col2)) return true;
  const headerKeywords = ['目标管理数据', '自营部分开累', '自营部分后期', '自营部分预计总', '收款及支出', '总包（不含税）', '自营（不含税）'];
  for (const kw of headerKeywords) {
    for (let i = 2; i < Math.min(row.length, 30); i++) {
      if (String(row[i] || '').includes(kw)) return true;
    }
  }
  return false;
}

function isBranchRow(row) {
  if (!row || row.length < 3) return false;
  if (isHeaderOrMetaRow(row)) return false;
  const seq = String(row[1] || '').trim();
  if (!CHINESE_NUMERAL_RE.test(seq)) return false;
  const name = String(row[2] || '').trim();
  return name.length > 0 && !name.includes('汇总');
}

function isCompanyTotalRow(row) {
  if (!row || row.length < 3) return false;
  if (isHeaderOrMetaRow(row)) return false;
  const col0 = String(row[0] || '').trim();
  const col1 = String(row[1] || '').trim();
  const name = String(row[2] || '').trim();
  return col0.includes('全公司') || col1.includes('汇总') || name.includes('汇总');
}

function isProjectRow(row) {
  if (!row || row.length < 3) return false;
  if (isHeaderOrMetaRow(row)) return false;
  if (isBranchRow(row)) return false;
  if (isCompanyTotalRow(row)) return false;
  const name = String(row[2] || '').trim();
  if (!name || name === '/') return false;
  const seq = String(row[1] || '').trim();
  if (seq && /^\d+$/.test(seq)) return true;
  if (name && name !== '/' && name !== '序号' && name !== '汇率') return true;
  return false;
}

function parseRow(row) {
  const data = {};
  for (const [colIdx, fieldName] of Object.entries(COLUMN_MAP)) {
    const idx = parseInt(colIdx);
    if (fieldName === 'seq') {
      data[fieldName] = String(row[idx] || '').trim();
    } else if (fieldName === 'project_name') {
      data[fieldName] = String(row[idx] || '').trim();
    } else {
      data[fieldName] = toNumber(row[idx]);
    }
  }
  return data;
}

export function parseSheetNameToMonth(sheetName) {
  const match = sheetName.match(/(\d{4})年(\d{1,2})月/);
  if (!match) return null;
  const year = match[1];
  const month = match[2].padStart(2, '0');
  return `${year}-${month}`;
}

export function extractMonths(filePath) {
  const workbook = XLSX.readFile(filePath);
  const months = [];
  for (const name of workbook.SheetNames) {
    const month = parseSheetNameToMonth(name);
    if (month) {
      months.push(month);
    }
  }
  months.sort();
  return months;
}

export function parseCostTable(filePath, targetSheetName) {
  const workbook = XLSX.readFile(filePath);

  let sheetName;
  if (targetSheetName) {
    sheetName = targetSheetName;
  } else {
    const monthSheet = workbook.SheetNames.find((name) => parseSheetNameToMonth(name));
    if (monthSheet) {
      sheetName = monthSheet;
    } else {
      sheetName = workbook.SheetNames.find(
        (name) => name.includes('总表台账') || name.includes('总部权限'),
      ) || workbook.SheetNames[0];
    }
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return {
      sheetName,
      yearMonth: parseSheetNameToMonth(sheetName),
      companyTotal: null,
      branches: [],
      projects: [],
      rawData: [],
    };
  }

  const allRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  const result = {
    sheetName,
    yearMonth: parseSheetNameToMonth(sheetName),
    companyTotal: null,
    branches: [],
    projects: [],
    rawData: [],
  };

  let currentBranch = null;

  for (let i = 0; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row || row.length < 3) continue;
    if (isHeaderOrMetaRow(row)) continue;

    if (isCompanyTotalRow(row)) {
      result.companyTotal = parseRow(row);
      continue;
    }

    if (isBranchRow(row)) {
      const name = String(row[2] || '').trim();
      const existing = result.branches.find((b) => b.name === name);
      if (existing) {
        currentBranch = existing;
      } else {
        currentBranch = { name, summary: parseRow(row) };
        result.branches.push(currentBranch);
      }
      continue;
    }

    if (isProjectRow(row)) {
      const projectData = parseRow(row);
      projectData.branch_name = currentBranch ? currentBranch.name : '未知分公司';
      const exchangeRate = String(row[3] || '').trim();
      projectData.is_online = (exchangeRate === '未上线' || exchangeRate === '项目未上线' || exchangeRate === '/') ? 0 : 1;
      result.projects.push(projectData);
    }
  }

  result.rawData = allRows.filter((row) => row && row.length >= 3);

  return result;
}

export function parseAllSheets(filePath) {
  const workbook = XLSX.readFile(filePath);
  const results = {};

  for (const name of workbook.SheetNames) {
    const month = parseSheetNameToMonth(name);
    if (!month) continue;
    results[month] = parseCostTable(filePath, name);
  }

  return results;
}

export function parseExcel(filePath) {
  const allSheets = parseAllSheets(filePath);
  const months = Object.keys(allSheets).sort();
  if (months.length > 0) {
    return allSheets[months[0]];
  }
  return parseCostTable(filePath);
}
