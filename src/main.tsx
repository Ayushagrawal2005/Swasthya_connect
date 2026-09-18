import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './test-env'  // Test env vars on load
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'

// Initialize offline sync service for ASHA workers
import { offlineSyncService } from './services/offlineSync'
offlineSyncService.init().catch(console.error)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
