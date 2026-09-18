import { Navigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'asha' | 'doctor' | 'admin' | 'patient'
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { role } = useApp()
  const token = localStorage.getItem('swasthya_token')
  
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />
  }
  
  // If token exists but role not loaded yet, show loading or wait
  if (!role) {
    // Role should be in localStorage, check there
    const storedRole = localStorage.getItem('swasthya_role')
    if (!storedRole) {
      return <Navigate to="/login" replace />
    }
    // Role is loading from AppContext, render children anyway
  }
  
  // If specific role required, check it matches
  if (requiredRole && role !== requiredRole) {
    // Redirect to their correct dashboard
    return <Navigate to={`/${role}`} replace />
  }
  
  return <>{children}</>
}
