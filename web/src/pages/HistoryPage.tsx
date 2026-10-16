import { useState } from 'react'
import FastDetailModal from '../components/FastDetailModal'
import type { CompletedFast } from '../data/fasts'
import { useFasts } from '../state/FastsProvider'
import { formatClockTime, formatDuration, formatRelativeTime } from '../utils/time'

export default function HistoryPage() {
  const { history } = useFasts()
  const [selected, setSelected] = useState<CompletedFast | null>(null)

  if (history.length === 0) return <div className="empty">No fasts yet</div>

  return (
    <div>
      {history.map((f) => (
        <button key={f.id} className="row" onClick={() => setSelected(f)}>
          <div className="row-top">
            <span className="row-date">{new Date(f.startAt).toLocaleDateString()}</span>
            <span className="row-sub">{formatRelativeTime(f.endAt)}</span>
          </div>
          <div className="row-sub">{formatDuration(f.startAt, f.endAt)} · {f.scheduleType}</div>
          <div className="row-sub">{formatClockTime(f.startAt)} – {formatClockTime(f.endAt)}</div>
        </button>
      ))}
      <FastDetailModal fast={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
