import { useState } from 'react'
import TabBar, { type TabName } from './components/TabBar'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import TimerPage from './pages/TimerPage'

const TITLES: Record<TabName, string> = {
  Timer: 'Fasting Tracker',
  History: 'History',
  Settings: 'Settings',
}

export default function App() {
  const [tab, setTab] = useState<TabName>('Timer')
  return (
    <div className="app">
      <header className="header">{TITLES[tab]}</header>
      <main className="page">
        {tab === 'Timer' && <TimerPage />}
        {tab === 'History' && <HistoryPage />}
        {tab === 'Settings' && <SettingsPage />}
      </main>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}
