import { useEffect, useState } from 'react'
import CelebrationModal from '../components/CelebrationModal'
import DurationSelect, { resolveDuration } from '../components/DurationSelect'
import type { CompletedFast } from '../data/fasts'
import { useFasts } from '../state/FastsProvider'
import { formatElapsed } from '../utils/time'

export default function TimerPage() {
  const { activeFast, start, stop } = useFasts()
  const [, tick] = useState(0)
  const [duration, setDuration] = useState('16:8')
  const [customHours, setCustomHours] = useState('')
  const [completed, setCompleted] = useState<CompletedFast | null>(null)

  useEffect(() => {
    if (!activeFast) return
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [activeFast])

  const resolved = resolveDuration(duration, customHours)

  return (
    <div className="center">
      <div className="elapsed">{activeFast ? formatElapsed(activeFast.startAt) : '00:00:00'}</div>
      <div className="status">
        {activeFast
          ? `Fasting — goal ${activeFast.goalHours}h (${activeFast.scheduleType})`
          : 'Not fasting'}
      </div>
      {!activeFast && (
        <DurationSelect
          value={duration}
          customHours={customHours}
          onChange={setDuration}
          onCustomHoursChange={setCustomHours}
        />
      )}
      {activeFast ? (
        <button className="btn" onClick={() => setCompleted(stop() ?? null)}>End Fast</button>
      ) : (
        <button className="btn" disabled={!resolved} onClick={() => resolved && start(resolved.hours, resolved.scheduleType)}>
          Start Fast
        </button>
      )}
      <CelebrationModal fast={completed} onClose={() => setCompleted(null)} />
    </div>
  )
}
