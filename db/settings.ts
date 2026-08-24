import { getDb } from './client';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_PREFERENCE_KEY = 'theme_preference';

export async function getThemePreference(): Promise<ThemePreference> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    THEME_PREFERENCE_KEY
  );
  if (row?.value === 'light' || row?.value === 'dark' || row?.value === 'system') {
    return row.value;
  }
  return 'system';
}

export async function setThemePreference(preference: ThemePreference): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    THEME_PREFERENCE_KEY,
    preference
  );
}
