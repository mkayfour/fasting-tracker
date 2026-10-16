import { HistoryIcon, SettingsIcon, TimerIcon } from './icons'

export type TabName = 'Timer' | 'History' | 'Settings'

const TABS: { name: TabName; icon: () => React.JSX.Element }[] = [
  { name: 'Timer', icon: TimerIcon },
  { name: 'History', icon: HistoryIcon },
  { name: 'Settings', icon: SettingsIcon },
]

export default function TabBar({ active, onChange }: { active: TabName; onChange: (t: TabName) => void }) {
  return (
    <nav className="tabbar">
      {TABS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          className="tab"
          aria-current={active === name ? 'page' : undefined}
          onClick={() => onChange(name)}
        >
          <Icon />
          {name}
        </button>
      ))}
    </nav>
  )
}
