import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import config from '../config.js';
import { getDao } from '../db/index.js';
import { parseAndValidate, importData, storePreview, getPreview, deletePreview } from '../services/importService.js';

function fixFilename(name) {
  try {
    return Buffer.from(name, 'latin1').toString('utf8');
  } catch {
    return name;
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploads.dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = crypto.randomUUID();
    cb(null, `${name}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: config.uploads.maxSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('仅支持 .xlsx 或 .xls 格式文件'));
    }
  },
});

const router = Router();

router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请上传文件' });
    }

    const originalname = fixFilename(req.file.originalname);

    const { parsedByMonth, parsed, validation, availableMonths } = await parseAndValidate(req.file.path);

    const previewId = crypto.randomUUID();
    storePreview(previewId, {
      parsedByMonth,
      parsed,
      filePath: req.file.path,
      filename: originalname,
      fileSize: req.file.size,
    });

    const firstParsed = parsed;

    res.json({
      success: true,
      data: {
        previewId,
        filename: originalname,
        fileSize: req.file.size,
        branchCount: firstParsed?.branches?.length || 0,
        projectCount: firstParsed?.projects?.length || 0,
        validation,
        availableMonths,
      },
    });
  } catch (err) {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    next(err);
  }
});

router.get('/preview/:id', async (req, res, next) => {
  try {
    const preview = getPreview(req.params.id);
    if (!preview) {
      return res.status(404).json({ success: false, message: '预览数据已过期，请重新上传' });
    }
    res.json({
      success: true,
      data: {
        branches: preview.parsed?.branches,
        projectCount: preview.parsed?.projects?.length || 0,
        projects: preview.parsed?.projects?.slice(0, 20),
        companyTotal: preview.parsed?.companyTotal,
        availableMonths: Object.keys(preview.parsedByMonth || {}).sort(),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm', async (req, res, next) => {
  try {
    const { previewId, yearMonth } = req.body;
    if (!previewId || !yearMonth) {
      return res.status(400).json({ success: false, message: '缺少 previewId 或 yearMonth' });
    }

    const preview = getPreview(previewId);
    if (!preview) {
      return res.status(404).json({ success: false, message: '预览数据已过期，请重新上传' });
    }

    const monthParsed = preview.parsedByMonth?.[yearMonth] || preview.parsed;
    if (!monthParsed) {
      return res.status(400).json({ success: false, message: `未找到 ${yearMonth} 的数据` });
    }

    const dao = await getDao();
    await dao.run(
      "INSERT INTO import_logs (filename, file_size, year_month, status) VALUES (?, ?, ?, 'processing')",
      [preview.filename, preview.fileSize, yearMonth],
    );
    const inserted = await dao.get(
      'SELECT id FROM import_logs ORDER BY id DESC LIMIT 1',
    );
    const logId = inserted ? inserted.id : null;

    const result = await importData(monthParsed, yearMonth, logId);

    if (Object.keys(preview.parsedByMonth || {}).length <= 1) {
      deletePreview(previewId);
    }

    await dao.flush();

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/confirm-all', async (req, res, next) => {
  try {
    const { previewId } = req.body;
    if (!previewId) {
      return res.status(400).json({ success: false, message: '缺少 previewId' });
    }

    const preview = getPreview(previewId);
    if (!preview) {
      return res.status(404).json({ success: false, message: '预览数据已过期，请重新上传' });
    }

    const months = Object.keys(preview.parsedByMonth || {}).sort();
    if (!months || months.length === 0) {
      return res.status(400).json({ success: false, message: '未从文件中检测到可用月份' });
    }

    const dao = await getDao();
    const results = [];
    let totalRows = 0;

    for (const yearMonth of months) {
      const monthParsed = preview.parsedByMonth[yearMonth];
      if (!monthParsed) {
        results.push({ yearMonth, success: false, error: '未找到该月数据' });
        continue;
      }

      await dao.run(
        "INSERT INTO import_logs (filename, file_size, year_month, status) VALUES (?, ?, ?, 'processing')",
        [preview.filename, preview.fileSize, yearMonth],
      );
      const inserted = await dao.get('SELECT id FROM import_logs ORDER BY id DESC LIMIT 1');
      const logId = inserted ? inserted.id : null;

      try {
        const result = await importData(monthParsed, yearMonth, logId);
        results.push({ yearMonth, success: true, rowCount: result.rowCount });
        totalRows += result.rowCount;
      } catch (err) {
        results.push({ yearMonth, success: false, error: err.message });
      }
    }

    deletePreview(previewId);
    await dao.flush();

    res.json({ success: true, data: { months: results, totalRows, totalMonths: months.length } });
  } catch (err) {
    next(err);
  }
});

router.post('/cancel', async (req, res, next) => {
  try {
    const { previewId } = req.body;
    if (previewId) {
      deletePreview(previewId);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const dao = await getDao();
    const logs = await dao.all(
      'SELECT * FROM import_logs ORDER BY imported_at DESC LIMIT 50',
    );
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const dao = await getDao();
    const log = await dao.get('SELECT * FROM import_logs WHERE id = ?', [req.params.id]);
    if (!log) {
      return res.status(404).json({ success: false, message: '导入记录不存在' });
    }
    await dao.run('DELETE FROM import_logs WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    next(err);
  }
});

export default router;
