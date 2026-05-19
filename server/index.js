import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import config from './config.js';
import { initDatabase } from './db/init.js';
import { seedData } from './db/seed.js';
import { closeDao } from './db/index.js';
import dataRoutes from './routes/data.js';
import importRoutes from './routes/import.js';
import settingsRoutes from './routes/settings.js';
import errorHandler from './middleware/errorHandler.js';
import convertKeys from './utils/camelCase.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = (body) => originalJson(convertKeys(body));
  next();
});

app.use('/api', dataRoutes);
app.use('/api/import', importRoutes);
app.use('/api', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

const staticDir = config.static.dir;
if (fs.existsSync(staticDir)) {
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(staticDir, 'index.html'));
    }
  });
}

app.use(errorHandler);

async function start() {
  try {
    fs.mkdirSync(path.dirname(config.db.path), { recursive: true });
    fs.mkdirSync(config.uploads.dir, { recursive: true });

    const uploadFiles = fs.readdirSync(config.uploads.dir);
    for (const file of uploadFiles) {
      try { fs.unlinkSync(path.join(config.uploads.dir, file)); } catch {}
    }
    if (uploadFiles.length > 0) {
      console.log(`Cleaned up ${uploadFiles.length} file(s) from uploads directory`);
    }

    await initDatabase();

    const { getDao } = await import('./db/index.js');
    const dao = await getDao();
    const projectCount = await dao.get('SELECT COUNT(*) as cnt FROM projects');
    if (projectCount.cnt === 0) {
      console.log('No project data found, running seed...');
      await seedData();
    }

    const staleLogs = await dao.run(
      "DELETE FROM import_logs WHERE status = 'pending'"
    );
    if (staleLogs.changes > 0) {
      console.log(`Cleaned up ${staleLogs.changes} stale pending import logs`);
    }

    const expiredLogs = await dao.run(
      "DELETE FROM import_logs WHERE imported_at < datetime('now', 'localtime', '-90 days')"
    );
    if (expiredLogs.changes > 0) {
      console.log(`Cleaned up ${expiredLogs.changes} import logs older than 90 days`);
    }

    app.listen(config.port, () => {
      console.log(`Cost Dashboard server running on http://localhost:${config.port}`);
      console.log(`DB mode: ${config.db.mode}`);
      console.log(`DB path: ${config.db.path}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await closeDao();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  await closeDao();
  process.exit(0);
});

start();
