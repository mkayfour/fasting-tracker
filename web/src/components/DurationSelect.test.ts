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
