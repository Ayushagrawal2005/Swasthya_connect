import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Role = 'asha' | 'doctor' | 'admin' | null
type Language = 'en' | 'hi' | 'mr'

interface AppState {
  role: Role
  language: Language
  isOnline: boolean
  darkMode: boolean
  pendingSyncCount: number          // offline-queued actions not yet synced
  setPendingSyncCount: (n: number) => void
  setRole: (r: Role) => void
  setLanguage: (l: Language) => void
  toggleDarkMode: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null)
  const [language, setLanguage] = useState<Language>('en')
  const [darkMode, setDarkMode] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  // Real online/offline detection
  useEffect(() => {
    const goOnline  = () => { setIsOnline(true) }
    const goOffline = () => { setIsOnline(false); setPendingSyncCount(p => p + 1) }
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <AppContext.Provider value={{
      role, language, isOnline, darkMode,
      pendingSyncCount, setPendingSyncCount,
      setRole, setLanguage,
      toggleDarkMode: () => setDarkMode(p => !p),
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be inside AppProvider')
  return ctx
}
