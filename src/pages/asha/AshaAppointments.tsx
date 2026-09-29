import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, ChevronRight, CheckCircle, Calendar, Stethoscope, Loader2, AlertCircle, Search, User } from 'lucide-react'
import { appointmentsApi, patientsApi, type FacilityWithDoctors, type Doctor, type Appointment, type PatientRecord } from '../../services/api'

type Step = 'facility' | 'doctor' | 'slot' | 'confirm'

export function AshaAppointmentsPage() {
  const [step, setStep]           = useState<Step>('facility')
  const [facilities, setFacilities] = useState<FacilityWithDoctors[]>([])
  const [loadingFac, setLoadingFac] = useState(true)
  const [facError, setFacError]   = useState('')
  const [slots, setSlots]         = useState<string[]>([])
  const [facility, setFacility]   = useState<FacilityWithDoctors | null>(null)
  const [doctor, setDoctor]       = useState<Doctor | null>(null)
  const [slot, setSlot]           = useState('')
  const [booked, setBooked]       = useState<Appointment | null>(null)
  const [booking, setBooking]     = useState(false)
  const [bookError, setBookError] = useState('')

  // Patient selection
  const [patientName, setPatientName]   = useState('')
  const [patientId, setPatientId]       = useState<string | undefined>(undefined)
  const [searching, setSearching]       = useState(false)
  const [searchResults, setSearchResults] = useState<PatientRecord[]>([])
  const [showSearch, setShowSearch]     = useState(false)

  const today = new Date().toISOString().split('T')[0]

  // Load facilities on mount
  useEffect(() => {
    setFacError('')
    appointmentsApi.facilities()
      .then(data => setFacilities(data.filter(f => f.tier !== 'sub-centre')))
      .catch(err => setFacError(err?.message || 'Could not load facilities'))
      .finally(() => setLoadingFac(false))
  }, [])

  // Load slots when facility is chosen
  useEffect(() => {
    if (!facility) return
    setSlots([])
    appointmentsApi.slots(facility.id, today)
      .then(r => setSlots(r.slots))
      .catch(() => setSlots(['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30']))
  }, [facility, today])

  // Patient search
  useEffect(() => {
    if (patientName.length < 2) { setSearchResults([]); return }
    const t = setTimeout(() => {
      setSearching(true)
      patientsApi.search(patientName)
        .then(r => setSearchResults(r.slice(0, 5)))
        .catch(() => setSearchResults([]))
        .finally(() => setSearching(false))
    }, 300)
    return () => clearTimeout(t)
  }, [patientName])

  function selectPatient(p: PatientRecord) {
    setPatientName(p.name)
    setPatientId(p.id)
    setSearchResults([])
    setShowSearch(false)
  }

  function confirmBook() {
    if (!facility || !doctor || !slot || !patientName.trim()) return
    setBooking(true)
    setBookError('')
    appointmentsApi.book({
      patientName: patientName.trim(),
      patientId,
      facilityId: facility.id,
      doctorId:   doctor.id,
      date:       today,
      time:       slot,
      type:       'in-person',
    })
      .then(appt => setBooked(appt))
      .catch(err  => setBookError(err?.message || 'Booking failed. Please try again.'))
      .finally(() => setBooking(false))
  }

  // ─── Success screen ────────────────────────────────────────
  if (booked && facility && doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border-2 border-gray-100 p-8 sm:p-10 text-center space-y-6"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <CheckCircle size={40} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#123B6D] mb-2">Appointment Confirmed!</h2>
            <p className="text-base text-gray-700 font-medium">{patientName}</p>
            <div className="mt-4 space-y-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Facility</p>
                <p className="font-bold text-[#123B6D]">{facility.name}</p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border-2 border-orange-200">
                <p className="text-sm text-gray-600 mb-1">Doctor · Time</p>
                <p className="font-bold text-[#123B6D]">{doctor.name} · {booked.time}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                <p className="text-sm text-gray-600 mb-1">Token Number · Queue Position</p>
                <p className="font-bold text-[#E85D04] text-xl">#{booked.token} · Position {booked.queuePosition}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-3">Estimated wait time: <span className="font-semibold">~{booked.estimatedWait} minutes</span></p>
          </div>
          <button onClick={() => {
          setBooked(null); setStep('facility'); setFacility(null)
          setDoctor(null); setSlot(''); setPatientName(''); setPatientId(undefined); setBookError('')
        }} className="w-full bg-gradient-to-r from-[#E85D04] to-[#d94f03] hover:from-[#d94f03] hover:to-[#c44803] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl">
            Book Another Appointment
          </button>
        </motion.div>
      </div>
    )
  }

  const steps: Step[] = ['facility', 'doctor', 'slot', 'confirm']
  const stepLabels: Record<Step, string> = { facility: 'Facility', doctor: 'Doctor', slot: 'Time', confirm: 'Confirm' }
  const curIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100"
        >
          <h1 className="text-2xl font-bold text-[#123B6D]">Book Appointment</h1>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
            <Calendar size={16} className="text-[#E85D04]" />
            Schedule for <span className="font-semibold">{new Date(today).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </p>
        </motion.div>

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border-2 border-gray-100 space-y-6"
        >
          
          {/* Patient name input with search */}
          <div className="relative">
            <label htmlFor="appt-patient" className="block text-sm font-bold text-[#123B6D] mb-2">
              Patient Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {searching ? <Loader2 size={18} className="animate-spin text-[#E85D04]" /> : <Search size={18} className="text-gray-400" />}
              </div>
              <input
                id="appt-patient"
                type="text"
                value={patientName}
                onChange={e => { setPatientName(e.target.value); setPatientId(undefined); setShowSearch(true) }}
                onFocus={() => setShowSearch(true)}
                placeholder="Type to search or enter patient name"
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#E85D04] focus:border-[#E85D04] transition-colors font-medium"
                autoComplete="off"
              />
            </div>
            {patientId && (
              <p className="text-xs text-green-700 mt-2 flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 inline-flex">
                <CheckCircle size={14} /> Linked to existing patient record
              </p>
            )}

            {/* Dropdown search results */}
            <AnimatePresence>
              {showSearch && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute z-20 left-0 right-0 top-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                >
                  {searchResults.map(p => (
                    <button key={p.id} onMouseDown={() => selectPatient(p)}
                      className="w-full px-4 py-4 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 flex items-center gap-3 border-b-2 border-gray-100 last:border-0 transition-all">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E85D04] to-[#d94f03] flex items-center justify-center flex-shrink-0">
                        <User size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#123B6D]">{p.name}</p>
                        <p className="text-xs text-gray-600">{p.age}y · {p.village} · {p.healthId}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Step indicators */}
          <div className="flex gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 flex-shrink-0 w-full">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-md
                    ${i <= curIdx ? 'bg-gradient-to-br from-[#E85D04] to-[#d94f03] text-white scale-110' : 'bg-gray-200 text-gray-500'}`}>
                    {i < curIdx ? <CheckCircle size={20} /> : i + 1}
                  </div>
                  <span className={`text-xs font-semibold ${i === curIdx ? 'text-[#E85D04]' : 'text-gray-500'}`}>{stepLabels[s]}</span>
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-1 mb-6 mx-2 rounded-full ${i < curIdx ? 'bg-[#E85D04]' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
        {/* Step 1: Facility */}
        {step === 'facility' && (
          <motion.div key="facility" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-4">
            <h2 className="text-lg font-bold text-[#123B6D] flex items-center gap-2">
              <MapPin size={20} className="text-[#E85D04]" />
              Choose Healthcare Facility
            </h2>
            {facError && (
              <div className="flex items-center gap-3 bg-red-50 border-2 border-red-300 rounded-xl px-4 py-3.5">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700">{facError}</p>
              </div>
            )}
            {loadingFac ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-[#E85D04] mb-3" size={40} />
                <p className="text-sm text-gray-600">Loading facilities...</p>
              </div>
            ) : facilities.length === 0 ? (
              <p className="text-sm text-center text-gray-600 py-12 bg-gray-50 rounded-xl border-2 border-gray-200">
                No facilities available.
              </p>
            ) : (
              <div className="space-y-3">
                {facilities.map((f, i) => (
                  <motion.button 
                    key={f.id} 
                    onClick={() => { setFacility(f); setStep('doctor') }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 border-gray-200 hover:border-[#E85D04] hover:shadow-lg transition-all flex items-center gap-4 text-left group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#123B6D] to-[#1a5490] flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                      <MapPin size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-base text-[#123B6D] mb-1">{f.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {f.distance}</span>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-semibold border border-green-200">{f.tier}</span>
                        <span className="font-medium">{f.doctors.filter(d => d.available).length} doctors</span>
                      </div>
                    </div>
                    <ChevronRight size={22} className="text-[#E85D04] group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Doctor */}
        {step === 'doctor' && facility && (
          <motion.div key="doctor" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('facility')} className="text-[#FF9933] text-sm hover:underline">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Choose doctor at {facility.name}</h2>
            </div>
            {facility.doctors.filter(d => d.available).length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm text-[#5F5E5A]">No doctors available at this facility today.</p>
                <button onClick={() => setStep('facility')} className="btn-secondary text-sm">Choose another facility</button>
              </div>
            ) : (
              facility.doctors.filter(d => d.available).map(d => (
                <button key={d.id} onClick={() => { setDoctor(d); setStep('slot') }}
                  className="card-hover w-full p-4 flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-full bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={16} className="text-[#FF9933]" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                    <p className="text-xs text-[#5F5E5A]">{d.specialty} · {d.slotsToday} slots today</p>
                  </div>
                  <ChevronRight size={16} className="text-[#5F5E5A]" />
                </button>
              ))
            )}
          </motion.div>
        )}

        {/* Step 3: Time slot */}
        {step === 'slot' && doctor && (
          <motion.div key="slot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('doctor')} className="text-[#FF9933] text-sm hover:underline">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Pick a time — {doctor.name}</h2>
            </div>
            {slots.length === 0 ? (
              <p className="text-sm text-center text-[#5F5E5A] py-6">No slots available today.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map(s => (
                  <button key={s} onClick={() => { setSlot(s); setStep('confirm') }}
                    className={`py-3 rounded-xl border-2 text-sm font-medium transition-all
                      ${slot === s ? 'border-[#FF9933] bg-[#FFF5EB] text-[#E67300]' : 'border-[#D3D1C7] bg-white hover:border-[#FFB366] text-[#2C2C2A]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && facility && doctor && slot && (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('slot')} className="text-[#FF9933] text-sm hover:underline">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Confirm appointment</h2>
            </div>

            {!patientName.trim() && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <AlertCircle size={15} /> Please enter the patient's name above before confirming.
              </div>
            )}

            {bookError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle size={15} /> {bookError}
              </div>
            )}

            <div className="card p-5 space-y-3">
              {[
                { label: 'Patient',   value: patientName || '—' },
                { label: 'Facility',  value: facility.name },
                { label: 'Doctor',    value: `${doctor.name} · ${doctor.specialty}` },
                { label: 'Date',      value: today },
                { label: 'Time',      value: slot },
                { label: 'Type',      value: 'In-person visit' },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#5F5E5A]">{r.label}</span>
                  <span className="font-medium text-[#2C2C2A]">{r.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={confirmBook}
              disabled={booking || !patientName.trim()}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {booking
                ? <><Loader2 size={16} className="animate-spin" /> Booking…</>
                : <><Calendar size={15} /> Confirm & book</>
              }
            </button>
          </motion.div>
        )}
      </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
