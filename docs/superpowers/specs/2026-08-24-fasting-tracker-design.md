# Fasting Tracker — Design

## Overview

A React Native (Expo) mobile app for tracking intermittent fasts, targeting iOS
first. Local-only storage for v1 (no accounts, no network dependency); Firebase
sync is a planned future addition, not part of this build.

## Goals

- Start/stop and track fasts with accurate elapsed time, survivable across app
  restarts.
- Support common fasting schedules (16:8, 18:6, 20:4, OMAD, custom) with a
  goal countdown.
- Show history and basic stats (streaks, averages, completion trends) over
  past fasts.
- Log body weight over time with a simple trend view.
- Local reminders for fast start/goal reached/weight logging.

## Non-goals (v1)

- Cloud sync / multi-device / accounts (planned as a later phase, not
  designed here).
- Android support (iOS only for v1).
- Social features, sharing, coaching content, nutrition tracking.

## Architecture

- **Framework**: Expo (managed workflow), TypeScript, React Navigation
  (bottom tabs).
- **Storage**: `expo-sqlite` as the local database, accessed only through a
  thin data-access layer (`db/fasts.ts`, `db/weight.ts`, `db/settings.ts`).
  Screens and components never touch SQL directly — this keeps the door open
  to swapping in Firebase-backed implementations of the same module
  interfaces later without touching UI code.
- **State management**: React Context + hooks for cross-cutting state (the
  currently active fast, user settings/defaults). No Redux/Zustand — the
  app's state surface is small enough that Context is sufficient.
- **Notifications**: `expo-notifications`, local scheduling only (no push
  server needed since there's no backend).

## Data model (SQLite)

**`fasts`**
| column | type | notes |
|---|---|---|
| id | integer PK | |
| start_at | datetime | |
| end_at | datetime, nullable | null = fast is currently active |
| goal_hours | real | target fast duration |
| schedule_type | text | "16:8" \| "18:6" \| "20:4" \| "OMAD" \| "custom" |
| notes | text, nullable | |

**`weight_entries`**
| column | type | notes |
|---|---|---|
| id | integer PK | |
| logged_at | datetime | |
| weight | real | |
| unit | text | "kg" \| "lb" |

**`settings`**
Single-row table: default schedule type, default goal hours, weight unit,
reminder toggles and times.

## Features, phased

Implementation proceeds in stages; each stage is independently usable.

1. **Timer + History** — start/stop a fast, live elapsed-time display
   (computed from `start_at`, not a running in-memory timer, so it's correct
   after backgrounding/restart), list of past fasts with date/duration/schedule.
2. **Schedules** — pick a preset (16:8/18:6/20:4/OMAD) or set a custom goal;
   countdown-to-goal and eating-window display.
3. **Stats** — current streak, average fast length, weekly/monthly completion
   view (simple bar/line chart).
4. **Weight log + reminders** — manual weight entries with a trend view;
   local notifications for "fast starting soon," "goal reached," and "time to
   log weight."

## Visual design

Minimal, content-first aesthetic in the spirit of Notion: plenty of
whitespace, restrained color (mostly neutrals with a single accent color for
active/primary actions), simple system fonts, no heavy shadows/gradients/
decoration. Full light and dark mode support, following the OS appearance
setting by default (with a manual override in Settings if trivial to add,
otherwise deferred).

## Navigation

Bottom tabs: **Timer** (home) · **History** · **Stats** (weight log lives as
a section within Stats, to avoid a fifth tab) · **Settings** (default
schedule, units, reminders).

## Error handling / edge cases

- Elapsed time is always recomputed from `start_at` on load/foreground, never
  trusted from a live timer alone — survives app kill/restart.
- The data layer enforces at most one active fast (`end_at IS NULL`) at a
  time; starting a new fast while one is active is rejected.
- Notification permission denial disables reminders silently — no blocking
  prompts or repeated permission nagging.

## Testing

- Jest unit tests for the data-access layer (`db/*.ts`), since date math and
  the active-fast constraint are the most bug-prone logic.
- Manual verification in the iOS Simulator for UI flows, per phase.

## Future work (explicitly out of scope here)

- Firebase-backed sync layer implementing the same `db/*` interfaces.
- Android support.
