import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Settings2, Shield, ArrowRight,
  Heart, Eye, EyeOff, Users, LogIn,
} from 'lucide-react'
import { useT } from '../context/AppContext'
import { authApi } from '../services/api'

// Import logo and hero image
import heroImage from '../assets/images/hero(1).jpg'
import swasthyaConnectLogo from '../assets/images/swasthya_connect.png'

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
  const [loadingMessage, setLoadingMessage] = useState('Signing in...')

  async function handleQuickFill(acc: typeof DEMO_ACCOUNTS[0]) {
    setUsername(acc.username)
    setPassword(acc.password)
    setError('')
    
    // Auto-login after filling
    setLoading(true)
    setLoadingMessage('Connecting to server...')
    
    // Show progress messages for slow networks
    const progressTimer = setTimeout(() => {
      setLoadingMessage('Authenticating...')
    }, 2000)
    
    const slowNetworkTimer = setTimeout(() => {
      setLoadingMessage('Slow network detected. Please wait...')
    }, 5000)
    
    try {
      const res = await authApi.login(acc.username, acc.password)
      
      clearTimeout(progressTimer)
      clearTimeout(slowNetworkTimer)
      setLoadingMessage('Login successful! Redirecting...')
      
      // Set authentication data
      localStorage.setItem('swasthya_token', res.token)
      localStorage.setItem('swasthya_role', res.user.role)
      localStorage.setItem('swasthya_userId', res.user.id)
      localStorage.setItem('swasthya_name', res.user.name)
      localStorage.setItem('swasthya_facilityId', res.user.facilityId || '')
      if (res.user.patientId) {
        localStorage.setItem('swasthya_patientId', res.user.patientId)
      }
      
      // Determine path
      let path = '/patient' // default
      if (res.user.role === 'patient') path = '/patient'
      else if (res.user.role === 'admin') path = '/facility'
      else path = `/${res.user.role}`
      
      // Small delay to show success message
      setTimeout(() => {
        window.location.href = path
      }, 500)
    } catch (err) {
      clearTimeout(progressTimer)
      clearTimeout(slowNetworkTimer)
      console.error('Login error:', err)
      setError('Login failed. Please check your internet connection and try again.')
      setLoading(false)
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoadingMessage('Connecting to server...')
    
    // Show progress messages for slow networks
    const progressTimer = setTimeout(() => {
      setLoadingMessage('Authenticating...')
    }, 2000)
    
    const slowNetworkTimer = setTimeout(() => {
      setLoadingMessage('Slow network detected. Please wait...')
    }, 5000)
    
    try {
      const res = await authApi.login(username.trim(), password)
      
      clearTimeout(progressTimer)
      clearTimeout(slowNetworkTimer)
      setLoadingMessage('Login successful! Redirecting...')
      
      // Set authentication data
      localStorage.setItem('swasthya_token', res.token)
      localStorage.setItem('swasthya_role', res.user.role)
      localStorage.setItem('swasthya_userId', res.user.id)
      localStorage.setItem('swasthya_name', res.user.name)
      localStorage.setItem('swasthya_facilityId', res.user.facilityId || '')
      if (res.user.patientId) {
        localStorage.setItem('swasthya_patientId', res.user.patientId)
      }
      
      // Determine path
      let path = '/patient' // default
      if (res.user.role === 'patient') path = '/patient'
      else if (res.user.role === 'admin') path = '/facility'
      else path = `/${res.user.role}`
      
      // Small delay to show success message
      setTimeout(() => {
        window.location.href = path
      }, 500)
    } catch (err) {
      clearTimeout(progressTimer)
      clearTimeout(slowNetworkTimer)
      console.error('Login error:', err)
      setError('Username or password is incorrect. Click a demo role card below to auto-fill.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#123B6D]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E85D04]/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#123B6D]/3 rounded-full blur-3xl" />
      </div>

      {/* Main Content Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-6xl relative z-10"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          {/* Left Card - Branding & Hero */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-[#123B6D] to-[#1a5490] rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden relative"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0">
              <img 
                src={heroImage} 
                alt="Healthcare" 
                className="w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#123B6D]/95 via-[#123B6D]/90 to-[#1a5490]/85" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 md:p-10 lg:p-12 flex flex-col h-full min-h-[500px] lg:min-h-[700px]">
              {/* Logo */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex h-16 w-16 md:h-20 md:w-20 items-center justify-center bg-white rounded-2xl shadow-xl p-3">
                  <img src={swasthyaConnectLogo} alt="Swasthya Connect" className="h-full w-full object-contain" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-2xl md:text-3xl font-bold text-white">Swasthya Connect</span>
                  <span className="text-sm md:text-base text-gray-200 font-medium">स्वास्थ्य कनेक्ट</span>
                </div>
              </div>

              {/* Hero Content */}
              <div className="flex-1 flex flex-col justify-center space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white">
                    Government Healthcare Platform
                  </h1>
                  <p className="text-base md:text-lg text-gray-100 leading-relaxed">
                    Unified digital health infrastructure connecting citizens, healthcare workers, and facilities across India's public health system.
                  </p>
                </div>

                {/* Key Features */}
                <div className="space-y-3">
                  {[
                    { icon: <Shield className="w-5 h-5" />, text: 'Secure & ABDM Compliant' },
                    { icon: <Users className="w-5 h-5" />, text: 'Multi-role Access System' },
                    { icon: <Heart className="w-5 h-5" />, text: 'Patient-Centric Care' },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.1 }}
                      className="flex items-center gap-3 text-white"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                        {feature.icon}
                      </div>
                      <span className="text-sm md:text-base font-medium">{feature.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Healthcare Tier */}
              <div className="mt-auto pt-6 border-t border-white/20">
                <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
                  {['Sub-centre', 'PHC', 'CHC', 'District'].map((tier, i, arr) => (
                    <div key={tier} className="flex items-center gap-2">
                      <span className="bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1 rounded-full font-medium">
                        {tier}
                      </span>
                      {i < arr.length - 1 && <ArrowRight className="w-3 h-3 text-white/50" />}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-300 mt-4">HealthSync1 Team <span className="text-gray-400">*ID - 165109*</span></p>
              </div>
            </div>
          </motion.div>

          {/* Right Card - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col"
          >
            {/* Demo Accounts - Compact Card Style */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 md:p-6 mb-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E85D04] to-[#d94f03] flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#123B6D]">Quick Access</p>
                  <p className="text-xs text-gray-600">Click to auto-login</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleQuickFill(acc)}
                    className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 hover:border-[#E85D04] hover:from-[#E85D04]/5 hover:to-[#E85D04]/10 hover:shadow-lg transition-all duration-200 text-left group"
                    aria-label={`Login as ${acc.label}`}
                  >
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border-2 ${acc.color} group-hover:scale-110 transition-transform duration-200`}>
                      {acc.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#123B6D] truncate">{acc.label}</p>
                      <p className="text-[9px] text-gray-500 truncate">{acc.sublabel}</p>
                    </div>
                  </button>
                ))}
              </div>
              
              <p className="text-[10px] text-gray-500 mt-3 flex items-center gap-1.5">
                <span>Password:</span>
                <code className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[#E85D04] font-bold">demo1234</code>
              </p>
            </div>

            {/* Login Form Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 flex-1">
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-[#123B6D] mb-1">{t('signIn')}</h2>
                <p className="text-sm text-gray-600">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleSignIn} noValidate className="space-y-5">
                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-bold text-[#123B6D] mb-2">
                    {t('username')}
                  </label>
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError('') }}
                    placeholder="Enter username or email"
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E85D04] focus:border-[#E85D04] transition-all text-base font-medium placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                    aria-required="true"
                    aria-invalid={!!error}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-bold text-[#123B6D] mb-2">
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
                      className="w-full px-4 py-3.5 pr-12 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E85D04] focus:border-[#E85D04] transition-all text-base font-medium placeholder:text-gray-400 bg-gray-50 focus:bg-white"
                      aria-required="true"
                      aria-invalid={!!error}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-[#E85D04] hover:bg-[#E85D04]/10 rounded-lg transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error or Loading Status */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl"
                    >
                      <p className="text-sm text-red-700 font-medium">{error}</p>
                    </motion.div>
                  )}
                  {loading && !error && (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-blue-50 border-l-4 border-[#123B6D] p-4 rounded-r-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full border-3 border-[#123B6D]/30 border-t-[#123B6D] animate-spin flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-[#123B6D] font-medium">{loadingMessage}</p>
                          <p className="text-xs text-gray-600 mt-0.5">This may take a moment on first login</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full bg-gradient-to-r from-[#E85D04] to-[#d94f03] hover:from-[#d94f03] hover:to-[#c44803] disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-3 text-lg shadow-lg hover:shadow-2xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 rounded-full border-3 border-white/30 border-t-white animate-spin" />
                      <span>{loadingMessage}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('signIn')}</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-center text-gray-500 mt-6">
                By signing in, you agree to our{' '}
                <span className="text-[#123B6D] font-semibold">Terms</span> &{' '}
                <span className="text-[#123B6D] font-semibold">Privacy Policy</span>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
