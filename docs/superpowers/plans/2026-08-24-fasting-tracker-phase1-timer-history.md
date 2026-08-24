# Fasting Tracker — Phase 1 (Timer + History) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Expo iOS app with a working fast timer (start/stop, elapsed time that survives app restart) and a history list of past fasts, backed by local SQLite.

**Architecture:** Expo (managed, TypeScript) + React Navigation bottom tabs. All persistence goes through a thin data-access module (`db/fasts.ts`) wrapping `expo-sqlite`, so screens never touch SQL directly. Elapsed time is always recomputed from the stored `start_at` timestamp, never trusted from an in-memory interval alone, so it's correct after the app is backgrounded or killed. Global "is there an active fast right now" state lives in a small React Context (`ActiveFastContext`) built on top of `db/fasts.ts`.

**Tech Stack:** Expo SDK (TypeScript template), `expo-sqlite`, `@react-navigation/native` + `@react-navigation/bottom-tabs`, Jest + `jest-expo` for unit tests.

## Global Constraints

- iOS only for this phase (per spec's v1 scope) — no Android-specific work.
- Local storage only — no network calls, no accounts, no Firebase (per spec's non-goals).
- Visual design is minimal/Notion-like: neutral palette, one accent color, no heavy shadows/gradients. Full light and dark mode following the OS appearance setting (per spec's Visual design section).
- At most one active fast may exist at a time — enforced in the data layer, not just the UI (per spec's Error handling section).
- This is Phase 1 of a 4-phase spec (`docs/superpowers/specs/2026-08-24-fasting-tracker-design.md`). Only the `fasts` table and Timer/History screens are in scope. `weight_entries`, `settings`, Schedules, Stats, and reminders are explicitly deferred to later plans — do not build them now.

---

### Task 1: Scaffold the Expo app

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `App.tsx`, `babel.config.js` (all via the Expo template)
- Create: `jest.config.js`

**Interfaces:**
- Produces: a runnable Expo TypeScript project at the repo root, with Jest wired up so later tasks can add `*.test.ts` files under `db/`.

- [ ] **Step 1: Create the Expo TypeScript app in the current directory**

```bash
npx create-expo-app@latest . --template blank-typescript
```

Expected: project files (`App.tsx`, `app.json`, `package.json`, `tsconfig.json`, etc.) are created in the repo root.

- [ ] **Step 2: Install navigation, SQLite, and testing dependencies**

```bash
npx expo install @react-navigation/native @react-navigation/bottom-tabs react-native-screens react-native-safe-area-context expo-sqlite
npx expo install --dev jest-expo jest @types/jest ts-jest
```

- [ ] **Step 3: Add Jest config**

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

- [ ] **Step 4: Add a `test` script to `package.json`**

Edit the `"scripts"` block in `package.json` to include:

```json
"test": "jest"
```

- [ ] **Step 5: Verify the app boots**

```bash
npx expo start --ios --non-interactive &
sleep 20
```

Expected: Metro bundler starts without errors (check output, then stop the process). This confirms the scaffold is valid before building on top of it.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold Expo TypeScript app with navigation, SQLite, and Jest"
```

---

### Task 2: Theme module (light/dark, minimal palette)

**Files:**
- Create: `theme/colors.ts`
- Create: `theme/useTheme.ts`

**Interfaces:**
- Produces: `useTheme()` hook returning `{ colors, isDark }` where `colors` has keys `background`, `surface`, `text`, `textMuted`, `accent`, `border`. Later screens import this instead of hardcoding colors.

- [ ] **Step 1: Define the color tokens**

```typescript
// theme/colors.ts
export type ThemeColors = {
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
};

export const lightColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#F7F6F3',
  text: '#191919',
  textMuted: '#787774',
  accent: '#2F80ED',
  border: '#E9E9E7',
};

export const darkColors: ThemeColors = {
  background: '#191919',
  surface: '#232323',
  text: '#F1F1EF',
  textMuted: '#9B9B98',
  accent: '#5B9BF0',
  border: '#2F2F2F',
};
```

- [ ] **Step 2: Write the theme hook**

```typescript
// theme/useTheme.ts
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
```

- [ ] **Step 3: Commit**

```bash
git add theme/
git commit -m "Add light/dark theme tokens and useTheme hook"
```

---

### Task 3: SQLite client and schema migration

**Files:**
- Create: `db/client.ts`

**Interfaces:**
- Produces: `getDb(): Promise<SQLiteDatabase>` — opens (creating if needed) `fasting-tracker.db` and ensures the `fasts` table exists. All later `db/*.ts` modules call `getDb()` rather than opening their own connection.

- [ ] **Step 1: Write the client with schema setup**

```typescript
// db/client.ts
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
```

- [ ] **Step 2: Commit**

```bash
git add db/client.ts
git commit -m "Add SQLite client and fasts table schema"
```

---

### Task 4: Fasts data-access layer (TDD)

**Files:**
- Create: `db/fasts.ts`
- Test: `db/fasts.test.ts`

**Interfaces:**
- Consumes: `getDb()` from `db/client.ts` (Task 3).
- Produces:
  - `type Fast = { id: number; startAt: string; endAt: string | null; goalHours: number; scheduleType: string; notes: string | null }`
  - `startFast(goalHours: number, scheduleType: string): Promise<Fast>` — throws `Error('A fast is already active')` if one is active.
  - `endFast(id: number): Promise<Fast>`
  - `getActiveFast(): Promise<Fast | null>`
  - `listFasts(): Promise<Fast[]>` — most recent first, only completed fasts (`endAt` not null).

  Later tasks (`ActiveFastContext`, screens) call only these five exports.

- [ ] **Step 1: Write the failing tests**

```typescript
// db/fasts.test.ts
import { resetDbForTests } from './client';
import { startFast, endFast, getActiveFast, listFasts } from './fasts';

beforeEach(() => {
  resetDbForTests();
});

test('startFast creates an active fast with no end time', async () => {
  const fast = await startFast(16, '16:8');
  expect(fast.endAt).toBeNull();
  expect(fast.goalHours).toBe(16);
  expect(fast.scheduleType).toBe('16:8');
});

test('startFast throws if a fast is already active', async () => {
  await startFast(16, '16:8');
  await expect(startFast(18, '18:6')).rejects.toThrow('A fast is already active');
});

test('getActiveFast returns null when no fast is active', async () => {
  expect(await getActiveFast()).toBeNull();
});

test('getActiveFast returns the in-progress fast', async () => {
  const started = await startFast(16, '16:8');
  const active = await getActiveFast();
  expect(active?.id).toBe(started.id);
});

test('endFast sets endAt and clears the active fast', async () => {
  const started = await startFast(16, '16:8');
  const ended = await endFast(started.id);
  expect(ended.endAt).not.toBeNull();
  expect(await getActiveFast()).toBeNull();
});

test('listFasts returns completed fasts, most recent first', async () => {
  const first = await startFast(16, '16:8');
  await endFast(first.id);
  const second = await startFast(18, '18:6');
  await endFast(second.id);

  const fasts = await listFasts();
  expect(fasts.map((f) => f.id)).toEqual([second.id, first.id]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest db/fasts.test.ts
```

Expected: FAIL with "Cannot find module './fasts'" (module doesn't exist yet).

- [ ] **Step 3: Implement `db/fasts.ts`**

```typescript
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
  const result = await db.runAsync(
    'INSERT INTO fasts (start_at, goal_hours, schedule_type) VALUES (?, ?, ?)',
    startAt,
    goalHours,
    scheduleType
  );
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

export async function listFasts(): Promise<Fast[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<FastRow>(
    'SELECT * FROM fasts WHERE end_at IS NOT NULL ORDER BY start_at DESC'
  );
  return rows.map(rowToFast);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx jest db/fasts.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add db/fasts.ts db/fasts.test.ts
git commit -m "Add fasts data-access layer with active-fast constraint"
```

---

### Task 5: ActiveFastContext

**Files:**
- Create: `contexts/ActiveFastContext.tsx`

**Interfaces:**
- Consumes: `startFast`, `endFast`, `getActiveFast`, `Fast` from `db/fasts.ts` (Task 4).
- Produces:
  - `<ActiveFastProvider>` component wrapping the app.
  - `useActiveFast(): { activeFast: Fast | null; loading: boolean; start: (goalHours: number, scheduleType: string) => Promise<void>; stop: () => Promise<void> }` — the only way screens read/mutate active-fast state.

- [ ] **Step 1: Write the context and provider**

```typescript
// contexts/ActiveFastContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Fast, getActiveFast, startFast, endFast } from '../db/fasts';

type ActiveFastContextValue = {
  activeFast: Fast | null;
  loading: boolean;
  start: (goalHours: number, scheduleType: string) => Promise<void>;
  stop: () => Promise<void>;
};

const ActiveFastContext = createContext<ActiveFastContextValue | undefined>(undefined);

export function ActiveFastProvider({ children }: { children: React.ReactNode }) {
  const [activeFast, setActiveFast] = useState<Fast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveFast()
      .then(setActiveFast)
      .finally(() => setLoading(false));
  }, []);

  const start = useCallback(async (goalHours: number, scheduleType: string) => {
    const fast = await startFast(goalHours, scheduleType);
    setActiveFast(fast);
  }, []);

  const stop = useCallback(async () => {
    if (!activeFast) return;
    await endFast(activeFast.id);
    setActiveFast(null);
  }, [activeFast]);

  return (
    <ActiveFastContext.Provider value={{ activeFast, loading, start, stop }}>
      {children}
    </ActiveFastContext.Provider>
  );
}

export function useActiveFast(): ActiveFastContextValue {
  const ctx = useContext(ActiveFastContext);
  if (!ctx) {
    throw new Error('useActiveFast must be used within ActiveFastProvider');
  }
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add contexts/ActiveFastContext.tsx
git commit -m "Add ActiveFastContext for active-fast state"
```

---

### Task 6: Timer screen

**Files:**
- Create: `screens/TimerScreen.tsx`

**Interfaces:**
- Consumes: `useActiveFast()` from `contexts/ActiveFastContext.tsx` (Task 5), `useTheme()` from `theme/useTheme.ts` (Task 2).
- Produces: `TimerScreen` component, registered as a tab in Task 8.

- [ ] **Step 1: Write the screen**

Elapsed time is recomputed every second from `activeFast.startAt`, not accumulated in state, so it's always correct even after the screen remounts.

```typescript
// screens/TimerScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useActiveFast } from '../contexts/ActiveFastContext';
import { useTheme } from '../theme/useTheme';

function formatElapsed(startAt: string): string {
  const ms = Date.now() - new Date(startAt).getTime();
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':');
}

export default function TimerScreen() {
  const { activeFast, loading, start, stop } = useActiveFast();
  const { colors } = useTheme();
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!activeFast) return;
    const interval = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(interval);
  }, [activeFast]);

  if (loading) {
    return <View style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.elapsed, { color: colors.text }]}>
        {activeFast ? formatElapsed(activeFast.startAt) : '00:00:00'}
      </Text>
      <Text style={[styles.status, { color: colors.textMuted }]}>
        {activeFast ? `Fasting — goal ${activeFast.goalHours}h (${activeFast.scheduleType})` : 'Not fasting'}
      </Text>
      <Pressable
        onPress={() => (activeFast ? stop() : start(16, '16:8'))}
        style={[styles.button, { backgroundColor: colors.accent }]}
      >
        <Text style={styles.buttonText}>{activeFast ? 'End Fast' : 'Start Fast'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  elapsed: { fontSize: 48, fontVariant: ['tabular-nums'], fontWeight: '600' },
  status: { fontSize: 16, marginTop: 8, marginBottom: 32 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/TimerScreen.tsx
git commit -m "Add Timer screen with start/stop and live elapsed time"
```

---

### Task 7: History screen

**Files:**
- Create: `screens/HistoryScreen.tsx`

**Interfaces:**
- Consumes: `listFasts`, `Fast` from `db/fasts.ts` (Task 4), `useTheme()` from `theme/useTheme.ts` (Task 2), `useActiveFast()` from `contexts/ActiveFastContext.tsx` (Task 5) — refetches when `activeFast` changes so ending a fast on the Timer tab updates History.
- Produces: `HistoryScreen` component, registered as a tab in Task 8.

- [ ] **Step 1: Write the screen**

```typescript
// screens/HistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Fast, listFasts } from '../db/fasts';
import { useTheme } from '../theme/useTheme';
import { useActiveFast } from '../contexts/ActiveFastContext';

function formatDuration(startAt: string, endAt: string): string {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { activeFast } = useActiveFast();
  const [fasts, setFasts] = useState<Fast[]>([]);

  useEffect(() => {
    listFasts().then(setFasts);
  }, [activeFast]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={fasts}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.textMuted }]}>No fasts yet</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.row, { borderBottomColor: colors.border }]}>
            <Text style={[styles.date, { color: colors.text }]}>
              {new Date(item.startAt).toLocaleDateString()}
            </Text>
            <Text style={[styles.duration, { color: colors.textMuted }]}>
              {formatDuration(item.startAt, item.endAt as string)} · {item.scheduleType}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  empty: { textAlign: 'center', marginTop: 32, fontSize: 16 },
  row: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  date: { fontSize: 16, fontWeight: '600' },
  duration: { fontSize: 14, marginTop: 2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add screens/HistoryScreen.tsx
git commit -m "Add History screen listing past fasts"
```

---

### Task 8: Bottom tab navigation and app entry point

**Files:**
- Modify: `App.tsx`
- Create: `navigation/RootNavigator.tsx`

**Interfaces:**
- Consumes: `TimerScreen` (Task 6), `HistoryScreen` (Task 7), `ActiveFastProvider` (Task 5), `useTheme()` (Task 2).
- Produces: the app's root component tree — nothing further consumes this.

- [ ] **Step 1: Write the tab navigator**

```typescript
// navigation/RootNavigator.tsx
import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TimerScreen from '../screens/TimerScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { useTheme } from '../theme/useTheme';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.accent,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Timer" component={TimerScreen} />
        <Tab.Screen name="History" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 2: Wire it into the app entry point**

```typescript
// App.tsx
import React from 'react';
import { ActiveFastProvider } from './contexts/ActiveFastContext';
import RootNavigator from './navigation/RootNavigator';

export default function App() {
  return (
    <ActiveFastProvider>
      <RootNavigator />
    </ActiveFastProvider>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add App.tsx navigation/RootNavigator.tsx
git commit -m "Wire up bottom tab navigation for Timer and History"
```

---

### Task 9: Manual verification in iOS Simulator

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```bash
npx jest
```

Expected: all tests pass (6 tests from Task 4).

- [ ] **Step 2: Launch in the iOS Simulator**

```bash
npx expo run:ios
```

- [ ] **Step 3: Verify the golden path**

In the simulator: tap "Start Fast" on the Timer tab, confirm the elapsed time counts up; switch to History (should be empty still, since the fast hasn't ended); go back to Timer, tap "End Fast"; switch to History and confirm the completed fast now appears with a duration.

- [ ] **Step 4: Verify restart survival**

Start a fast, background the app (or kill and relaunch it), reopen — confirm the Timer tab shows the correct elapsed time computed from the original start time, not reset to zero.

- [ ] **Step 5: Verify dark mode**

Toggle the simulator's appearance (Settings → Developer → Dark Appearance, or Xcode's Environment Overrides) and confirm both screens switch palettes without a restart.
