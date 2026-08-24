// ASHA — Patient Registration (Module 1 — frontline entry point)
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Phone, Mic, CheckCircle, Shield, WifiOff, RefreshCw } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useNavigate } from 'react-router-dom'

function generateHealthId() {
  const prefix = '91'
  const rand = () => Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${rand()}-${rand()}-${rand()}`
}

const conditions = ['Pregnancy', 'Diabetes (T2)', 'Hypertension', 'TB', 'Asthma', 'Anaemia', 'Post-surgical', 'None']
const languages  = ['Marathi', 'Hindi', 'English', 'Kannada', 'Telugu', 'Bengali']

export function AshaRegisterPage() {
  const { isOnline, setPendingSyncCount, pendingSyncCount } = useApp()
  const navigate = useNavigate()

  const [step, setStep] = useState<'form' | 'done'>('form')
  const [healthId, setHealthId] = useState('')

  const [form, setForm] = useState({
    name: '', phone: '', age: '', gender: '' as 'M' | 'F' | 'O' | '',
    village: '', condition: 'None', language: 'Marathi',
    aadhaarLast4: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
    setErrors(p => { const next = { ...p }; delete next[field]; return next })
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim())   e.name   = 'Full name is required'
    if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Enter a valid 10-digit mobile number'
    if (!form.age.trim())    e.age    = 'Age is required'
    if (!form.gender)        e.gender = 'Select gender'
    if (!form.village.trim()) e.village = 'Village/locality is required'
    return e
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }

    const id = generateHealthId()
    setHealthId(id)

    // If offline, queue for sync
    if (!isOnline) {
      setPendingSyncCount(pendingSyncCount + 1)
    }

    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[70vh] space-y-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-teal-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A]">Patient registered</h2>
          <p className="text-sm text-[#5F5E5A] mt-1">{form.name} has been added to the system.</p>
        </div>

        <div className="card p-5 w-full text-left space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={15} className="text-teal-500" />
            <p className="text-xs font-semibold text-teal-700">ABDM Health ID generated</p>
          </div>
          <p className="text-lg font-mono font-semibold text-[#2C2C2A] tracking-wide">{healthId}</p>
          <p className="text-xs text-[#5F5E5A]">This ID links to India's Ayushman Bharat Digital Mission. Records will be FHIR-compliant and accessible across all connected facilities.</p>

          {!isOnline && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <WifiOff size={13} />
              <span>Saved offline — will sync to ABDM when connected</span>
            </div>
          )}
          {isOnline && (
            <div className="flex items-center gap-2 text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-2">
              <RefreshCw size={13} />
              <span>Record synced to central health system</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 w-full">
          <button onClick={() => navigate('/asha/triage')} className="btn-primary flex-1 justify-center text-sm">
            Triage this patient
          </button>
          <button onClick={() => { setStep('form'); setForm({ name:'',phone:'',age:'',gender:'',village:'',condition:'None',language:'Marathi',aadhaarLast4:'' }) }}
            className="btn-secondary flex-1 justify-center text-sm">
            Register another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Register new patient</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Creates an ABDM-linked health ID. Works offline — syncs automatically.</p>
      </div>

      {!isOnline && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <WifiOff size={13} /> Offline mode — record will be saved locally and synced when connected
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Full name <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input id="reg-name" type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Meena Jadhav" className="input-field pr-10"
              aria-required="true" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'err-name' : undefined} />
            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#5F5E5A] hover:text-teal-600 transition-colors rounded"
              aria-label="Voice input for name"><Mic size={16} aria-hidden="true" /></button>
          </div>
          <AnimatePresence>{errors.name && <motion.p id="err-name" role="alert" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.name}</motion.p>}</AnimatePresence>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="reg-phone" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Mobile number <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <div className="relative flex">
            <span className="inline-flex items-center px-3 rounded-l-btn border border-r-0 border-[#D3D1C7] bg-gray-50 text-sm text-[#5F5E5A] select-none">+91</span>
            <input id="reg-phone" type="tel" inputMode="numeric" value={form.phone}
              onChange={e => set('phone', e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="9876543210" className="input-field rounded-l-none flex-1"
              aria-required="true" aria-invalid={!!errors.phone} />
          </div>
          <AnimatePresence>{errors.phone && <motion.p role="alert" initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.phone}</motion.p>}</AnimatePresence>
        </div>

        {/* Age + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="reg-age" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
              Age <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <input id="reg-age" type="number" inputMode="numeric" min="0" max="120"
              value={form.age} onChange={e => set('age', e.target.value)}
              placeholder="e.g. 28" className="input-field"
              aria-required="true" aria-invalid={!!errors.age} />
            <AnimatePresence>{errors.age && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.age}</motion.p>}</AnimatePresence>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
              Gender <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div className="flex gap-1.5" role="group" aria-label="Gender">
              {(['F','M','O'] as const).map(g => (
                <button key={g} type="button" onClick={() => set('gender', g)}
                  aria-pressed={form.gender === g}
                  className={`flex-1 py-2.5 text-xs font-semibold rounded-btn border-2 transition-all
                    ${form.gender === g ? 'bg-teal-500 border-teal-500 text-white' : 'border-[#D3D1C7] text-[#5F5E5A] bg-white'}`}>
                  {g === 'F' ? 'Female' : g === 'M' ? 'Male' : 'Other'}
                </button>
              ))}
            </div>
            <AnimatePresence>{errors.gender && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.gender}</motion.p>}</AnimatePresence>
          </div>
        </div>

        {/* Village */}
        <div>
          <label htmlFor="reg-village" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Village / locality <span className="text-red-500" aria-hidden="true">*</span>
          </label>
          <input id="reg-village" type="text" value={form.village} onChange={e => set('village', e.target.value)}
            placeholder="e.g. Mandav, Beed" className="input-field"
            aria-required="true" aria-invalid={!!errors.village} />
          <AnimatePresence>{errors.village && <motion.p role="alert" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="text-xs text-red-600 mt-1">{errors.village}</motion.p>}</AnimatePresence>
        </div>

        {/* Aadhaar last 4 (optional) */}
        <div>
          <label htmlFor="reg-aadhaar" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Aadhaar last 4 digits <span className="text-xs font-normal text-[#5F5E5A]">(optional — for ABDM linking)</span>
          </label>
          <input id="reg-aadhaar" type="text" inputMode="numeric" maxLength={4}
            value={form.aadhaarLast4} onChange={e => set('aadhaarLast4', e.target.value.replace(/\D/g,'').slice(0,4))}
            placeholder="XXXX" className="input-field max-w-[120px]" />
        </div>

        {/* Condition */}
        <div>
          <label htmlFor="reg-condition" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Primary condition / reason for registration
          </label>
          <select id="reg-condition" value={form.condition} onChange={e => set('condition', e.target.value)}
            className="input-field">
            {conditions.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Language preference */}
        <div>
          <label htmlFor="reg-lang" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
            Patient's preferred language
          </label>
          <select id="reg-lang" value={form.language} onChange={e => set('language', e.target.value)}
            className="input-field">
            {languages.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-3.5 text-base">
          <User size={18} aria-hidden="true" /> Register patient & generate health ID
        </button>
      </form>
    </div>
  )
}
