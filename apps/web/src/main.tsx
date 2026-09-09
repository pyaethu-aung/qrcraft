import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'
import { LocaleProvider } from './hooks/LocaleProvider'
import { ThemeProvider } from './hooks/ThemeProvider'
import { hydrateShareConfig } from './utils/shareConfig'

// Apply a shared `#c=` config (if present) into the draft stores before the app reads
// them, then strip the hash. Must run before render so every hook restores from it.
hydrateShareConfig()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <ThemeProvider>
        <LocaleProvider>
          <App />
        </LocaleProvider>
      </ThemeProvider>
    </HelmetProvider>
  </StrictMode>,
)
