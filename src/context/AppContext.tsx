import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Role = 'asha' | 'doctor' | 'admin' | 'patient' | null
type Language = 'en' | 'hi' | 'mr'

interface AppState {
  role: Role
  userId: string | null
  userName: string | null
  facilityId: string | null
  patientId: string | null   // for patient-role users
  token: string | null
  language: Language
  isOnline: boolean
  darkMode: boolean
  pendingSyncCount: number
  setPendingSyncCount: (n: number) => void
  setRole: (r: Role) => void
  setLanguage: (l: Language) => void
  toggleDarkMode: () => void
  login: (token: string, role: Role, name: string, userId: string, facilityId: string, patientId?: string) => void
  logout: () => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => localStorage.getItem('swasthya_role') as Role || null)
  const [token, setToken]     = useState<string | null>(() => localStorage.getItem('swasthya_token'))
  const [userId, setUserId]   = useState<string | null>(() => localStorage.getItem('swasthya_userId'))
  const [userName, setUserName] = useState<string | null>(() => localStorage.getItem('swasthya_name'))
  const [facilityId, setFacilityId] = useState<string | null>(() => localStorage.getItem('swasthya_facilityId'))
  const [patientId, setPatientId]   = useState<string | null>(() => localStorage.getItem('swasthya_patientId'))
  const [language, setLanguage]     = useState<Language>('en')
  const [darkMode, setDarkMode]     = useState(false)
  const [isOnline, setIsOnline]     = useState(navigator.onLine)
  const [pendingSyncCount, setPendingSyncCount] = useState(0)

  useEffect(() => {
    const goOnline  = () => setIsOnline(true)
    const goOffline = () => { setIsOnline(false); setPendingSyncCount(p => p + 1) }
    window.addEventListener('online',  goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online',  goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  function login(tok: string, r: Role, name: string, uid: string, fid: string, pid?: string) {
    localStorage.setItem('swasthya_token',     tok)
    localStorage.setItem('swasthya_role',      r || '')
    localStorage.setItem('swasthya_userId',    uid)
    localStorage.setItem('swasthya_name',      name)
    localStorage.setItem('swasthya_facilityId', fid)
    if (pid) localStorage.setItem('swasthya_patientId', pid)
    setToken(tok)
    setRoleState(r)
    setUserId(uid)
    setUserName(name)
    setFacilityId(fid)
    if (pid) setPatientId(pid)
  }

  function logout() {
    ['swasthya_token','swasthya_role','swasthya_userId','swasthya_name','swasthya_facilityId','swasthya_patientId']
      .forEach(k => localStorage.removeItem(k))
    setToken(null); setRoleState(null); setUserId(null)
    setUserName(null); setFacilityId(null); setPatientId(null)
  }

  return (
    <AppContext.Provider value={{
      role, userId, userName, facilityId, patientId, token,
      language, isOnline, darkMode, pendingSyncCount,
      setPendingSyncCount, setRole: setRoleState, setLanguage,
      toggleDarkMode: () => setDarkMode(p => !p),
      login, logout,
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
