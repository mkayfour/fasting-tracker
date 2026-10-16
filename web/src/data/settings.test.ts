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
