// Module 4 — Appointment & Queue Management (patient side)
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin, Clock, Users, Calendar, ChevronRight, CheckCircle, Search,
} from 'lucide-react'

const facilities = [
  { id: 'f1', name: 'PHC Beed', type: 'PHC', distance: '2.4 km', wait: '~12 min', slots: 6 },
  { id: 'f2', name: 'Sub-centre Mandav', type: 'Sub-centre', distance: '0.8 km', wait: '~5 min', slots: 3 },
  { id: 'f3', name: 'Rural Hospital Beed', type: 'Rural Hospital', distance: '8.1 km', wait: '~30 min', slots: 12 },
]

const doctors: Record<string, { id: string; name: string; specialty: string; available: boolean }[]> = {
  f1: [
    { id: 'd1', name: 'Dr. Ramesh Patil', specialty: 'General Medicine', available: true },
    { id: 'd2', name: 'Dr. Sneha More', specialty: 'OB/GYN', available: true },
    { id: 'd3', name: 'Dr. Arun Wagh', specialty: 'Paediatrics', available: false },
  ],
  f2: [
    { id: 'd4', name: 'ASHA Kavita Shinde', specialty: 'Community Health', available: true },
  ],
  f3: [
    { id: 'd5', name: 'Dr. Priya Desai', specialty: 'General Medicine', available: true },
    { id: 'd6', name: 'Dr. Suresh Kale', specialty: 'Surgery', available: true },
  ],
}

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00']

type Step = 'facility' | 'doctor' | 'slot' | 'confirm'

export function AppointmentsPage() {
  const [step, setStep] = useState<Step>('facility')
  const [facility, setFacility] = useState<typeof facilities[0] | null>(null)
  const [doctor, setDoctor] = useState<{ id: string; name: string; specialty: string } | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [booked, setBooked] = useState(false)
  const [queuePos] = useState(4)

  const steps: Step[] = ['facility', 'doctor', 'slot', 'confirm']
  const stepIdx = steps.indexOf(step)

  function confirmBooking() {
    setBooked(true)
  }

  if (booked) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-[#2C2C2A] mb-2">Appointment booked!</h2>
        <p className="text-[#5F5E5A] text-sm mb-1">{doctor?.name} · {facility?.name}</p>
        <p className="text-teal-600 font-medium text-sm mb-1">Today, {slot}</p>
        <div className="mt-4 card p-4 w-full flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Users size={18} className="text-teal-600" />
          </div>
          <div className="text-left">
            <p className="text-xs text-[#5F5E5A]">Your position in queue</p>
            <p className="text-2xl font-semibold text-[#2C2C2A] tabular-nums">#{queuePos}</p>
            <p className="text-xs text-[#5F5E5A]">Est. wait: ~{queuePos * 8} min</p>
          </div>
        </div>
        <button onClick={() => { setBooked(false); setStep('facility'); setFacility(null); setDoctor(null); setSlot(null) }}
          className="btn-secondary mt-5 text-sm">
          Book another
        </button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <h1 className="text-xl font-semibold text-[#2C2C2A]">Book appointment</h1>

      {/* Step progress */}
      <nav aria-label="Booking steps">
        <ol className="flex items-center gap-0">
          {['Facility', 'Doctor', 'Slot', 'Confirm'].map((label, i) => (
            <li key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all
                  ${i < stepIdx ? 'bg-teal-500 border-teal-500 text-white' : i === stepIdx ? 'border-teal-500 text-teal-600 bg-teal-50' : 'border-[#D3D1C7] text-[#5F5E5A] bg-white'}`}
                  aria-current={i === stepIdx ? 'step' : undefined}
                >
                  {i < stepIdx ? <CheckCircle size={14} /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 font-medium ${i === stepIdx ? 'text-teal-600' : 'text-[#5F5E5A]'}`}>{label}</span>
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 -mt-4 ${i < stepIdx ? 'bg-teal-400' : 'bg-[#D3D1C7]'}`} aria-hidden="true" />}
            </li>
          ))}
        </ol>
      </nav>

      {/* Step 1: Facility */}
      {step === 'facility' && (
        <section aria-labelledby="facility-heading">
          <h2 id="facility-heading" className="section-header">Choose facility</h2>
          <div className="space-y-3">
            {facilities.map(f => (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => { setFacility(f); setStep('doctor') }}
                className={`card-hover w-full p-4 text-left flex items-center gap-4
                  ${facility?.id === f.id ? 'border-teal-500 ring-2 ring-teal-500/20' : ''}`}
              >
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{f.name}</p>
                  <p className="text-xs text-[#5F5E5A]">{f.type} · {f.distance}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-teal-600 font-medium flex items-center gap-1"><Clock size={11} />{f.wait}</p>
                  <p className="text-[10px] text-[#5F5E5A]">{f.slots} slots left</p>
                </div>
                <ChevronRight size={16} className="text-[#5F5E5A] flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2: Doctor */}
      {step === 'doctor' && facility && (
        <section aria-labelledby="doctor-heading">
          <button onClick={() => setStep('facility')} className="text-sm text-teal-500 mb-3 flex items-center gap-1">← {facility.name}</button>
          <h2 id="doctor-heading" className="section-header">Choose doctor</h2>
          <div className="space-y-3">
            {(doctors[facility.id] || []).map(d => (
              <button
                key={d.id}
                onClick={() => { if (d.available) { setDoctor(d); setStep('slot') } }}
                disabled={!d.available}
                className={`card w-full p-4 text-left flex items-center gap-4 transition-all
                  ${d.available ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                  ${doctor?.id === d.id ? 'border-teal-500 ring-2 ring-teal-500/20' : ''}`}
                aria-disabled={!d.available}
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-semibold text-indigo-600 flex-shrink-0">
                  {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                  <p className="text-xs text-[#5F5E5A]">{d.specialty}</p>
                </div>
                <span className={d.available ? 'badge-green text-[10px]' : 'badge-amber text-[10px]'}>
                  {d.available ? 'Available' : 'Unavailable'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Time slot */}
      {step === 'slot' && doctor && (
        <section aria-labelledby="slot-heading">
          <button onClick={() => setStep('doctor')} className="text-sm text-teal-500 mb-3 flex items-center gap-1">← {doctor.name}</button>
          <h2 id="slot-heading" className="section-header flex items-center gap-2">
            <Calendar size={16} className="text-teal-500" /> Available slots — Today
          </h2>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Time slot selection">
            {timeSlots.map(t => (
              <button
                key={t}
                onClick={() => { setSlot(t); setStep('confirm') }}
                className={`py-2.5 text-sm font-medium rounded-btn border-2 transition-all
                  ${slot === t ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#2C2C2A] border-[#D3D1C7] hover:border-teal-300'}`}
                aria-pressed={slot === t}
              >
                {t}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 4: Confirm */}
      {step === 'confirm' && facility && doctor && slot && (
        <section aria-labelledby="confirm-heading">
          <button onClick={() => setStep('slot')} className="text-sm text-teal-500 mb-3 flex items-center gap-1">← Change slot</button>
          <h2 id="confirm-heading" className="section-header">Confirm booking</h2>
          <div className="card p-5 space-y-3 mb-5">
            {[
              { label: 'Facility', value: facility.name },
              { label: 'Doctor', value: doctor.name },
              { label: 'Specialty', value: doctor.specialty },
              { label: 'Date & Time', value: `Today, ${slot}` },
              { label: 'Est. wait', value: facility.wait },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-[#5F5E5A]">{row.label}</span>
                <span className="font-medium text-[#2C2C2A]">{row.value}</span>
              </div>
            ))}
          </div>
          <button onClick={confirmBooking} className="btn-primary w-full justify-center">
            Confirm appointment
          </button>
        </section>
      )}
    </div>
  )
}
