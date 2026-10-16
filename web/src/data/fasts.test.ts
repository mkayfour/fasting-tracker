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
