import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Settings2, Shield, ArrowRight,
  Heart, Eye, EyeOff, Copy, CheckCheck, Users,
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Role } from '../context/AppContext'

// ── Demo credentials — one per role ──────────────────────────────
const DEMO_ACCOUNTS: {
  id: Role
  label: string
  sublabel: string
  email: string
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
    email: 'asha@swasthya.in',
    password: 'demo1234',
    name: 'Kavita Shinde',
    icon: <Users size={16} />,
    color: 'bg-green-50 text-green-600 border-green-200',
    path: '/asha',
  },
  {
    id: 'doctor',
    label: 'Doctor / Clinician',
    sublabel: 'Queue, consult, prescriptions',
    email: 'doctor@swasthya.in',
    password: 'demo1234',
    name: 'Dr. Ramesh Patil',
    icon: <Stethoscope size={16} />,
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    path: '/doctor',
  },
  {
    id: 'admin',
    label: 'Facility Admin',
    sublabel: 'KPIs, inventory, quality dashboard',
    email: 'admin@swasthya.in',
    password: 'demo1234',
    name: 'Anjali Kulkarni',
    icon: <Settings2 size={16} />,
    color: 'bg-coral-50 text-coral-600 border-coral-200',
    path: '/admin',
  },
]

type CopyKey = string | null

export function LoginPage() {
  const { setRole } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<CopyKey>(null)

  function handleQuickFill(acc: typeof DEMO_ACCOUNTS[0]) {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const match = DEMO_ACCOUNTS.find(
      a => a.email === email.trim().toLowerCase() && a.password === password
    )
    if (!match) {
      setError('Email or password is incorrect. Use one of the demo credentials below.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setRole(match.id)
      navigate(match.path)
    }, 900)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-stretch">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-[42%] bg-gradient-to-br from-teal-500 to-teal-700 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-16 left-8 w-36 h-36 rounded-full border border-white/20" />
          <div className="absolute bottom-24 right-8 w-60 h-60 rounded-full border border-white/15" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border border-white/10" />
        </div>
        <div className="relative mb-auto">
          <div className="flex items-center gap-2 mb-10">
            <Heart size={22} fill="currentColor" aria-hidden="true" />
            <span className="text-xl font-semibold">SwasthyaConnect</span>
          </div>
          <h1 className="text-3xl font-semibold leading-snug mb-3">
            Connecting care across<br />every level of the system
          </h1>
          <p className="text-teal-100 text-sm leading-relaxed mb-8">
            Sub-centre to district hospital — frontline workers, doctors, and administrators on one integrated platform.
          </p>
          {/* Tier chain */}
          <div className="flex items-center gap-2 flex-wrap">
            {['Sub-centre', 'PHC', 'Rural Hospital', 'District'].map((tier, i, arr) => (
              <div key={tier} className="flex items-center gap-2">
                <span className="text-xs bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">{tier}</span>
                {i < arr.length - 1 && <ArrowRight size={12} className="text-white/50" />}
              </div>
            ))}
          </div>
        </div>
        <div className="relative mt-auto space-y-2">
          {[
            'ABDM/FHIR-compliant health records',
            'Offline-first — works without internet',
            'Available in English, हिंदी, मराठी',
            'Role-based access — ASHA to Admin',
          ].map(f => (
            <div key={f} className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Shield size={10} aria-hidden="true" />
              </div>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Demo credentials card */}
          <div className="mb-7 rounded-card border border-[#D3D1C7] bg-[#FAFAF7] p-4">
            <p className="text-xs font-semibold text-[#5F5E5A] uppercase tracking-wide mb-3">
              Demo accounts — click row to fill
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map(acc => (
                <div key={acc.id!} className="flex items-center gap-3 p-2.5 rounded-xl border border-[#D3D1C7] bg-white hover:border-teal-200 transition-colors">
                  <button
                    onClick={() => handleQuickFill(acc)}
                    className="flex items-center gap-2 flex-1 text-left min-w-0"
                    aria-label={`Fill credentials for ${acc.label}`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border ${acc.color}`} aria-hidden="true">
                      {acc.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#2C2C2A]">{acc.label}</p>
                      <p className="text-[10px] text-[#5F5E5A] truncate">{acc.email}</p>
                    </div>
                  </button>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => copyToClipboard(acc.email, `${acc.id}-email`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5F5E5A] hover:text-teal-600 transition-colors"
                      aria-label={`Copy ${acc.label} email`} title="Copy email"
                    >
                      {copied === `${acc.id}-email` ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(acc.password, `${acc.id}-pw`)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-[#5F5E5A] hover:text-teal-600 transition-colors"
                      aria-label={`Copy ${acc.label} password`} title="Copy password"
                    >
                      {copied === `${acc.id}-pw` ? <CheckCheck size={13} className="text-green-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#5F5E5A] mt-2.5">
              Password for all accounts: <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">demo1234</code>
            </p>
          </div>

          {/* Sign-in form */}
          <h2 className="text-2xl font-semibold text-[#2C2C2A] mb-1">Sign in</h2>
          <p className="text-[#5F5E5A] text-sm mb-6">Select a demo account above or enter your credentials.</p>

          <form onSubmit={handleSignIn} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Email address</label>
              <input id="email" type="email" autoComplete="email"
                value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="you@swasthya.in" className="input-field"
                aria-required="true" aria-invalid={!!error}
                aria-describedby={error ? 'login-error' : undefined} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                  placeholder="••••••••" className="input-field pr-11"
                  aria-required="true" aria-invalid={!!error} />
                <button type="button" onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#5F5E5A] hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                </button>
              </div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p id="login-error" role="alert"
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <button type="submit" disabled={loading || !email || !password}
              className="btn-primary w-full justify-center mt-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>Sign in <ArrowRight size={17} aria-hidden="true" /></>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
