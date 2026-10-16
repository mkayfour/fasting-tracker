# Fasting Tracker Web PWA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the fasting tracker as an installable, offline-capable web app (PWA) in `web/`, with feature parity to the native app, deployable as static files to Vercel/Netlify so it runs on a phone with no dev server.

**Architecture:** Vite + React + TypeScript SPA. Data lives in `localStorage` behind a small synchronous repository (`src/data/*`), exposed to the UI through two React contexts (fasts, theme). Theme is CSS variables switched by `data-theme` on `<html>`. `vite-plugin-pwa` generates the manifest and service worker so the app works offline once loaded. The native Expo app in the repo root is untouched.

**Tech Stack:** Vite, React 19, TypeScript, Vitest + jsdom, vite-plugin-pwa, html-to-image.

## Global Constraints

- All web code lives in `web/`. Do not modify native app source (`App.tsx`, `screens/`, `components/`, `db/`, etc.). The only root files that may change are `jest.config.js` and `tsconfig.json` (to exclude `web/`).
- Local-only data: no backend, no accounts, no network calls at runtime.
- At most one active fast at any time, enforced in the data layer (`startFast` throws `Error('A fast is already active')`).
- Elapsed time is always computed from the stored `startAt` timestamp, never accumulated in state.
- Minimal, Notion-like look. Light / Dark / System theme, default System. Palette exactly:
  - light: background `#FFFFFF`, surface `#F7F6F3`, text `#191919`, textMuted `#787774`, accent `#2F80ED`, border `#E9E9E7`
  - dark: background `#191919`, surface `#232323`, text `#F1F1EF`, textMuted `#9B9B98`, accent `#5B9BF0`, border `#2F2F2F`
- Duration options: 16h (16:8), 18h (18:6), 20h (20:4), 24h (OMAD), Custom hours. Dropdown shows only the selected value.
- Git: commit messages are plain (no "Claude" / "Co-Authored-By" lines). Do not create branches or PRs. Work on the current branch `feat/web-pwa`.

---

### Task 1: Scaffold web app (Vite + React + TS + Vitest)

**Files:**
- Create: `web/` (via create-vite), `web/vite.config.ts` (modify)
- Modify: `jest.config.js`, `tsconfig.json` (repo root)

**Interfaces:**
- Produces: a buildable Vite project at `web/` with `npm test` (vitest, jsdom) and `npm run build` working; root `npx jest` and `npx tsc --noEmit` ignore `web/`.

- [ ] **Step 1: Scaffold**

```bash
npm create vite@latest web -- --template react-ts
cd web && npm install
npm install html-to-image
npm install -D vitest jsdom vite-plugin-pwa
```
If `create-vite` prompts (e.g. about rolldown or "install and start now"), choose the plain/default non-experimental options and do not start the dev server.

- [ ] **Step 2: Remove template demo code**

Delete `web/src/App.css`, `web/src/assets/`, `web/public/vite.svg` (if present). Replace `web/src/App.tsx` with:

```tsx
export default function App() {
  return <div>Fasting Tracker</div>
}
```
Replace `web/src/index.css` with an empty file. Make sure `web/src/main.tsx` imports `./index.css` and `./App`.

- [ ] **Step 3: Configure Vitest in `web/vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true },
})
```
(Keep whatever react plugin import the template generated if it differs, e.g. `@vitejs/plugin-react-swc`.) Add `"test": "vitest run"` to `web/package.json` scripts if absent. In `web/tsconfig.app.json` add `"vitest/globals"` to `compilerOptions.types` (create the `types` array if missing).

- [ ] **Step 4: Exclude `web/` from the native toolchain**

In root `jest.config.js` add `testPathIgnorePatterns: ['/node_modules/', '<rootDir>/web/', '<rootDir>/.claude/']`. In root `tsconfig.json` add `"exclude": ["web", "node_modules", ".claude"]`.

- [ ] **Step 5: Verify**

Run (from `web/`): `npm run build` → succeeds. `npm test` → "No test files found" is acceptable (exit may be non-zero; if so add `--passWithNoTests` to the script). From repo root: `npx jest` → existing 7 tests pass, and `npx tsc --noEmit` → no errors.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Scaffold web PWA project (Vite, React, TS, Vitest)"
```

---

### Task 2: Data layer (fasts + settings), TDD

**Files:**
- Create: `web/src/data/fasts.ts`, `web/src/data/settings.ts`
- Test: `web/src/data/fasts.test.ts`, `web/src/data/settings.test.ts`

**Interfaces:**
- Produces:
  - `type Fast = { id: number; startAt: string; endAt: string | null; goalHours: number; scheduleType: string; notes: string | null }`
  - `type CompletedFast = Fast & { endAt: string }`
  - `getActiveFast(): Fast | null`
  - `startFast(goalHours: number, scheduleType: string): Fast` — throws `Error('A fast is already active')`
  - `endFast(id: number): CompletedFast` — throws `Error('Fast <id> not found')` if unknown
  - `listFasts(): CompletedFast[]` — completed only, newest `startAt` first, ties by `id` desc
  - `type ThemePreference = 'light' | 'dark' | 'system'`
  - `getThemePreference(): ThemePreference` (default `'system'`), `setThemePreference(p: ThemePreference): void`

- [ ] **Step 1: Write the failing tests**

```ts
// web/src/data/fasts.test.ts
import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import { startFast, endFast, getActiveFast, listFasts } from './fasts'

beforeEach(() => {
  localStorage.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T08:00:00Z'))
})
afterEach(() => vi.useRealTimers())

test('startFast creates an active fast with no end time', () => {
  const fast = startFast(16, '16:8')
  expect(fast.endAt).toBeNull()
  expect(fast.goalHours).toBe(16)
  expect(fast.scheduleType).toBe('16:8')
  expect(fast.startAt).toBe('2026-01-01T08:00:00.000Z')
})

test('startFast throws if a fast is already active', () => {
  startFast(16, '16:8')
  expect(() => startFast(18, '18:6')).toThrow('A fast is already active')
})

test('getActiveFast returns null when nothing is active', () => {
  expect(getActiveFast()).toBeNull()
})

test('getActiveFast returns the in-progress fast', () => {
  const started = startFast(16, '16:8')
  expect(getActiveFast()?.id).toBe(started.id)
})

test('endFast sets endAt and clears the active fast', () => {
  const started = startFast(16, '16:8')
  vi.setSystemTime(new Date('2026-01-02T00:30:00Z'))
  const ended = endFast(started.id)
  expect(ended.endAt).toBe('2026-01-02T00:30:00.000Z')
  expect(getActiveFast()).toBeNull()
})

test('endFast throws for an unknown id', () => {
  expect(() => endFast(999)).toThrow('Fast 999 not found')
})

test('listFasts returns completed fasts newest first, ties broken by id', () => {
  const a = startFast(16, '16:8')
  endFast(a.id)
  const b = startFast(18, '18:6') // same millisecond as a
  endFast(b.id)
  vi.setSystemTime(new Date('2026-01-03T08:00:00Z'))
  const c = startFast(20, '20:4')
  endFast(c.id)
  expect(listFasts().map((f) => f.id)).toEqual([c.id, b.id, a.id])
})

test('listFasts excludes the active fast', () => {
  startFast(16, '16:8')
  expect(listFasts()).toEqual([])
})

test('corrupted storage is treated as empty', () => {
  localStorage.setItem('fasting-tracker:fasts', '{not json')
  expect(getActiveFast()).toBeNull()
  expect(() => startFast(16, '16:8')).not.toThrow()
})
```

```ts
// web/src/data/settings.test.ts
import { beforeEach, expect, test } from 'vitest'
import { getThemePreference, setThemePreference } from './settings'

beforeEach(() => localStorage.clear())

test('defaults to system', () => {
  expect(getThemePreference()).toBe('system')
})

test('round-trips a saved preference', () => {
  setThemePreference('dark')
  expect(getThemePreference()).toBe('dark')
})

test('ignores invalid stored values', () => {
  localStorage.setItem('fasting-tracker:theme', 'purple')
  expect(getThemePreference()).toBe('system')
})
```

- [ ] **Step 2: Run to verify failure**

Run (in `web/`): `npx vitest run src/data` → FAIL, modules not found.

- [ ] **Step 3: Implement**

```ts
// web/src/data/fasts.ts
export type Fast = {
  id: number
  startAt: string
  endAt: string | null
  goalHours: number
  scheduleType: string
  notes: string | null
}

export type CompletedFast = Fast & { endAt: string }

const KEY = 'fasting-tracker:fasts'

function load(): Fast[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function save(fasts: Fast[]): void {
  localStorage.setItem(KEY, JSON.stringify(fasts))
}

export function getActiveFast(): Fast | null {
  return load().find((f) => f.endAt === null) ?? null
}

export function startFast(goalHours: number, scheduleType: string): Fast {
  const fasts = load()
  if (fasts.some((f) => f.endAt === null)) {
    throw new Error('A fast is already active')
  }
  const fast: Fast = {
    id: fasts.reduce((max, f) => Math.max(max, f.id), 0) + 1,
    startAt: new Date().toISOString(),
    endAt: null,
    goalHours,
    scheduleType,
    notes: null,
  }
  save([...fasts, fast])
  return fast
}

export function endFast(id: number): CompletedFast {
  const fasts = load()
  const index = fasts.findIndex((f) => f.id === id)
  if (index === -1) {
    throw new Error(`Fast ${id} not found`)
  }
  const ended = { ...fasts[index], endAt: new Date().toISOString() } as CompletedFast
  fasts[index] = ended
  save(fasts)
  return ended
}

export function listFasts(): CompletedFast[] {
  return (load().filter((f) => f.endAt !== null) as CompletedFast[]).sort((a, b) =>
    a.startAt === b.startAt ? b.id - a.id : a.startAt < b.startAt ? 1 : -1,
  )
}
```

```ts
// web/src/data/settings.ts
export type ThemePreference = 'light' | 'dark' | 'system'

const KEY = 'fasting-tracker:theme'

export function getThemePreference(): ThemePreference {
  const value = localStorage.getItem(KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

export function setThemePreference(preference: ThemePreference): void {
  localStorage.setItem(KEY, preference)
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npx vitest run src/data` → PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add web/src/data
git commit -m "Add web data layer for fasts and settings"
```

---

### Task 3: Time utils, theme + fasts providers, global styles

**Files:**
- Create: `web/src/utils/time.ts`, `web/src/utils/time.test.ts`, `web/src/theme/ThemeProvider.tsx`, `web/src/state/FastsProvider.tsx`, `web/src/index.css`
- Modify: `web/index.html` (title, viewport, theme-color)

**Interfaces:**
- Consumes: Task 2 exports.
- Produces:
  - `formatDuration(startAt, endAt): string` → `"16h 5m"`; `formatClockTime(iso): string`; `formatDateTime(iso): string`; `formatRelativeTime(iso): string` (`just now`, `5m ago`, `3h ago`, `2d ago`, `3w ago`, else `toLocaleDateString()`); `formatElapsed(startAt): string` → `"HH:MM:SS"`
  - `<ThemeProvider>` and `useTheme(): { preference: ThemePreference; resolved: 'light' | 'dark'; setPreference(p): void }`; sets `document.documentElement.dataset.theme` to `resolved`
  - `<FastsProvider>` and `useFasts(): { activeFast: Fast | null; history: CompletedFast[]; start(goalHours: number, scheduleType: string): void; stop(): CompletedFast | undefined }`
  - CSS classes listed in Step 4 (used by Task 4 components)

- [ ] **Step 1: Write failing tests for time utils**

```ts
// web/src/utils/time.test.ts
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { formatDuration, formatElapsed, formatRelativeTime } from './time'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-10T12:00:00Z'))
})
afterEach(() => vi.useRealTimers())

test('formatDuration', () => {
  expect(formatDuration('2026-01-01T00:00:00Z', '2026-01-01T16:05:30Z')).toBe('16h 5m')
})

test('formatElapsed pads and never goes negative', () => {
  expect(formatElapsed('2026-01-10T10:58:55Z')).toBe('01:01:05')
  expect(formatElapsed('2026-01-10T13:00:00Z')).toBe('00:00:00')
})

test.each([
  ['2026-01-10T11:59:40Z', 'just now'],
  ['2026-01-10T11:55:00Z', '5m ago'],
  ['2026-01-10T09:00:00Z', '3h ago'],
  ['2026-01-08T12:00:00Z', '2d ago'],
  ['2025-12-20T12:00:00Z', '3w ago'],
])('formatRelativeTime %s', (iso, expected) => {
  expect(formatRelativeTime(iso)).toBe(expected)
})
```

- [ ] **Step 2: Run to verify failure** — `npx vitest run src/utils` → FAIL.

- [ ] **Step 3: Implement time utils**

```ts
// web/src/utils/time.ts
export function formatDuration(startAt: string, endAt: string): string {
  const ms = new Date(endAt).getTime() - new Date(startAt).getTime()
  const hours = Math.floor(ms / 3_600_000)
  const minutes = Math.floor((ms % 3_600_000) / 60_000)
  return `${hours}h ${minutes}m`
}

export function formatElapsed(startAt: string): string {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - new Date(startAt).getTime()) / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(iso: string): string {
  return `${new Date(iso).toLocaleDateString()} · ${formatClockTime(iso)}`
}

export function formatRelativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(iso).toLocaleDateString()
}
```

- [ ] **Step 4: Providers, styles, html**

```tsx
// web/src/theme/ThemeProvider.tsx
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { getThemePreference, setThemePreference, type ThemePreference } from '../data/settings'

type ThemeValue = {
  preference: ThemePreference
  resolved: 'light' | 'dark'
  setPreference: (p: ThemePreference) => void
}

const ThemeContext = createContext<ThemeValue | undefined>(undefined)
const query = () => window.matchMedia('(prefers-color-scheme: dark)')

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(getThemePreference)
  const [systemDark, setSystemDark] = useState(() => query().matches)

  useEffect(() => {
    const mq = query()
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const resolved: 'light' | 'dark' =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', resolved === 'dark' ? '#191919' : '#FFFFFF')
  }, [resolved])

  const setPreference = useCallback((p: ThemePreference) => {
    setThemePreference(p)
    setPreferenceState(p)
  }, [])

  return (
    <ThemeContext.Provider value={{ preference, resolved, setPreference }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

```tsx
// web/src/state/FastsProvider.tsx
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import {
  endFast, getActiveFast, listFasts, startFast,
  type CompletedFast, type Fast,
} from '../data/fasts'

type FastsValue = {
  activeFast: Fast | null
  history: CompletedFast[]
  start: (goalHours: number, scheduleType: string) => void
  stop: () => CompletedFast | undefined
}

const FastsContext = createContext<FastsValue | undefined>(undefined)

export function FastsProvider({ children }: { children: ReactNode }) {
  const [activeFast, setActiveFast] = useState<Fast | null>(getActiveFast)
  const [history, setHistory] = useState<CompletedFast[]>(listFasts)

  const refresh = useCallback(() => {
    setActiveFast(getActiveFast())
    setHistory(listFasts())
  }, [])

  const start = useCallback((goalHours: number, scheduleType: string) => {
    try {
      startFast(goalHours, scheduleType)
    } catch {
      // another tab already started a fast; just resync below
    }
    refresh()
  }, [refresh])

  const stop = useCallback((): CompletedFast | undefined => {
    const active = getActiveFast()
    if (!active) { refresh(); return undefined }
    const ended = endFast(active.id)
    refresh()
    return ended
  }, [refresh])

  return (
    <FastsContext.Provider value={{ activeFast, history, start, stop }}>
      {children}
    </FastsContext.Provider>
  )
}

export function useFasts(): FastsValue {
  const ctx = useContext(FastsContext)
  if (!ctx) throw new Error('useFasts must be used within FastsProvider')
  return ctx
}
```

```css
/* web/src/index.css */
:root {
  --bg: #ffffff; --surface: #f7f6f3; --text: #191919;
  --muted: #787774; --accent: #2f80ed; --border: #e9e9e7;
  color-scheme: light;
}
:root[data-theme='dark'] {
  --bg: #191919; --surface: #232323; --text: #f1f1ef;
  --muted: #9b9b98; --accent: #5b9bf0; --border: #2f2f2f;
  color-scheme: dark;
}
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
html, body, #root { height: 100%; margin: 0; }
body {
  background: var(--bg); color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
button, select, input { font: inherit; color: inherit; }

.app { display: flex; flex-direction: column; height: 100%; max-width: 560px; margin: 0 auto; }
.header {
  padding: calc(env(safe-area-inset-top) + 14px) 16px 12px;
  font-size: 18px; font-weight: 700; text-align: center;
}
.page { flex: 1; overflow-y: auto; padding: 16px; }
.tabbar {
  display: flex; border-top: 1px solid var(--border); background: var(--bg);
  padding-bottom: env(safe-area-inset-bottom);
}
.tab {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 8px 0; background: none; border: 0; color: var(--muted); font-size: 11px; cursor: pointer;
}
.tab[aria-current='page'] { color: var(--accent); }
.tab svg { width: 24px; height: 24px; }

.center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100%; }
.elapsed { font-size: 48px; font-weight: 600; font-variant-numeric: tabular-nums; }
.status { color: var(--muted); margin: 8px 0; text-align: center; }
.btn {
  background: var(--accent); color: #fff; border: 0; border-radius: 8px;
  padding: 14px 32px; font-weight: 600; cursor: pointer; margin-top: 24px;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: var(--surface); color: var(--text); border: 1px solid var(--border); margin-top: 12px;
}
.btn-link { background: none; border: 0; color: #fff; opacity: 0.8; margin-top: 12px; cursor: pointer; }

.field {
  display: flex; align-items: center; justify-content: space-between; min-width: 240px;
  margin-top: 16px; padding: 12px 16px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--surface); font-weight: 600;
}
select.field { appearance: none; -webkit-appearance: none; cursor: pointer; text-align-last: center; }
.custom-input { width: 120px; text-align: center; margin-top: 12px; padding: 8px 12px;
  border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }

.card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px; width: 280px; }
.card-duration { font-size: 36px; font-weight: 700; text-align: center; }
.card-goal { font-size: 14px; font-weight: 600; text-align: center; margin-top: 6px; color: var(--muted); }
.card-goal.met { color: var(--accent); }
.card hr { border: 0; border-top: 1px solid var(--border); margin: 16px 0; }
.card-row { display: flex; justify-content: space-between; margin-top: 6px; font-size: 13px; }
.card-row span:first-child { color: var(--muted); }
.card-row span:last-child { font-weight: 600; }

.overlay {
  position: fixed; inset: 0; background: rgba(0, 0, 0, 0.6); z-index: 10;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.overlay h2 { color: #fff; margin: 0 0 16px; }

.row { padding: 12px 0; border-bottom: 1px solid var(--border); cursor: pointer; background: none;
  border-left: 0; border-right: 0; border-top: 0; width: 100%; text-align: left; display: block; }
.row-top { display: flex; justify-content: space-between; align-items: center; }
.row-date { font-weight: 600; }
.row-sub { font-size: 13px; color: var(--muted); margin-top: 2px; }
.empty { text-align: center; color: var(--muted); margin-top: 32px; }

.section-title { font-size: 13px; font-weight: 600; text-transform: uppercase; color: var(--muted); margin: 0 0 8px 4px; }
.list { border: 1px solid var(--border); border-radius: 12px; background: var(--surface); overflow: hidden; }
.list button {
  display: flex; width: 100%; justify-content: space-between; align-items: center;
  padding: 14px 16px; background: none; border: 0; border-bottom: 1px solid var(--border); cursor: pointer;
}
.list button:last-child { border-bottom: 0; }
.list svg { width: 20px; height: 20px; color: var(--accent); }
```

In `web/index.html`: set `<title>Fasting Tracker</title>`, `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`, `<meta name="theme-color" content="#FFFFFF" />`, `<meta name="apple-mobile-web-app-capable" content="yes" />`, `<meta name="apple-mobile-web-app-title" content="Fasting" />`, `<link rel="apple-touch-icon" href="/apple-touch-icon.png" />`.

- [ ] **Step 5: Verify** — `npx vitest run` → all pass; `npx tsc -b` (or `npm run build`) → no type errors (build may warn about unused providers; they are used from Task 4).

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "Add web time utils, theme and fasts providers, global styles"
```

---

### Task 4: App shell, tabs, and Settings page

**Files:**
- Create: `web/src/components/icons.tsx`, `web/src/components/TabBar.tsx`, `web/src/pages/SettingsPage.tsx`, `web/src/pages/TimerPage.tsx` (placeholder), `web/src/pages/HistoryPage.tsx` (placeholder)
- Modify: `web/src/App.tsx`, `web/src/main.tsx`

**Interfaces:**
- Consumes: `ThemeProvider`/`useTheme` and `FastsProvider` (Task 3).
- Produces: `type TabName = 'Timer' | 'History' | 'Settings'`; icon components `TimerIcon`, `HistoryIcon`, `SettingsIcon`, `CheckIcon` (each `() => JSX.Element`, `currentColor` stroke, 24x24 viewBox); default exports `TimerPage`, `HistoryPage` (replaced by Tasks 5/6 — keep default-export names and file paths).

- [ ] **Step 1: Icons**

```tsx
// web/src/components/icons.tsx
const base = {
  viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
  strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
} as const

export const TimerIcon = () => (
  <svg {...base}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>
)
export const HistoryIcon = () => (
  <svg {...base}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>
)
export const SettingsIcon = () => (
  <svg {...base}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
)
export const CheckIcon = () => (
  <svg {...base}><path d="M20 6 9 17l-5-5" /></svg>
)
```

- [ ] **Step 2: TabBar, Settings page, placeholders**

```tsx
// web/src/components/TabBar.tsx
import { HistoryIcon, SettingsIcon, TimerIcon } from './icons'

export type TabName = 'Timer' | 'History' | 'Settings'

const TABS: { name: TabName; icon: () => React.JSX.Element }[] = [
  { name: 'Timer', icon: TimerIcon },
  { name: 'History', icon: HistoryIcon },
  { name: 'Settings', icon: SettingsIcon },
]

export default function TabBar({ active, onChange }: { active: TabName; onChange: (t: TabName) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          className="tab"
          aria-current={active === name ? 'page' : undefined}
          onClick={() => onChange(name)}
        >
          <Icon />
          {name}
        </button>
      ))}
    </nav>
  )
}
```

```tsx
// web/src/pages/SettingsPage.tsx
import { CheckIcon } from '../components/icons'
import type { ThemePreference } from '../data/settings'
import { useTheme } from '../theme/ThemeProvider'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export default function SettingsPage() {
  const { preference, setPreference } = useTheme()
  return (
    <div>
      <h2 className="section-title">Appearance</h2>
      <div className="list">
        {OPTIONS.map((o) => (
          <button key={o.value} onClick={() => setPreference(o.value)}>
            <span>{o.label}</span>
            {preference === o.value && <CheckIcon />}
          </button>
        ))}
      </div>
    </div>
  )
}
```

```tsx
// web/src/pages/TimerPage.tsx  (placeholder, replaced in Task 5)
export default function TimerPage() {
  return <div className="center">Timer</div>
}
```
```tsx
// web/src/pages/HistoryPage.tsx  (placeholder, replaced in Task 6)
export default function HistoryPage() {
  return <div className="empty">No fasts yet</div>
}
```

- [ ] **Step 3: App + main**

```tsx
// web/src/App.tsx
import { useState } from 'react'
import TabBar, { type TabName } from './components/TabBar'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import TimerPage from './pages/TimerPage'

const TITLES: Record<TabName, string> = {
  Timer: 'Fasting Tracker',
  History: 'History',
  Settings: 'Settings',
}

export default function App() {
  const [tab, setTab] = useState<TabName>('Timer')
  return (
    <div className="app">
      <header className="header">{TITLES[tab]}</header>
      <main className="page">
        {tab === 'Timer' && <TimerPage />}
        {tab === 'History' && <HistoryPage />}
        {tab === 'Settings' && <SettingsPage />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
```

```tsx
// web/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FastsProvider } from './state/FastsProvider'
import { ThemeProvider } from './theme/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FastsProvider>
        <App />
      </FastsProvider>
    </ThemeProvider>
  </StrictMode>,
)
```

- [ ] **Step 4: Verify** — `npm run build` succeeds. Run `npm run dev -- --port 5173` in the background and use the browser to confirm: header + three tabs with icons render, switching tabs works, and Settings → Dark/Light/System changes the page colors and persists across reload. Stop the dev server afterwards.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "Add web app shell with tab bar, icons and theme settings"
```

---

### Task 5: Timer page (duration dropdown, celebration, image share)

**Files:**
- Create: `web/src/components/FastSummaryCard.tsx`, `web/src/components/DurationSelect.tsx`, `web/src/components/CelebrationModal.tsx`, `web/src/share.ts`
- Modify: `web/src/pages/TimerPage.tsx`
- Test: `web/src/components/DurationSelect.test.tsx` is not required; verify in browser.

**Interfaces:**
- Consumes: `useFasts` (Task 3), time utils (Task 3), `CompletedFast` (Task 2).
- Produces:
  - `FastSummaryCard({ fast }: { fast: CompletedFast })` — forwards a ref to its root div (`forwardRef<HTMLDivElement>`); shows duration, "Goal reached"/"Ended early" + goal, Started and Ended rows
  - `renderCardImage(el: HTMLElement, filename: string): Promise<File>` and `shareFile(file: File, text: string): Promise<'shared' | 'downloaded' | 'cancelled'>` in `share.ts`
  - `CelebrationModal({ fast, onClose })` where `fast: CompletedFast | null`
  - `DurationSelect` props `{ value: string; customHours: string; onChange(value: string): void; onCustomHoursChange(v: string): void }` where `value` is a `scheduleType` string (`'16:8' | '18:6' | '20:4' | 'OMAD' | 'custom'`); exports `DURATIONS` and `resolveDuration(value: string, customHours: string): { hours: number; scheduleType: string } | null`

- [ ] **Step 1: Failing test for `resolveDuration`**

```ts
// web/src/components/DurationSelect.test.ts
import { expect, test } from 'vitest'
import { resolveDuration } from './DurationSelect'

test('preset', () => {
  expect(resolveDuration('18:6', '')).toEqual({ hours: 18, scheduleType: '18:6' })
  expect(resolveDuration('OMAD', '')).toEqual({ hours: 24, scheduleType: 'OMAD' })
})
test('custom valid', () => {
  expect(resolveDuration('custom', '12.5')).toEqual({ hours: 12.5, scheduleType: 'custom' })
})
test('custom invalid', () => {
  expect(resolveDuration('custom', '')).toBeNull()
  expect(resolveDuration('custom', '0')).toBeNull()
  expect(resolveDuration('custom', 'abc')).toBeNull()
})
```
Run `npx vitest run src/components` → FAIL.

- [ ] **Step 2: Implement DurationSelect**

A native `<select>` (shows exactly one value; opens the OS picker on phones).

```tsx
// web/src/components/DurationSelect.tsx
export const DURATIONS = [
  { value: '16:8', hours: 16, label: '16 hours (16:8)' },
  { value: '18:6', hours: 18, label: '18 hours (18:6)' },
  { value: '20:4', hours: 20, label: '20 hours (20:4)' },
  { value: 'OMAD', hours: 24, label: '24 hours (OMAD)' },
]

export function resolveDuration(
  value: string,
  customHours: string,
): { hours: number; scheduleType: string } | null {
  if (value === 'custom') {
    const hours = parseFloat(customHours)
    return Number.isFinite(hours) && hours > 0 ? { hours, scheduleType: 'custom' } : null
  }
  const preset = DURATIONS.find((d) => d.value === value)
  return preset ? { hours: preset.hours, scheduleType: preset.value } : null
}

type Props = {
  value: string
  customHours: string
  onChange: (value: string) => void
  onCustomHoursChange: (v: string) => void
}

export default function DurationSelect({ value, customHours, onChange, onCustomHoursChange }: Props) {
  return (
    <>
      <select
        className="field"
        aria-label="Fast duration"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {DURATIONS.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
        <option value="custom">Custom…</option>
      </select>
      {value === 'custom' && (
        <input
          className="custom-input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          placeholder="Hours"
          aria-label="Custom hours"
          value={customHours}
          onChange={(e) => onCustomHoursChange(e.target.value)}
        />
      )}
    </>
  )
}
```
Run `npx vitest run src/components` → PASS.

- [ ] **Step 3: Summary card + share helpers**

```tsx
// web/src/components/FastSummaryCard.tsx
import { forwardRef } from 'react'
import type { CompletedFast } from '../data/fasts'
import { formatDateTime, formatDuration } from '../utils/time'

const FastSummaryCard = forwardRef<HTMLDivElement, { fast: CompletedFast }>(({ fast }, ref) => {
  const hours = (new Date(fast.endAt).getTime() - new Date(fast.startAt).getTime()) / 3_600_000
  const met = hours >= fast.goalHours
  return (
    <div className="card" ref={ref}>
      <div className="card-duration">{formatDuration(fast.startAt, fast.endAt)}</div>
      <div className={`card-goal${met ? ' met' : ''}`}>
        {met ? 'Goal reached' : 'Ended early'} · goal {fast.goalHours}h ({fast.scheduleType})
      </div>
      <hr />
      <div className="card-row"><span>Started</span><span>{formatDateTime(fast.startAt)}</span></div>
      <div className="card-row"><span>Ended</span><span>{formatDateTime(fast.endAt)}</span></div>
    </div>
  )
})
export default FastSummaryCard
```

```ts
// web/src/share.ts
import { toBlob } from 'html-to-image'

export async function renderCardImage(el: HTMLElement, filename: string): Promise<File> {
  const blob = await toBlob(el, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: getComputedStyle(el).backgroundColor,
  })
  if (!blob) throw new Error('Could not render image')
  return new File([blob], filename, { type: 'image/png' })
}

// Must be called directly from a click handler (iOS Safari requires a user gesture),
// so render the File ahead of time with renderCardImage.
export async function shareFile(file: File, text: string): Promise<'shared' | 'downloaded' | 'cancelled'> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return 'cancelled'
      throw e
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
```

- [ ] **Step 4: CelebrationModal and TimerPage**

```tsx
// web/src/components/CelebrationModal.tsx
import { useEffect, useRef, useState } from 'react'
import type { CompletedFast } from '../data/fasts'
import { renderCardImage, shareFile } from '../share'
import { formatDuration } from '../utils/time'
import FastSummaryCard from './FastSummaryCard'

type Props = { fast: CompletedFast | null; onClose: () => void }

export default function CelebrationModal({ fast, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setFile(null)
    setError(false)
    if (!fast || !cardRef.current) return
    let cancelled = false
    renderCardImage(cardRef.current, `fast-${fast.id}.png`)
      .then((f) => { if (!cancelled) setFile(f) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [fast])

  if (!fast) return null

  const text = `I just completed a ${formatDuration(fast.startAt, fast.endAt)} fast!`

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Fast complete">
      <h2>Fast complete 🎉</h2>
      <FastSummaryCard ref={cardRef} fast={fast} />
      <button className="btn" disabled={!file} onClick={() => file && shareFile(file, text)}>
        {error ? 'Sharing unavailable' : file ? 'Share' : 'Preparing…'}
      </button>
      <button className="btn-link" onClick={onClose}>Close</button>
    </div>
  )
}
```

```tsx
// web/src/pages/TimerPage.tsx
import { useEffect, useState } from 'react'
import CelebrationModal from '../components/CelebrationModal'
import DurationSelect, { resolveDuration } from '../components/DurationSelect'
import type { CompletedFast } from '../data/fasts'
import { useFasts } from '../state/FastsProvider'
import { formatElapsed } from '../utils/time'

export default function TimerPage() {
  const { activeFast, start, stop } = useFasts()
  const [, tick] = useState(0)
  const [duration, setDuration] = useState('16:8')
  const [customHours, setCustomHours] = useState('')
  const [completed, setCompleted] = useState<CompletedFast | null>(null)

  useEffect(() => {
    if (!activeFast) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [activeFast])

  const resolved = resolveDuration(duration, customHours)

  return (
    <div className="center">
      <div className="elapsed">{activeFast ? formatElapsed(activeFast.startAt) : '00:00:00'}</div>
      <div className="status">
        {activeFast
          ? `Fasting — goal ${activeFast.goalHours}h (${activeFast.scheduleType})`
          : 'Not fasting'}
      </div>
      {!activeFast && (
        <DurationSelect
          value={duration}
          customHours={customHours}
          onChange={setDuration}
          onCustomHoursChange={setCustomHours}
        />
      )}
      {activeFast ? (
        <button className="btn" onClick={() => setCompleted(stop() ?? null)}>End Fast</button>
      ) : (
        <button className="btn" disabled={!resolved} onClick={() => resolved && start(resolved.hours, resolved.scheduleType)}>
          Start Fast
        </button>
      )}
      <CelebrationModal fast={completed} onClose={() => setCompleted(null)} />
    </div>
  )
}
```

- [ ] **Step 5: Verify** — `npx vitest run` passes; `npm run build` succeeds. In the browser (dev server): pick a duration from the dropdown (only one value visible), choose Custom and confirm Start is disabled until valid hours entered, start a fast, confirm the timer ticks, reload and confirm elapsed time continues, End Fast → celebration card appears, Share becomes enabled (desktop falls back to a PNG download). Stop the dev server afterwards.

- [ ] **Step 6: Commit**

```bash
git add web
git commit -m "Add web timer page with duration dropdown, celebration card and image sharing"
```

---

### Task 6: History page with detail modal

**Files:**
- Create: `web/src/components/FastDetailModal.tsx`
- Modify: `web/src/pages/HistoryPage.tsx`

**Interfaces:**
- Consumes: `useFasts().history`, `FastSummaryCard` (Task 5), time utils.
- Produces: `FastDetailModal({ fast, onClose })` with `fast: CompletedFast | null`.

- [ ] **Step 1: Implement**

```tsx
// web/src/components/FastDetailModal.tsx
import type { CompletedFast } from '../data/fasts'
import FastSummaryCard from './FastSummaryCard'

export default function FastDetailModal({ fast, onClose }: { fast: CompletedFast | null; onClose: () => void }) {
  if (!fast) return null
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Fast details" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <FastSummaryCard fast={fast} />
      </div>
      <button className="btn btn-secondary" onClick={onClose}>Close</button>
    </div>
  )
}
```

```tsx
// web/src/pages/HistoryPage.tsx
import { useState } from 'react'
import FastDetailModal from '../components/FastDetailModal'
import type { CompletedFast } from '../data/fasts'
import { useFasts } from '../state/FastsProvider'
import { formatClockTime, formatDuration, formatRelativeTime } from '../utils/time'

export default function HistoryPage() {
  const { history } = useFasts()
  const [selected, setSelected] = useState<CompletedFast | null>(null)

  if (history.length === 0) return <div className="empty">No fasts yet</div>

  return (
    <div>
      {history.map((f) => (
        <button key={f.id} className="row" onClick={() => setSelected(f)}>
          <div className="row-top">
            <span className="row-date">{new Date(f.startAt).toLocaleDateString()}</span>
            <span className="row-sub">{formatRelativeTime(f.endAt)}</span>
          </div>
          <div className="row-sub">{formatDuration(f.startAt, f.endAt)} · {f.scheduleType}</div>
          <div className="row-sub">{formatClockTime(f.startAt)} – {formatClockTime(f.endAt)}</div>
        </button>
      ))}
      <FastDetailModal fast={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
```

- [ ] **Step 2: Verify** — `npm run build` succeeds. In the browser: finish a fast on the Timer tab, open History, confirm the card shows date, relative time ("just now"), duration · schedule, start – end times; tap it to open the detail card; Close dismisses.

- [ ] **Step 3: Commit**

```bash
git add web
git commit -m "Add web history page with detail modal"
```

---

### Task 7: PWA (installable + offline) and deploy docs

**Files:**
- Create: `web/public/icon-192.png`, `web/public/icon-512.png`, `web/public/apple-touch-icon.png`, `web/README.md`
- Modify: `web/vite.config.ts`

**Interfaces:**
- Produces: `npm run build` emits `dist/` with `manifest.webmanifest`, a service worker, and precached assets; the app loads offline after the first visit.

- [ ] **Step 1: Generate icons from the existing app icon**

```bash
cd web/public
sips -z 192 192 ../../assets/icon.png --out icon-192.png
sips -z 512 512 ../../assets/icon.png --out icon-512.png
sips -z 180 180 ../../assets/icon.png --out apple-touch-icon.png
```
Open one of the outputs to confirm it is a sensible square image.

- [ ] **Step 2: Configure the plugin in `web/vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Fasting Tracker',
        short_name: 'Fasting',
        description: 'Track your fasts, privately, on your device.',
        start_url: '/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#FFFFFF',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: { environment: 'jsdom', globals: true },
})
```
(Keep the react plugin import the template generated.)

- [ ] **Step 3: README with deploy steps** — `web/README.md` covering: `npm install`, `npm run dev`, `npm test`, `npm run build`; deploying to Vercel or Netlify by importing the GitHub repo with **Root Directory = `web`**, build command `npm run build`, output directory `dist`; installing on iPhone via Safari → Share → Add to Home Screen; note that data is stored on-device (localStorage) per browser/install and is not synced.

- [ ] **Step 4: Verify**

`npm run build` then `npx vite preview --port 4173` in the background. In the browser: load `http://localhost:4173`, confirm via devtools/JS (`navigator.serviceWorker.getRegistration()`) that a service worker registers and that `/manifest.webmanifest` returns JSON with the icons. Confirm the manifest and service worker files exist in `web/dist`. Stop the preview server.

- [ ] **Step 5: Commit**

```bash
git add web
git commit -m "Make web app an installable offline PWA and add deploy docs"
```
