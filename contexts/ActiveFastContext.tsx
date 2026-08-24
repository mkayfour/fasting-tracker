import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CompletedFast, Fast, getActiveFast, startFast, endFast } from '../db/fasts';

type ActiveFastContextValue = {
  activeFast: Fast | null;
  loading: boolean;
  start: (goalHours: number, scheduleType: string) => Promise<void>;
  stop: () => Promise<CompletedFast | undefined>;
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
    if (!activeFast) return undefined;
    const ended = await endFast(activeFast.id);
    setActiveFast(null);
    return ended as CompletedFast;
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
