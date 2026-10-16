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
