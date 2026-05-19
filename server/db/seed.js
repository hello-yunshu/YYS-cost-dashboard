import { getDao } from './index.js';

const SAMPLE_PROJECTS = {
  '安装公司': [
    { name: '城市综合体机电安装项目', is_online: 1 },
    { name: '地铁通风空调工程', is_online: 1 },
    { name: '医院消防安装工程', is_online: 1 },
  ],
  '老挝公司': [
    { name: '万象输变电线路项目', is_online: 1 },
    { name: '琅勃拉邦水电站项目', is_online: 1 },
  ],
  '大洋洲公司': [
    { name: '悉尼商业中心幕墙项目', is_online: 1 },
    { name: '墨尔本基础设施项目', is_online: 1 },
    { name: '奥克兰住宅开发项目', is_online: 0 },
  ],
  '印尼公司': [
    { name: '雅加达电厂建设项目', is_online: 1 },
    { name: '苏门答腊矿业基础设施', is_online: 1 },
  ],
  '马来公司': [
    { name: '吉隆坡地铁隧道项目', is_online: 1 },
    { name: '槟城桥梁工程', is_online: 1 },
    { name: '柔佛工业厂房项目', is_online: 1 },
  ],
  '北非公司': [
    { name: '阿尔及利亚住房建设项目', is_online: 1 },
    { name: '摩洛哥光伏电站项目', is_online: 1 },
  ],
  '装饰公司': [
    { name: '五星级酒店装修项目', is_online: 1 },
    { name: '商业综合体精装修工程', is_online: 1 },
    { name: '写字楼公共区域装饰', is_online: 0 },
  ],
};

function generateCostData(projectName, branchName) {
  const seed = projectName.length + branchName.length;
  const rand = (min, max) => {
    const x = Math.sin(seed * 9301 + min * 49297 + max * 233) * 10000;
    return Math.round((x - Math.floor(x)) * (max - min) + min);
  };

  const contractSelf = rand(5000, 80000);
  const contractGeneral = Math.round(contractSelf * rand(11, 18) / 10);
  const bidCostSelf = Math.round(contractSelf * rand(75, 92) / 100);
  const bidCostGeneral = Math.round(contractGeneral * rand(75, 92) / 100);
  const standardCostSelf = Math.round(contractSelf * rand(70, 88) / 100);
  const standardCostGeneral = Math.round(contractGeneral * rand(70, 88) / 100);

  const actualValue = Math.round(contractSelf * rand(30, 80) / 100);
  const actualCost = Math.round(actualValue * rand(75, 98) / 100);
  const ownerConfirmedValue = Math.round(actualValue * rand(80, 100) / 100);

  const laterExpectedValue = Math.round(contractSelf * rand(20, 60) / 100);
  const laterForecastCost = Math.round(laterExpectedValue * rand(78, 95) / 100);

  const totalExpectedValue = actualValue + laterExpectedValue;
  const totalExpectedCost = actualCost + laterForecastCost;

  const receivable = Math.round(actualValue * rand(85, 105) / 100);
  const received = Math.round(receivable * rand(50, 90) / 100);

  const actualProfitRate = actualValue > 0 ? (actualValue - actualCost) / actualValue : 0;
  const laterForecastProfitRate = laterExpectedValue > 0 ? (laterExpectedValue - laterForecastCost) / laterExpectedValue : 0;
  const totalExpectedProfitRate = totalExpectedValue > 0 ? (totalExpectedValue - totalExpectedCost) / totalExpectedValue : 0;
  const collectionRate = receivable > 0 ? received / receivable : 0;
  const measurementConfirmRate = actualCost > 0 ? ownerConfirmedValue / actualCost : 0;
  const valueConfirmRate = actualValue > 0 ? ownerConfirmedValue / actualValue : 0;
  const bidProfitRate = contractSelf > 0 ? (contractSelf - bidCostSelf) / contractSelf : 0;

  return {
    exchange_rate: 1.0,
    contract_general: contractGeneral,
    contract_self: contractSelf,
    bid_cost_general: bidCostGeneral,
    bid_cost_self: bidCostSelf,
    standard_cost_general: standardCostGeneral,
    standard_cost_self: standardCostSelf,
    bid_profit_rate: Math.round(bidProfitRate * 10000) / 10000,
    price_diff_rate: Math.round(rand(2, 8) / 10000),
    baseline_benefit_rate: Math.round(rand(5, 15) / 10000),
    responsibility_profit_rate: Math.round(rand(8, 20) / 10000),
    owner_confirmed_value: ownerConfirmedValue,
    actual_value: actualValue,
    actual_cost: actualCost,
    actual_profit_rate: Math.round(actualProfitRate * 10000) / 10000,
    measurement_confirm_rate: Math.round(measurementConfirmRate * 10000) / 10000,
    value_confirm_rate: Math.round(valueConfirmRate * 10000) / 10000,
    later_expected_value: laterExpectedValue,
    later_forecast_cost: laterForecastCost,
    later_forecast_profit_rate: Math.round(laterForecastProfitRate * 10000) / 10000,
    total_expected_value: totalExpectedValue,
    total_expected_cost: totalExpectedCost,
    total_expected_profit_rate: Math.round(totalExpectedProfitRate * 10000) / 10000,
    receivable,
    received,
    unreceived: receivable - received,
    collection_rate: Math.round(collectionRate * 10000) / 10000,
  };
}

export async function seedData() {
  const dao = await getDao();

  const projectCount = await dao.get('SELECT COUNT(*) as cnt FROM projects');
  if (projectCount.cnt > 0) {
    console.log('Projects already exist, skipping seed');
    return;
  }

  const branches = await dao.all('SELECT * FROM branches ORDER BY sort_order');
  const branchMap = {};
  branches.forEach((b) => {
    branchMap[b.name] = b.id;
  });

  const months = ['2025-12', '2026-01'];

  for (const [branchName, projects] of Object.entries(SAMPLE_PROJECTS)) {
    const branchId = branchMap[branchName];
    if (!branchId) continue;

    for (let i = 0; i < projects.length; i++) {
      const proj = projects[i];
      await dao.run(
        'INSERT INTO projects (branch_id, name, is_online, is_approved, sort_order) VALUES (?, ?, ?, 1, ?)',
        [branchId, proj.name, proj.is_online, i + 1],
      );

      const inserted = await dao.get(
        'SELECT id FROM projects WHERE branch_id = ? AND name = ? ORDER BY id DESC LIMIT 1',
        [branchId, proj.name],
      );

      const projectId = inserted ? inserted.id : null;
      if (!projectId) continue;

      for (const month of months) {
        const costData = generateCostData(proj.name, branchName);
        const fields = Object.keys(costData);
        const values = Object.values(costData);
        const placeholders = fields.map(() => '?').join(', ');
        const colNames = fields.join(', ');

        await dao.run(
          `INSERT INTO monthly_cost_data (project_id, year_month, ${colNames}) VALUES (?, ?, ${placeholders})`,
          [projectId, month, ...values],
        );
      }
    }
  }

  await dao.run(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('current_month', '2026-01', datetime('now', 'localtime'))",
  );
  await dao.run(
    "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('company_name', '', datetime('now', 'localtime'))",
  );

  console.log('Seed data inserted successfully');
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  import('./init.js').then(({ initDatabase }) => initDatabase())
    .then(() => seedData())
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
