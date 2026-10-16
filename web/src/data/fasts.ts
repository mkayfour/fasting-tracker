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
