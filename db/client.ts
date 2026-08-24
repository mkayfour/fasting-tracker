import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('fasting-tracker.db').then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS fasts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          start_at TEXT NOT NULL,
          end_at TEXT,
          goal_hours REAL NOT NULL,
          schedule_type TEXT NOT NULL,
          notes TEXT
        );
        CREATE UNIQUE INDEX IF NOT EXISTS idx_fasts_one_active
          ON fasts ((end_at IS NULL))
          WHERE end_at IS NULL;
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return dbPromise;
}

export function resetDbForTests(): void {
  dbPromise = null;
}
