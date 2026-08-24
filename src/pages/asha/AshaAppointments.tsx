import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, ChevronRight, CheckCircle, Calendar, Stethoscope, Loader2 } from 'lucide-react'
import { appointmentsApi, type FacilityWithDoctors, type Doctor, type Appointment } from '../../services/api'
import { useApp } from '../../context/AppContext'

type Step = 'facility' | 'doctor' | 'slot' | 'confirm'

export function AshaAppointmentsPage() {
  const { userName } = useApp()
  const [step, setStep]         = useState<Step>('facility')
  const [facilities, setFacilities] = useState<FacilityWithDoctors[]>([])
  const [loadingFac, setLoadingFac] = useState(true)
  const [slots, setSlots]       = useState<string[]>([])
  const [facility, setFacility] = useState<FacilityWithDoctors | null>(null)
  const [doctor, setDoctor]     = useState<Doctor | null>(null)
  const [slot, setSlot]         = useState('')
  const [patient, setPatient]   = useState('Meena Patil')
  const [booked, setBooked]     = useState<Appointment | null>(null)
  const [booking, setBooking]   = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    appointmentsApi.facilities()
      .then(data => setFacilities(data.filter(f => f.tier !== 'sub-centre')))
      .catch(() => {})
      .finally(() => setLoadingFac(false))
  }, [])

  useEffect(() => {
    if (facility) {
      appointmentsApi.slots(facility.id, today).then(r => setSlots(r.slots)).catch(() => setSlots([]))
    }
  }, [facility, today])

  function confirmBook() {
    if (!facility || !doctor || !slot) return
    setBooking(true)
    appointmentsApi.book({ patientName: patient, facilityId: facility.id, doctorId: doctor.id, date: today, time: slot, type: 'in-person' })
      .then(appt => setBooked(appt))
      .catch(() => {})
      .finally(() => setBooking(false))
  }

  if (booked && facility && doctor) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[65vh] space-y-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A]">Appointment booked!</h2>
          <p className="text-sm text-[#5F5E5A] mt-1">{patient} · {facility.name}</p>
          <p className="text-sm text-[#5F5E5A]">{doctor.name} · {booked.time}</p>
          <p className="text-sm font-semibold text-teal-600 mt-2">Token {booked.token} · Queue #{booked.queuePosition}</p>
          <p className="text-xs text-[#5F5E5A] mt-1">Est. wait: ~{booked.estimatedWait} min</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { setBooked(null); setStep('facility'); setFacility(null); setDoctor(null); setSlot('') }}
            className="btn-secondary text-sm py-2.5 px-5">Book another</button>
        </div>
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

      {/* Patient name input */}
      <div>
        <label htmlFor="appt-patient" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Patient name</label>
        <input id="appt-patient" type="text" value={patient} onChange={e => setPatient(e.target.value)}
          placeholder="e.g. Meena Patil" className="input-field" />
      </div>

      {/* Step indicators */}
      <div className="flex gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i <= curIdx ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < curIdx ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${i === curIdx ? 'text-teal-600' : 'text-[#9E9C94]'}`}>{stepLabels[s]}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < curIdx ? 'bg-teal-400' : 'bg-[#D3D1C7]'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Facility */}
        {step === 'facility' && (
          <motion.div key="facility" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-[#2C2C2A]">Choose facility</h2>
            {loadingFac ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-teal-400" /></div> : (
              facilities.map(f => (
                <button key={f.id} onClick={() => { setFacility(f); setStep('doctor') }}
                  className="card-hover w-full p-4 flex items-center gap-4 text-left">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{f.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#5F5E5A]">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {f.distance}</span>
                      <span className="badge-teal text-[9px]">{f.tier}</span>
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
              <button onClick={() => setStep('facility')} className="text-teal-600 text-sm">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Choose doctor</h2>
            </div>
            {facility.doctors.filter(d => d.available).map(d => (
              <button key={d.id} onClick={() => { setDoctor(d); setStep('slot') }}
                className="card-hover w-full p-4 flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700 flex-shrink-0">
                  <Stethoscope size={16} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                  <p className="text-xs text-[#5F5E5A]">{d.specialty} · {d.slotsToday} slots</p>
                </div>
                <ChevronRight size={16} className="text-[#5F5E5A]" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 3: Time slot */}
        {step === 'slot' && doctor && (
          <motion.div key="slot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('doctor')} className="text-teal-600 text-sm">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Pick a time — {doctor.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {slots.length === 0
                ? <p className="col-span-3 text-sm text-center text-[#5F5E5A] py-4">No slots available today.</p>
                : slots.map(s => (
                <button key={s} onClick={() => { setSlot(s); setStep('confirm') }}
                  className={`py-3 rounded-xl border-2 text-sm font-medium transition-all
                    ${slot === s ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-[#D3D1C7] bg-white hover:border-teal-300 text-[#2C2C2A]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && facility && doctor && slot && (
          <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('slot')} className="text-teal-600 text-sm">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Confirm appointment</h2>
            </div>
            <div className="card p-5 space-y-3">
              {[
                { label: 'Patient',  value: patient },
                { label: 'Facility', value: facility.name },
                { label: 'Doctor',   value: `${doctor.name} · ${doctor.specialty}` },
                { label: 'Date',     value: today },
                { label: 'Time',     value: slot },
              ].map(r => (
                <div key={r.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#5F5E5A]">{r.label}</span>
                  <span className="font-medium text-[#2C2C2A]">{r.value}</span>
                </div>
              ))}
            </div>
            <button onClick={confirmBook} disabled={booking}
              className="btn-primary w-full justify-center py-3 text-sm">
              {booking ? <><Loader2 size={16} className="animate-spin" /> Booking…</> : <><Calendar size={15} /> Confirm & book</>}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
