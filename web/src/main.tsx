import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { FastsProvider } from './state/FastsProvider'
import { ThemeProvider } from './theme/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <FastsProvider>
        <App />
      </FastsProvider>
    </ThemeProvider>
  </StrictMode>,
)
