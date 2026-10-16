export const DURATIONS = [
  { value: '16:8', hours: 16, label: '16 hours (16:8)' },
  { value: '18:6', hours: 18, label: '18 hours (18:6)' },
  { value: '20:4', hours: 20, label: '20 hours (20:4)' },
  { value: 'OMAD', hours: 24, label: '24 hours (OMAD)' },
]

export function resolveDuration(
  value: string,
  customHours: string,
): { hours: number; scheduleType: string } | null {
  if (value === 'custom') {
    const hours = parseFloat(customHours)
    return Number.isFinite(hours) && hours > 0 ? { hours, scheduleType: 'custom' } : null
  }
  const preset = DURATIONS.find((d) => d.value === value)
  return preset ? { hours: preset.hours, scheduleType: preset.value } : null
}

type Props = {
  value: string
  customHours: string
  onChange: (value: string) => void
  onCustomHoursChange: (v: string) => void
}

export default function DurationSelect({ value, customHours, onChange, onCustomHoursChange }: Props) {
  return (
    <>
      <select
        className="field"
        aria-label="Fast duration"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {DURATIONS.map((d) => (
          <option key={d.value} value={d.value}>{d.label}</option>
        ))}
        <option value="custom">Custom…</option>
      </select>
      {value === 'custom' && (
        <input
          className="custom-input"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.5"
          placeholder="Hours"
          aria-label="Custom hours"
          value={customHours}
          onChange={(e) => onCustomHoursChange(e.target.value)}
        />
      )}
    </>
  )
}
