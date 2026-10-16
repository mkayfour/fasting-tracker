import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FastsProvider } from './state/FastsProvider'
import { ThemeProvider } from './theme/ThemeProvider'

// Ask the browser not to evict our localStorage data; failures are ignored.
try { void navigator.storage?.persist?.()?.catch(() => {}) } catch { /* ignore */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FastsProvider>
        <App />
      </FastsProvider>
    </ThemeProvider>
  </StrictMode>,
)
