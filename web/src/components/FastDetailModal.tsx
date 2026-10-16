import type { CompletedFast } from '../data/fasts'
import FastSummaryCard from './FastSummaryCard'

export default function FastDetailModal({ fast, onClose }: { fast: CompletedFast | null; onClose: () => void }) {
  if (!fast) return null
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Fast details" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <FastSummaryCard fast={fast} />
      </div>
      <button className="btn btn-secondary" onClick={onClose}>Close</button>
    </div>
  )
}
