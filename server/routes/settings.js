import { Router } from 'express';
import { getDao } from '../db/index.js';

const ALLOWED_SETTINGS_KEYS = ['riskThreshold', 'amountUnit', 'current_month', 'company_name'];

const router = Router();

router.get('/settings', async (req, res, next) => {
  try {
    const dao = await getDao();
    const rows = await dao.all('SELECT key, value, updated_at FROM settings');
    const settings = {};
    rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const dao = await getDao();
    const settings = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: '无效的设置数据' });
    }

    for (const [key, value] of Object.entries(settings)) {
      if (!ALLOWED_SETTINGS_KEYS.includes(key)) continue;
      if (key === 'riskThreshold') {
        const num = Number(value);
        if (isNaN(num) || num < 0 || num > 100) continue;
      }
      await dao.run(
        "INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now', 'localtime'))",
        [key, String(value)],
      );
    }

    await dao.flush();

    res.json({ success: true, message: '设置已更新' });
  } catch (err) {
    next(err);
  }
});

router.get('/months', async (req, res, next) => {
  try {
    const dao = await getDao();
    const rows = await dao.all(
      `SELECT m.year_month, COUNT(*) as project_count,
        COALESCE(SUM(CASE WHEN m.actual_value IS NOT NULL THEN 1 ELSE 0 END), 0) as filled_count
      FROM monthly_cost_data m
      GROUP BY m.year_month
      ORDER BY m.year_month DESC`,
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

router.delete('/months/:yearMonth', async (req, res, next) => {
  try {
    const dao = await getDao();
    const { yearMonth } = req.params;
    const existing = await dao.get(
      'SELECT COUNT(*) as cnt FROM monthly_cost_data WHERE year_month = ?',
      [yearMonth],
    );
    if (existing.cnt === 0) {
      return res.status(404).json({ success: false, message: '该月份数据不存在' });
    }
    await dao.run('DELETE FROM monthly_cost_data WHERE year_month = ?', [yearMonth]);
    await dao.flush();
    res.json({ success: true, message: `已删除 ${yearMonth} 的数据`, deletedCount: existing.cnt });
  } catch (err) {
    next(err);
  }
});

router.delete('/months/year/:year', async (req, res, next) => {
  try {
    const dao = await getDao();
    const { year } = req.params;
    if (!/^\d{4}$/.test(year)) {
      return res.status(400).json({ success: false, message: '年份格式无效' });
    }
    const like = `${year}-%`;
    const existing = await dao.get(
      'SELECT COUNT(*) as cnt FROM monthly_cost_data WHERE year_month LIKE ?',
      [like],
    );
    if (existing.cnt === 0) {
      return res.status(404).json({ success: false, message: `${year} 年无数据` });
    }
    await dao.run('DELETE FROM monthly_cost_data WHERE year_month LIKE ?', [like]);
    await dao.flush();
    res.json({ success: true, message: `已删除 ${year} 年全部数据`, deletedCount: existing.cnt });
  } catch (err) {
    next(err);
  }
});

export default router;
