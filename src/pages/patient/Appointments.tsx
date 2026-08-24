import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, Calendar, ChevronRight, CheckCircle, Loader2 } from 'lucide-react'
import { appointmentsApi, type FacilityWithDoctors, type Doctor, type Appointment } from '../../services/api'
import { useApp } from '../../context/AppContext'

type Step = 'facility' | 'doctor' | 'slot' | 'confirm'

export function AppointmentsPage() {
  const { patientId, userName } = useApp()
  const [step, setStep] = useState<Step>('facility')
  const [facilities, setFacilities] = useState<FacilityWithDoctors[]>([])
  const [loadingFacilities, setLoadingFacilities] = useState(true)
  const [facility, setFacility] = useState<FacilityWithDoctors | null>(null)
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [slot, setSlot] = useState('')
  const [booked, setBooked] = useState<Appointment | null>(null)
  const [booking, setBooking] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    appointmentsApi.facilities()
      .then(setFacilities)
      .catch(() => {})
      .finally(() => setLoadingFacilities(false))
  }, [])

  useEffect(() => {
    if (facility) {
      appointmentsApi.slots(facility.id, today)
        .then(res => setSlots(res.slots))
        .catch(() => setSlots([]))
    }
  }, [facility, today])

  function confirmBook() {
    if (!facility || !doctor || !slot) return
    setBooking(true)
    appointmentsApi.book({
      patientName: userName || 'Patient',
      patientId: patientId || undefined,
      facilityId: facility.id,
      doctorId: doctor.id,
      date: today,
      time: slot,
      type: 'in-person',
    })
      .then(appt => setBooked(appt))
      .catch(() => {})
      .finally(() => setBooking(false))
  }

  if (booked) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[65vh] space-y-5 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A]">Appointment booked</h2>
          <p className="text-sm text-[#5F5E5A] mt-1">Token: <span className="font-mono font-bold">{booked.token}</span></p>
          <p className="text-sm text-[#5F5E5A]">{booked.date} · {booked.time}</p>
          <p className="text-sm text-teal-600 mt-1">Queue position: #{booked.queuePosition} · Est. wait: ~{booked.estimatedWait}m</p>
        </div>
        <button onClick={() => { setBooked(null); setStep('facility'); setFacility(null); setDoctor(null); setSlot('') }}
          className="btn-secondary text-sm py-2.5 px-6">Book another</button>
      </div>
    )
  }

  const stepLabels: Record<Step, string> = { facility: 'Choose facility', doctor: 'Choose doctor', slot: 'Pick time', confirm: 'Confirm' }
  const steps: Step[] = ['facility', 'doctor', 'slot', 'confirm']
  const curIdx = steps.indexOf(step)

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Book Appointment</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Available slots for today</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`flex flex-col items-center gap-1 flex-shrink-0`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${i < curIdx ? 'bg-teal-500 text-white' : i === curIdx ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < curIdx ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${i === curIdx ? 'text-teal-600' : 'text-[#9E9C94]'}`}>{stepLabels[s].split(' ')[0]}</span>
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 mb-4 mx-1 ${i < curIdx ? 'bg-teal-400' : 'bg-[#D3D1C7]'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Facility */}
        {step === 'facility' && (
          <motion.div key="facility" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
            <h2 className="text-sm font-semibold text-[#2C2C2A]">Select a facility</h2>
            {loadingFacilities ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-teal-400" /></div> : (
              facilities.filter(f => f.tier !== 'sub-centre').map(f => (
                <button key={f.id} onClick={() => { setFacility(f); setStep('doctor') }}
                  className="card-hover w-full p-4 flex items-center gap-4 text-left">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{f.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#5F5E5A]">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {f.distance}</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {f.doctors.filter(d => d.available).length} doctors available</span>
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
          <motion.div key="doctor" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('facility')} className="text-teal-600 text-sm">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Select a doctor at {facility.name}</h2>
            </div>
            {facility.doctors.filter(d => d.available).map(d => (
              <button key={d.id} onClick={() => { setDoctor(d); setStep('slot') }}
                className="card-hover w-full p-4 flex items-center gap-4 text-left">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-600 flex-shrink-0">
                  {d.name.split(' ').slice(-1)[0][0]}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                  <p className="text-xs text-[#5F5E5A] mt-0.5">{d.specialty} · {d.slotsToday} slots today</p>
                </div>
                <ChevronRight size={16} className="text-[#5F5E5A]" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 3: Time slot */}
        {step === 'slot' && doctor && (
          <motion.div key="slot" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('doctor')} className="text-teal-600 text-sm">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Pick a time with {doctor.name}</h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {slots.length === 0 ? (
                <p className="col-span-3 text-sm text-[#5F5E5A] text-center py-4">No slots available today.</p>
              ) : slots.map(s => (
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
          <motion.div key="confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('slot')} className="text-teal-600 text-sm">← Back</button>
              <h2 className="text-sm font-semibold text-[#2C2C2A]">Confirm appointment</h2>
            </div>
            <div className="card p-5 space-y-3">
              {[
                { label: 'Facility', value: facility.name },
                { label: 'Doctor',   value: doctor.name },
                { label: 'Date',     value: today },
                { label: 'Time',     value: slot },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-[#5F5E5A]">{row.label}</span>
                  <span className="font-medium text-[#2C2C2A]">{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={confirmBook} disabled={booking}
              className="btn-primary w-full justify-center py-3 text-sm">
              {booking ? <><Loader2 size={16} className="animate-spin" /> Booking…</> : 'Confirm booking'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
