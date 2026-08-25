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
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[65vh] space-y-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A]">Appointment booked!</h2>
          <p className="text-sm text-[#5F5E5A] mt-1">{patientName} · {facility.name}</p>
          <p className="text-sm text-[#5F5E5A]">{doctor.name} · {booked.time}</p>
          <p className="text-sm font-semibold text-[#FF9933] mt-2">Token {booked.token} · Queue #{booked.queuePosition}</p>
          <p className="text-xs text-[#5F5E5A] mt-1">Est. wait: ~{booked.estimatedWait} min</p>
        </div>
        <button onClick={() => {
          setBooked(null); setStep('facility'); setFacility(null)
          setDoctor(null); setSlot(''); setPatientName(''); setPatientId(undefined); setBookError('')
        }} className="btn-secondary text-sm py-2.5 px-8">Book another</button>
      </div>
    )
  }

  const steps: Step[] = ['facility', 'doctor', 'slot', 'confirm']
  const stepLabels: Record<Step, string> = { facility: 'Facility', doctor: 'Doctor', slot: 'Time', confirm: 'Confirm' }
  const curIdx = steps.indexOf(step)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Book appointment</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">For your patient — {today}</p>
      </div>

      {/* Patient name input with search */}
      <div className="relative">
        <label htmlFor="appt-patient" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">
          Patient name <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {searching ? <Loader2 size={16} className="animate-spin text-[#FF9933]" /> : <Search size={16} className="text-[#9E9C94]" />}
          </div>
          <input
            id="appt-patient"
            type="text"
            value={patientName}
            onChange={e => { setPatientName(e.target.value); setPatientId(undefined); setShowSearch(true) }}
            onFocus={() => setShowSearch(true)}
            placeholder="Type to search or enter patient name"
            className="input-field pl-9"
            autoComplete="off"
          />
        </div>
        {patientId && (
          <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
            <User size={11} /> Linked to existing patient record
          </p>
        )}

        {/* Dropdown search results */}
        <AnimatePresence>
          {showSearch && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-[#D3D1C7] rounded-xl shadow-lg overflow-hidden"
            >
              {searchResults.map(p => (
                <button key={p.id} onMouseDown={() => selectPatient(p)}
                  className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center gap-3 border-b border-[#F0EDE6] last:border-0">
                  <div className="w-8 h-8 rounded-full bg-[#FFF5EB] flex items-center justify-center flex-shrink-0">
                    <User size={14} className="text-[#FF9933]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C2C2A]">{p.name}</p>
                    <p className="text-xs text-[#5F5E5A]">{p.age}y · {p.village} · {p.healthId}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Step indicators */}
      <div className="flex gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${i <= curIdx ? 'bg-[#FF9933] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < curIdx ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${i === curIdx ? 'text-[#FF9933]' : 'text-[#9E9C94]'}`}>{stepLabels[s]}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < curIdx ? 'bg-[#FFB366]' : 'bg-[#D3D1C7]'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Facility */}
        {step === 'facility' && (
          <motion.div key="facility" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-[#2C2C2A]">Choose facility</h2>
            {facError && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle size={15} /> {facError}
              </div>
            )}
            {loadingFac ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#FF9933]" size={28} /></div>
            ) : facilities.length === 0 ? (
              <p className="text-sm text-center text-[#5F5E5A] py-8">No facilities available.</p>
            ) : (
              facilities.map(f => (
                <button key={f.id} onClick={() => { setFacility(f); setStep('doctor') }}
                  className="card-hover w-full p-4 flex items-center gap-4 text-left">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{f.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#5F5E5A]">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {f.distance}</span>
                      <span className="badge-green text-[9px]">{f.tier}</span>
                      <span>{f.doctors.filter(d => d.available).length} doctors available</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-[#5F5E5A]" />
                </button>
              ))
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
    </div>
  )
}
