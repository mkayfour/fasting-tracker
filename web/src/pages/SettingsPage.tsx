import { CheckIcon } from '../components/icons'
import type { ThemePreference } from '../data/settings'
import { useTheme } from '../theme/ThemeProvider'

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export default function SettingsPage() {
  const { preference, setPreference } = useTheme()
  return (
    <div>
      <h2 className="section-title">Appearance</h2>
      <div className="list">
        {OPTIONS.map((o) => (
          <button key={o.value} onClick={() => setPreference(o.value)}>
            <span>{o.label}</span>
            {preference === o.value && <CheckIcon />}
          </button>
        ))}
      </div>
    </div>
  )
}
