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
