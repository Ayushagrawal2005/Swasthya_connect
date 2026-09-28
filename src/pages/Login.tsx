import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Settings2, Shield, ArrowRight,
  Heart, Eye, EyeOff, Users, Activity, CheckCircle,
} from 'lucide-react'
import { useT } from '../context/AppContext'
import { authApi } from '../services/api'

type DemoRole = 'asha' | 'doctor' | 'admin' | 'patient' | 'patient_female' | 'patient_male'

// ── Demo credentials — one per role ──────────────────────────────
const DEMO_ACCOUNTS: {
  id: DemoRole
  label: string
  sublabel: string
  username: string
  password: string
  name: string
  icon: React.ReactNode
  color: string
  path: string
}[] = [
  {
    id: 'asha',
    label: 'Frontline Worker',
    sublabel: 'ASHA / ANM — triage, referrals & follow-up',
    username: 'asha1',
    password: 'password',
    name: 'Kavita Shinde',
    icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'bg-green-50 text-green-600 border-green-200',
    path: '/asha',
  },
  {
    id: 'doctor',
    label: 'Doctor / Clinician',
    sublabel: 'Queue, consult, prescriptions',
    username: 'doctor1',
    password: 'password',
    name: 'Dr. Ramesh Patil',
    icon: <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'bg-blue-50 text-blue-600 border-blue-200',
    path: '/doctor',
  },
  {
    id: 'admin',
    label: 'Facility Admin',
    sublabel: 'KPIs, inventory, quality dashboard',
    username: 'admin1',
    password: 'password',
    name: 'Anjali Kulkarni',
    icon: <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'bg-purple-50 text-purple-600 border-purple-200',
    path: '/facility',
  },
  {
    id: 'patient_female',
    label: 'Female Patient (with children)',
    sublabel: 'Priya — menstrual tracker, family, vaccinations',
    username: 'priya@demo.com',
    password: 'priya123',
    name: 'Priya Sharma',
    icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'bg-pink-50 text-pink-600 border-pink-200',
    path: '/patient',
  },
  {
    id: 'patient_male',
    label: 'Male Patient',
    sublabel: 'Raj — view records, book appointments',
    username: 'raj@demo.com',
    password: 'raj123',
    name: 'Raj Kumar',
    icon: <Heart className="w-4 h-4 sm:w-5 sm:h-5" />,
    color: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    path: '/patient',
  },
]

type CopyKey = string | null

export function LoginPage() {
  const t = useT()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [clearedOnce, setClearedOnce] = useState(false)

  // Clear localStorage ONCE when component mounts
  useEffect(() => {
    if (!clearedOnce) {
      localStorage.clear()
      setClearedOnce(true)
    }
  }, [clearedOnce])

  async function handleQuickFill(acc: typeof DEMO_ACCOUNTS[0]) {
    setUsername(acc.username)
    setPassword(acc.password)
    setError('')
    
    // Auto-login after filling
    setLoading(true)
    
    try {
      const res = await authApi.login(acc.username, acc.password)
      
      // Clear old data and set new data
      localStorage.clear()
      localStorage.setItem('swasthya_token', res.token)
      localStorage.setItem('swasthya_role', res.user.role)
      localStorage.setItem('swasthya_userId', res.user.id)
      localStorage.setItem('swasthya_name', res.user.name)
      localStorage.setItem('swasthya_facilityId', res.user.facilityId || '')
      if (res.user.patientId) {
        localStorage.setItem('swasthya_patientId', res.user.patientId)
      }
      
      // Hard redirect to avoid React state issues
      let path = '/patient' // default
      if (res.user.role === 'patient') path = '/patient'
      else if (res.user.role === 'admin') path = '/facility'
      else path = `/${res.user.role}`
      
      window.location.href = path
    } catch (err) {
      console.error('Login error:', err)
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await authApi.login(username.trim(), password)
      
      // Clear old data and set new data
      localStorage.clear()
      localStorage.setItem('swasthya_token', res.token)
      localStorage.setItem('swasthya_role', res.user.role)
      localStorage.setItem('swasthya_userId', res.user.id)
      localStorage.setItem('swasthya_name', res.user.name)
      localStorage.setItem('swasthya_facilityId', res.user.facilityId || '')
      if (res.user.patientId) {
        localStorage.setItem('swasthya_patientId', res.user.patientId)
      }
      
      // Hard redirect to avoid React state issues
      let path = '/patient' // default
      if (res.user.role === 'patient') path = '/patient'
      else if (res.user.role === 'admin') path = '/facility'
      else path = `/${res.user.role}`
      
      window.location.href = path
    } catch (err) {
      console.error('Login error:', err)
      setError('Username or password is incorrect. Click a demo role card below to auto-fill.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-stretch bg-gray-50">
      {/* Left panel - Brand Hero */}
      <div className="hidden lg:flex flex-col w-[45%] bg-gradient-to-br from-[#123B6D] to-[#1a5490] text-white p-8 md:p-10 lg:p-12 xl:p-16 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-16 left-8 w-32 h-32 md:w-40 md:h-40 rounded-full border-2 border-white/10" />
          <div className="absolute bottom-24 right-8 w-48 h-48 md:w-64 md:h-64 rounded-full border-2 border-white/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 md:w-80 md:h-80 rounded-full border border-white/10" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo & Brand */}
          <div className="mb-auto">
            <div className="flex items-center gap-2 sm:gap-3 mb-8 md:mb-12">
              <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-[#E85D04]" aria-hidden="true" />
              <span className="text-xl sm:text-2xl font-bold">Swasthya Connect</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4 md:mb-6">
              Government Healthcare Platform
            </h1>
            <p className="text-base sm:text-lg text-gray-200 leading-relaxed mb-8 md:mb-12">
              Unified digital health infrastructure connecting citizens, healthcare workers, and facilities across India's public health system.
            </p>

            {/* Healthcare Tier Chain */}
            <div className="flex items-center gap-2 flex-wrap mb-8 md:mb-12">
              {['Sub-centre', 'PHC', 'CHC', 'District Hospital'].map((tier, i, arr) => (
                <div key={tier} className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm bg-white/10 border border-white/20 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium">
                    {tier}
                  </span>
                  {i < arr.length - 1 && <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 text-white/50" />}
                </div>
              ))}
            </div>
          </div>

          {/* Platform Features */}
          <div className="relative space-y-3 md:space-y-4">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-[#E85D04] mb-4">
              Platform Features
            </p>
            {[
              'ABDM/FHIR-compliant health records',
              'Offline-first — works without internet',
              'Multi-language support (6 Indian languages)',
              'Role-based access for all healthcare tiers',
              'AI-powered triage and diagnostics',
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-3 text-sm sm:text-base">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#E85D04]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#E85D04]" aria-hidden="true" />
                </div>
                <span className="leading-relaxed">{feature}</span>
              </div>
            ))}
          </div>

          {/* Team Branding */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-300">HealthSync1 Team <span className="text-gray-400">*ID - 165109*</span></p>
          </div>
        </div>
      </div>

      {/* Right panel - Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md lg:max-w-lg"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-6 sm:mb-8">
            <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-[#E85D04]" aria-hidden="true" />
            <span className="text-xl sm:text-2xl font-bold text-[#123B6D]">Swasthya Connect</span>
          </div>

          {/* Demo credentials card */}
          <div className="mb-6 sm:mb-8 rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5 md:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#E85D04]/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#E85D04]" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#123B6D] uppercase tracking-wide">
                Demo Accounts — Click to Auto-Login
              </p>
            </div>
            
            <div className="space-y-2 sm:space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleQuickFill(acc)}
                  className="w-full flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg border border-gray-200 bg-white hover:border-[#E85D04] hover:shadow-md transition-all duration-200 text-left group"
                  aria-label={`Login as ${acc.label}`}
                >
                  <span className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${acc.color}`} aria-hidden="true">
                    {acc.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-[#123B6D] mb-0.5">{acc.label}</p>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">{acc.sublabel}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#E85D04] transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>
            
            <p className="text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4 flex items-center gap-1.5">
              <span>Password for all accounts:</span>
              <code className="font-mono bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[#123B6D] font-medium">demo1234</code>
            </p>
          </div>

          {/* Sign-in form */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-7 md:p-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#123B6D] mb-2">{t('signIn')}</h2>
              <p className="text-sm sm:text-base text-gray-600">Select a demo account above or enter your credentials.</p>
            </div>

            <form onSubmit={handleSignIn} noValidate className="space-y-4 sm:space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm sm:text-base font-medium text-[#123B6D] mb-1.5 sm:mb-2">
                  {t('username')}
                </label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError('') }}
                  placeholder="Enter username or email"
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85D04] focus:border-[#E85D04] transition-colors text-sm sm:text-base"
                  aria-required="true"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'login-error' : undefined}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm sm:text-base font-medium text-[#123B6D] mb-1.5 sm:mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError('') }}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 sm:px-4 sm:py-2.5 pr-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E85D04] focus:border-[#E85D04] transition-colors text-sm sm:text-base"
                    aria-required="true"
                    aria-invalid={!!error}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-[#E85D04] hover:bg-[#E85D04]/10 rounded-lg transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    id="login-error"
                    role="alert"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded"
                  >
                    <p className="text-xs sm:text-sm text-red-700">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full bg-[#E85D04] hover:bg-[#d94f03] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base mt-6"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>{t('signIn')}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
                  </>
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="text-xs sm:text-sm text-center text-gray-500 mt-6">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>

          {/* Mobile Team Branding */}
          <div className="lg:hidden mt-6 text-center">
            <p className="text-xs text-gray-500">HealthSync1 Team <span className="text-gray-400">*ID - 165109*</span></p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
