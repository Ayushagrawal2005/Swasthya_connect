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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#123B6D]">Appointment Confirmed!</h2>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">Token Number</p>
              <p className="text-3xl font-bold text-[#E85D04] font-mono">{booked.token}</p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p className="flex items-center justify-center gap-2">
                <Calendar size={16} className="text-[#123B6D]" />
                {booked.date} · {booked.time}
              </p>
              <p className="text-green-600 font-semibold">
                Queue position: #{booked.queuePosition} · Est. wait: ~{booked.estimatedWait}m
              </p>
            </div>
          </div>
          <button onClick={() => { setBooked(null); setStep('facility'); setFacility(null); setDoctor(null); setSlot('') }}
            className="w-full bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg transition-all duration-200">
            Book Another Appointment
          </button>
        </div>
      </div>
    )
  }

  const stepLabels: Record<Step, string> = { facility: 'Choose facility', doctor: 'Choose doctor', slot: 'Pick time', confirm: 'Confirm' }
  const steps: Step[] = ['facility', 'doctor', 'slot', 'confirm']
  const curIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-[#123B6D] to-[#1a5490] text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Book Appointment</h1>
              <p className="text-blue-100 mt-1">
                Available slots for today · Choose facility, doctor, and time
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Step indicator */}
      <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
        <div className="flex gap-0">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={`flex flex-col items-center gap-2 flex-shrink-0`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg
                  ${i < curIdx ? 'bg-green-500 text-white' : i === curIdx ? 'bg-[#123B6D] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i < curIdx ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-semibold ${i === curIdx ? 'text-[#123B6D]' : i < curIdx ? 'text-green-600' : 'text-gray-400'}`}>
                  {stepLabels[s]}
                </span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-1 mb-8 mx-2 rounded-full ${i < curIdx ? 'bg-green-500' : i === curIdx ? 'bg-[#123B6D]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Facility */}
        {step === 'facility' && (
          <motion.div key="facility" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
            <h2 className="text-lg font-bold text-[#123B6D]">Select a healthcare facility</h2>
            {loadingFacilities ? (
              <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#123B6D] w-12 h-12" />
              </div>
            ) : (
              facilities.filter(f => f.tier !== 'sub-centre').map(f => (
                <button key={f.id} onClick={() => { setFacility(f); setStep('doctor') }}
                  className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 w-full p-6 flex items-center gap-4 text-left border border-gray-100">
                  <div className="flex-1">
                    <p className="font-bold text-base text-[#123B6D]">{f.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                      <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#E85D04]" /> {f.distance}</span>
                      <span className="flex items-center gap-1.5"><Clock size={14} className="text-green-600" /> {f.doctors.filter(d => d.available).length} doctors available</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-[#123B6D]" />
                </button>
              ))
            )}
          </motion.div>
        )}

        {/* Step 2: Doctor */}
        {step === 'doctor' && facility && (
          <motion.div key="doctor" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('facility')} className="text-[#123B6D] hover:text-[#E85D04] font-semibold text-sm transition-colors">
                ← Back
              </button>
              <h2 className="text-lg font-bold text-[#123B6D]">Select a doctor at {facility.name}</h2>
            </div>
            {facility.doctors.filter(d => d.available).map(d => (
              <button key={d.id} onClick={() => { setDoctor(d); setStep('slot') }}
                className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 w-full p-6 flex items-center gap-4 text-left border border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0 shadow-lg">
                  {d.name.split(' ').slice(-1)[0][0]}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base text-[#123B6D]">{d.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{d.specialty} · <span className="text-green-600 font-semibold">{d.slotsToday} slots available</span></p>
                </div>
                <ChevronRight size={20} className="text-[#123B6D]" />
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 3: Time slot */}
        {step === 'slot' && doctor && (
          <motion.div key="slot" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('doctor')} className="text-[#123B6D] hover:text-[#E85D04] font-semibold text-sm transition-colors">
                ← Back
              </button>
              <h2 className="text-lg font-bold text-[#123B6D]">Pick a time with {doctor.name}</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {slots.length === 0 ? (
                <p className="col-span-full text-center py-12 text-gray-500">No slots available today.</p>
              ) : slots.map(s => (
                <button key={s} onClick={() => { setSlot(s); setStep('confirm') }}
                  className={`py-4 rounded-xl border-2 text-sm font-bold transition-all shadow-md hover:shadow-lg
                    ${slot === s ? 'border-[#123B6D] bg-[#123B6D] text-white' : 'border-gray-200 bg-white hover:border-[#E85D04] text-[#123B6D]'}`}>
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirm */}
        {step === 'confirm' && facility && doctor && slot && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('slot')} className="text-[#123B6D] hover:text-[#E85D04] font-semibold text-sm transition-colors">
                ← Back
              </button>
              <h2 className="text-lg font-bold text-[#123B6D]">Confirm your appointment</h2>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 space-y-4 border border-gray-100">
              {[
                { label: 'Facility', value: facility.name },
                { label: 'Doctor',   value: doctor.name },
                { label: 'Date',     value: today },
                { label: 'Time',     value: slot },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <span className="text-gray-600 font-medium">{row.label}</span>
                  <span className="font-bold text-[#123B6D]">{row.value}</span>
                </div>
              ))}
            </div>
            <button onClick={confirmBook} disabled={booking}
              className="w-full bg-gradient-to-r from-[#E85D04] to-[#d94f03] hover:shadow-xl text-white py-4 rounded-xl font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {booking ? <><Loader2 size={16} className="animate-spin" /> Booking…</> : 'Confirm booking'}
            </button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  )
}
