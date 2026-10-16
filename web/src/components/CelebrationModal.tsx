import { useEffect, useRef, useState } from 'react'
import type { CompletedFast } from '../data/fasts'
import { renderCardImage, shareFile } from '../share'
import FastSummaryCard from './FastSummaryCard'

type Props = { fast: CompletedFast | null; onClose: () => void }

export default function CelebrationModal({ fast, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    setFile(null)
    setError(false)
    if (!fast || !cardRef.current) return
    let cancelled = false
    renderCardImage(cardRef.current, `fast-${fast.id}.png`)
      .then((f) => { if (!cancelled) setFile(f) })
      .catch(() => { if (!cancelled) setError(true) })
    return () => { cancelled = true }
  }, [fast])

  if (!fast) return null

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Fast complete">
      <h2>Fast complete 🎉</h2>
      <FastSummaryCard ref={cardRef} fast={fast} />
      <button className="btn" disabled={!file} onClick={() => file && shareFile(file)}>
        {error ? 'Sharing unavailable' : file ? 'Share' : 'Preparing…'}
      </button>
      <button className="btn-link" onClick={onClose}>Close</button>
    </div>
  )
}
