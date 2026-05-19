import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isPortableBundle = path.basename(__filename) === 'server.bundle.js';
const APP_ROOT = isPortableBundle ? __dirname : path.resolve(__dirname, '..');
const DATA_ROOT = isPortableBundle ? path.resolve(__dirname, '..') : APP_ROOT;

const config = {
  port: process.env.PORT || 3113,
  db: {
    mode: process.env.DB_MODE || 'sqljs',
    path: process.env.DB_PATH
      ? path.resolve(process.env.DB_PATH)
      : path.resolve(DATA_ROOT, 'data/cost_dashboard.db'),
  },
  uploads: {
    dir: process.env.UPLOADS_DIR
      ? path.resolve(process.env.UPLOADS_DIR)
      : path.resolve(DATA_ROOT, 'uploads'),
    maxSize: 50 * 1024 * 1024,
  },
  static: {
    dir: path.resolve(APP_ROOT, isPortableBundle ? 'dist-frontend' : 'dist'),
  },
  sqljs: {
    wasmPath: isPortableBundle
      ? path.resolve(APP_ROOT, 'sql-wasm.wasm')
      : path.resolve(APP_ROOT, 'node_modules/sql.js/dist/sql-wasm.wasm'),
  },
};

export default config;
