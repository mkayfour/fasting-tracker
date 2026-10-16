export type ThemePreference = 'light' | 'dark' | 'system'

const KEY = 'fasting-tracker:theme'

export function getThemePreference(): ThemePreference {
  const value = localStorage.getItem(KEY)
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'
}

export function setThemePreference(preference: ThemePreference): void {
  localStorage.setItem(KEY, preference)
}
