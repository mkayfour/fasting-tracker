import { forwardRef } from 'react'
import type { CompletedFast } from '../data/fasts'
import { formatDateTime, formatDuration } from '../utils/time'

const FastSummaryCard = forwardRef<HTMLDivElement, { fast: CompletedFast }>(({ fast }, ref) => {
  const hours = (new Date(fast.endAt).getTime() - new Date(fast.startAt).getTime()) / 3_600_000
  const met = hours >= fast.goalHours
  return (
    <div className="card" ref={ref}>
      <div className="card-duration">{formatDuration(fast.startAt, fast.endAt)}</div>
      <div className={`card-goal${met ? ' met' : ''}`}>
        {met ? 'Goal reached' : 'Ended early'} · goal {fast.goalHours}h ({fast.scheduleType})
      </div>
      <hr />
      <div className="card-row"><span>Started</span><span>{formatDateTime(fast.startAt)}</span></div>
      <div className="card-row"><span>Ended</span><span>{formatDateTime(fast.endAt)}</span></div>
    </div>
  )
})
export default FastSummaryCard
