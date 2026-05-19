import config from '../config.js';
import SqlJsDao from './sqljs-dao.js';

let daoInstance = null;
let initPromise = null;

export async function getDao() {
  if (daoInstance) return daoInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (daoInstance) return daoInstance;

    if (config.db.mode === 'sqljs') {
      daoInstance = new SqlJsDao();
    } else {
      throw new Error(`Unsupported DB mode: ${config.db.mode}`);
    }

    await daoInstance.init(config.db.path, config.sqljs.wasmPath);
    return daoInstance;
  })();

  return initPromise;
}

export async function closeDao() {
  if (daoInstance) {
    await daoInstance.close();
    daoInstance = null;
  }
}
