// db/fasts.ts
import { getDb } from './client';

export type Fast = {
  id: number;
  startAt: string;
  endAt: string | null;
  goalHours: number;
  scheduleType: string;
  notes: string | null;
};

export type CompletedFast = Fast & { endAt: string };

type FastRow = {
  id: number;
  start_at: string;
  end_at: string | null;
  goal_hours: number;
  schedule_type: string;
  notes: string | null;
};

function rowToFast(row: FastRow): Fast {
  return {
    id: row.id,
    startAt: row.start_at,
    endAt: row.end_at,
    goalHours: row.goal_hours,
    scheduleType: row.schedule_type,
    notes: row.notes,
  };
}

export async function getActiveFast(): Promise<Fast | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<FastRow>(
    'SELECT * FROM fasts WHERE end_at IS NULL LIMIT 1'
  );
  return row ? rowToFast(row) : null;
}

export async function startFast(goalHours: number, scheduleType: string): Promise<Fast> {
  const active = await getActiveFast();
  if (active) {
    throw new Error('A fast is already active');
  }
  const db = await getDb();
  const startAt = new Date().toISOString();
  let result;
  try {
    result = await db.runAsync(
      'INSERT INTO fasts (start_at, goal_hours, schedule_type) VALUES (?, ?, ?)',
      startAt,
      goalHours,
      scheduleType
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      throw new Error('A fast is already active');
    }
    throw err;
  }
  return {
    id: result.lastInsertRowId,
    startAt,
    endAt: null,
    goalHours,
    scheduleType,
    notes: null,
  };
}

export async function endFast(id: number): Promise<Fast> {
  const db = await getDb();
  const endAt = new Date().toISOString();
  await db.runAsync('UPDATE fasts SET end_at = ? WHERE id = ?', endAt, id);
  const row = await db.getFirstAsync<FastRow>('SELECT * FROM fasts WHERE id = ?', id);
  if (!row) {
    throw new Error(`Fast ${id} not found`);
  }
  return rowToFast(row);
}

export async function listFasts(): Promise<CompletedFast[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FastRow>(
    'SELECT * FROM fasts WHERE end_at IS NOT NULL ORDER BY start_at DESC, id DESC'
  );
  return rows.map((row) => rowToFast(row) as CompletedFast);
}
