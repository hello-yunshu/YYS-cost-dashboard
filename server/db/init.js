import { getDao } from './index.js';

const BRANCHES = [
  { name: '马来公司', sort_order: 1 },
  { name: '印尼公司', sort_order: 2 },
  { name: '装饰公司', sort_order: 3 },
  { name: '安装公司', sort_order: 4 },
  { name: '老挝公司', sort_order: 5 },
  { name: '中东公司', sort_order: 6 },
  { name: '大洋洲公司', sort_order: 7 },
  { name: '其他公司', sort_order: 8 },
];

export async function initDatabase() {
  const dao = await getDao();

  await dao.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  await dao.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      is_online INTEGER DEFAULT 1,
      is_approved INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `);

  await dao.run(`
    CREATE TABLE IF NOT EXISTS monthly_cost_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      year_month TEXT NOT NULL,
      exchange_rate REAL,
      contract_general REAL,
      contract_self REAL,
      bid_cost_general REAL,
      bid_cost_self REAL,
      standard_cost_general REAL,
      standard_cost_self REAL,
      bid_profit_rate REAL,
      price_diff_rate REAL,
      baseline_benefit_rate REAL,
      responsibility_profit_rate REAL,
      owner_confirmed_value REAL,
      actual_value REAL,
      actual_cost REAL,
      actual_profit_rate REAL,
      measurement_confirm_rate REAL,
      value_confirm_rate REAL,
      later_expected_value REAL,
      later_forecast_cost REAL,
      later_forecast_profit_rate REAL,
      total_expected_value REAL,
      total_expected_cost REAL,
      total_expected_profit_rate REAL,
      receivable REAL,
      received REAL,
      unreceived REAL,
      collection_rate REAL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      UNIQUE(project_id, year_month)
    )
  `);

  await dao.run(`
    CREATE TABLE IF NOT EXISTS import_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_size INTEGER,
      year_month TEXT,
      row_count INTEGER,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      imported_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  await dao.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  await dao.run(`CREATE INDEX IF NOT EXISTS idx_projects_branch ON projects(branch_id)`);
  await dao.run(`CREATE INDEX IF NOT EXISTS idx_monthly_project_month ON monthly_cost_data(project_id, year_month)`);
  await dao.run(`CREATE INDEX IF NOT EXISTS idx_monthly_year_month ON monthly_cost_data(year_month)`);
  await dao.run(`CREATE INDEX IF NOT EXISTS idx_import_logs_status ON import_logs(status)`);

  const existing = await dao.all('SELECT COUNT(*) as cnt FROM branches');
  if (existing[0].cnt === 0) {
    for (const branch of BRANCHES) {
      await dao.run('INSERT INTO branches (name, sort_order) VALUES (?, ?)', [branch.name, branch.sort_order]);
    }
  }

  console.log('Database initialized successfully');
}

if (process.argv[1] && process.argv[1].endsWith('init.js')) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database init failed:', err);
      process.exit(1);
    });
}
