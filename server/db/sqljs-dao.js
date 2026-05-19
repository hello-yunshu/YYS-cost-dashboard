import initSqlJs from 'sql.js';
import fs from 'fs/promises';
import path from 'path';

const DEBOUNCE_MS = 500;

export default class SqlJsDao {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this._persistTimer = null;
    this._persistPromise = null;
  }

  async init(dbPath, wasmPath) {
    this.dbPath = dbPath;

    const dir = path.dirname(dbPath);
    await fs.mkdir(dir, { recursive: true });

    const SQL = await initSqlJs({
      locateFile: (file) => (file === 'sql-wasm.wasm' && wasmPath
        ? wasmPath
        : path.resolve(process.cwd(), 'node_modules/sql.js/dist', file)),
    });

    let buffer = null;
    try {
      buffer = await fs.readFile(dbPath);
    } catch {
      buffer = null;
    }

    if (buffer) {
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
      await this._persistNow();
    }
  }

  async _persistNow() {
    if (!this.db || !this.dbPath) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    await fs.writeFile(this.dbPath, buffer);
  }

  _schedulePersist() {
    if (this._persistTimer) clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(async () => {
      this._persistTimer = null;
      try {
        await this._persistNow();
      } catch (err) {
        console.error('Failed to persist database:', err);
      }
    }, DEBOUNCE_MS);
  }

  async flush() {
    if (this._persistTimer) {
      clearTimeout(this._persistTimer);
      this._persistTimer = null;
    }
    await this._persistNow();
  }

  async close() {
    if (this.db) {
      if (this._persistTimer) {
        clearTimeout(this._persistTimer);
        this._persistTimer = null;
      }
      await this._persistNow();
      this.db.close();
      this.db = null;
    }
  }

  async run(sql, params = []) {
    this.db.run(sql, params);
    this._schedulePersist();
    return { changes: this.db.getRowsModified() };
  }

  async get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    let result = null;
    try {
      stmt.bind(params);
      if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        result = {};
        columns.forEach((col, i) => {
          result[col] = values[i];
        });
      }
    } finally {
      stmt.free();
    }
    return result;
  }

  async all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const results = [];
    try {
      stmt.bind(params);
      while (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const row = {};
        columns.forEach((col, i) => {
          row[col] = values[i];
        });
        results.push(row);
      }
    } finally {
      stmt.free();
    }
    return results;
  }
}
