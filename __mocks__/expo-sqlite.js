// Jest manual mock for expo-sqlite.
//
// expo-sqlite's real implementation relies on a native JSI module that
// doesn't exist under Jest's Node environment. This mock reimplements the
// small async subset of the API this project uses (openDatabaseAsync,
// execAsync, runAsync, getFirstAsync, getAllAsync) on top of better-sqlite3,
// which is a real, synchronous SQLite engine that runs in plain Node.
//
// Each call to openDatabaseAsync with a given name returns a fresh
// in-memory database, so tests are isolated from each other as long as
// they call resetDbForTests() between runs (see db/client.ts).
const Database = require('better-sqlite3');

class MockSQLiteDatabase {
  constructor() {
    this._db = new Database(':memory:');
  }

  async execAsync(source) {
    this._db.exec(source);
  }

  async runAsync(source, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this._db.prepare(source);
    const info = stmt.run(...flatParams);
    return {
      lastInsertRowId: info.lastInsertRowid,
      changes: info.changes,
    };
  }

  async getFirstAsync(source, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this._db.prepare(source);
    const row = stmt.get(...flatParams);
    return row === undefined ? null : row;
  }

  async getAllAsync(source, ...params) {
    const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const stmt = this._db.prepare(source);
    return stmt.all(...flatParams);
  }

  async closeAsync() {
    this._db.close();
  }
}

async function openDatabaseAsync() {
  return new MockSQLiteDatabase();
}

module.exports = {
  openDatabaseAsync,
  SQLiteDatabase: MockSQLiteDatabase,
};
