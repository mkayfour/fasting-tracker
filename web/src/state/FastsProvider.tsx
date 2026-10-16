import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
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

  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') refresh() }
    window.addEventListener('storage', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('storage', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

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
