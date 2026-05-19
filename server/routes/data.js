import { Router } from 'express';
import { getDao } from '../db/index.js';
import { getOverview, getBranchDetail, getProjectDetail, getAvailableMonths, getAnnualData } from '../services/costService.js';

const router = Router();

async function getDefaultMonth() {
  const months = await getAvailableMonths();
  return months.length > 0 ? months[0] : null;
}

router.get('/branches', async (req, res, next) => {
  try {
    const dao = await getDao();
    const branches = await dao.all('SELECT * FROM branches ORDER BY sort_order');
    res.json({ success: true, data: branches });
  } catch (err) {
    next(err);
  }
});

router.get('/branches/:id/projects', async (req, res, next) => {
  try {
    const dao = await getDao();
    const projects = await dao.all(
      'SELECT * FROM projects WHERE branch_id = ? ORDER BY sort_order',
      [req.params.id],
    );
    res.json({ success: true, data: projects });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/overview', async (req, res, next) => {
  try {
    const month = req.query.month || await getDefaultMonth();
    if (!month) return res.json({ success: true, data: null });
    const data = await getOverview(month);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/branch/:id', async (req, res, next) => {
  try {
    const month = req.query.month || await getDefaultMonth();
    if (!month) return res.json({ success: true, data: null });
    const data = await getBranchDetail(parseInt(req.params.id), month);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/project/:id', async (req, res, next) => {
  try {
    const month = req.query.month || await getDefaultMonth();
    if (!month) return res.json({ success: true, data: null });
    const data = await getProjectDetail(parseInt(req.params.id), month);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/months', async (req, res, next) => {
  try {
    const data = await getAvailableMonths();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

router.get('/dashboard/annual', async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    if (!/^\d{4}$/.test(String(year))) {
      return res.status(400).json({ success: false, message: '年份格式无效' });
    }
    const data = await getAnnualData(year);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export default router;
