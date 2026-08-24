// ASHA — Book appointment for a patient (Module 4)
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin, Clock, ChevronRight, CheckCircle, Users, Calendar,
  Stethoscope, ChevronDown,
} from 'lucide-react'
import { facilities, tierLabel, tierColor, type Facility, type Doctor } from '../../data/facilityData'

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00']
type Step = 'facility' | 'doctor' | 'slot' | 'confirm'

export function AshaAppointmentsPage() {
  const [step, setStep]         = useState<Step>('facility')
  const [facility, setFacility] = useState<Facility | null>(null)
  const [doctor, setDoctor]     = useState<Doctor | null>(null)
  const [slot, setSlot]         = useState<string | null>(null)
  const [patient, setPatient]   = useState('Meena Patil')
  const [booked, setBooked]     = useState(false)
  const [queuePos]              = useState(3)

  // Only show PHC and above (sub-centre has no doctor-booking needed)
  const bookableFacilities = facilities.filter(f => f.tier !== 'sub-centre')

  function confirm() { setBooked(true) }

  if (booked && facility && doctor && slot) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto flex flex-col items-center justify-center min-h-[65vh] space-y-5 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[#2C2C2A]">Appointment booked</h2>
          <p className="text-sm text-[#5F5E5A] mt-1">for {patient}</p>
        </div>
        <div className="card p-5 w-full text-left space-y-2">
          {[
            { label: 'Patient',   value: patient },
            { label: 'Facility',  value: facility.name },
            { label: 'Doctor',    value: doctor.name },
            { label: 'Specialty', value: doctor.specialty },
            { label: 'Date',      value: 'Today, 23 Aug 2026' },
            { label: 'Time',      value: slot },
          ].map(r => (
            <div key={r.label} className="flex justify-between text-sm">
              <span className="text-[#5F5E5A]">{r.label}</span>
              <span className="font-medium text-[#2C2C2A]">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="card p-4 w-full flex items-center gap-3 bg-teal-50 border-teal-200">
          <Users size={18} className="text-teal-600 flex-shrink-0" aria-hidden="true" />
          <div className="text-left">
            <p className="text-xs text-[#5F5E5A]">Queue position</p>
            <p className="text-xl font-semibold text-[#2C2C2A] tabular-nums">#{queuePos}</p>
            <p className="text-xs text-[#5F5E5A]">Est. wait ~{queuePos * 8} min</p>
          </div>
        </div>
        <button onClick={() => { setBooked(false); setStep('facility'); setFacility(null); setDoctor(null); setSlot(null) }}
          className="btn-secondary text-sm">Book another appointment</button>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold text-[#2C2C2A]">Book appointment</h1>
        <p className="text-sm text-[#5F5E5A] mt-0.5">Book on behalf of a patient at any tier facility</p>
      </div>

      {/* Patient name */}
      <div>
        <label htmlFor="appt-patient" className="block text-sm font-medium text-[#2C2C2A] mb-1.5">Patient name / ID</label>
        <input id="appt-patient" type="text" value={patient} onChange={e => setPatient(e.target.value)}
          placeholder="e.g. Meena Patil · #P-001" className="input-field text-sm" />
      </div>

      {/* Progress steps */}
      <nav aria-label="Booking steps">
        <ol className="flex items-center gap-0">
          {(['Facility','Doctor','Slot','Confirm'] as const).map((label, i) => {
            const stepOrder: Step[] = ['facility','doctor','slot','confirm']
            const currentIdx = stepOrder.indexOf(step)
            const done = i < currentIdx
            const active = i === currentIdx
            return (
              <li key={label} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all
                    ${done ? 'bg-teal-500 border-teal-500 text-white' : active ? 'border-teal-500 text-teal-600 bg-teal-50' : 'border-[#D3D1C7] text-[#5F5E5A] bg-white'}`}
                    aria-current={active ? 'step' : undefined}>
                    {done ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 font-medium ${active ? 'text-teal-600' : 'text-[#5F5E5A]'}`}>{label}</span>
                </div>
                {i < 3 && <div className={`flex-1 h-0.5 -mt-4 ${done ? 'bg-teal-400' : 'bg-[#D3D1C7]'}`} aria-hidden="true" />}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step 1: Facility */}
      {step === 'facility' && (
        <section aria-labelledby="fac-heading">
          <h2 id="fac-heading" className="section-header">Choose facility</h2>
          <div className="space-y-3">
            {bookableFacilities.map(f => (
              <motion.button key={f.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => { setFacility(f); setDoctor(null); setStep('doctor') }}
                className={`card-hover w-full p-4 text-left flex items-center gap-4 ${facility?.id === f.id ? 'border-teal-500 ring-2 ring-teal-500/20' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-teal-500" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="font-semibold text-sm text-[#2C2C2A]">{f.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${tierColor[f.tier]}`}>{tierLabel[f.tier]}</span>
                  </div>
                  <p className="text-xs text-[#5F5E5A]">{f.distance} · {f.phone}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-teal-600">{f.doctors.filter(d => d.available).length} doctors available</p>
                  <p className="text-[10px] text-[#5F5E5A]">{f.doctors.reduce((s,d) => s + d.slotsToday, 0)} slots today</p>
                </div>
                <ChevronRight size={16} className="text-[#5F5E5A] flex-shrink-0" />
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Step 2: Doctor */}
      {step === 'doctor' && facility && (
        <section aria-labelledby="doc-heading">
          <button onClick={() => setStep('facility')} className="text-sm text-teal-500 mb-3 flex items-center gap-1">← {facility.name}</button>
          <h2 id="doc-heading" className="section-header">Choose doctor</h2>
          <div className="space-y-3">
            {facility.doctors.map(d => (
              <button key={d.id}
                onClick={() => { if (d.available) { setDoctor(d); setStep('slot') } }}
                disabled={!d.available}
                className={`card w-full p-4 text-left flex items-center gap-4 transition-all
                  ${d.available ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                  ${doctor?.id === d.id ? 'border-teal-500 ring-2 ring-teal-500/20' : ''}`}
                aria-disabled={!d.available}>
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-sm font-semibold text-indigo-600 flex-shrink-0">
                  {d.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#2C2C2A]">{d.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-[#5F5E5A]">
                      <Stethoscope size={11} aria-hidden="true" /> {d.specialty}
                    </span>
                    <span className="text-[10px] text-[#5F5E5A]">· {d.slotsToday} slots</span>
                  </div>
                </div>
                <span className={d.available ? 'badge-green text-[10px]' : 'badge-amber text-[10px]'}>
                  {d.available ? 'Available' : 'Unavailable'}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step 3: Slot */}
      {step === 'slot' && doctor && (
        <section aria-labelledby="slot-heading">
          <button onClick={() => setStep('doctor')} className="text-sm text-teal-500 mb-3 flex items-center gap-1">← {doctor.name}</button>
          <h2 id="slot-heading" className="section-header flex items-center gap-2">
            <Calendar size={16} className="text-teal-500" /> Available slots — Today
          </h2>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Time slots">
            {timeSlots.map(t => (
              <button key={t} onClick={() => { setSlot(t); setStep('confirm') }}
                aria-pressed={slot === t}
                className={`py-2.5 text-sm font-medium rounded-btn border-2 transition-all
                  ${slot === t ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-[#2C2C2A] border-[#D3D1C7] hover:border-teal-300'}`}>
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
              { label: 'Patient',   value: patient },
              { label: 'Facility',  value: facility.name },
              { label: 'Doctor',    value: doctor.name },
              { label: 'Specialty', value: doctor.specialty },
              { label: 'Date',      value: 'Today, 23 Aug 2026' },
              { label: 'Time',      value: slot },
              { label: 'Est. wait', value: `~${queuePos * 8} min` },
            ].map(r => (
              <div key={r.label} className="flex justify-between text-sm">
                <span className="text-[#5F5E5A]">{r.label}</span>
                <span className="font-medium text-[#2C2C2A]">{r.value}</span>
              </div>
            ))}
          </div>
          <button onClick={confirm} className="btn-primary w-full justify-center py-3.5">
            Confirm appointment
          </button>
        </section>
      )}
    </div>
  )
}
