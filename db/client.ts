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
      `);
      return db;
    });
  }
  return dbPromise;
}

export function resetDbForTests(): void {
  dbPromise = null;
}
