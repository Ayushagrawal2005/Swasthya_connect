import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MapPin, Activity, Users, ArrowRight, Star, Shield,
  Smartphone, Wifi, CheckCircle, ChevronDown, Heart,
  Stethoscope, Building2, Network
} from 'lucide-react'
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from 'recharts'
import { useApp } from '../context/AppContext'

const impactData = [
  { month: 'Jan', patients: 1200 }, { month: 'Feb', patients: 1800 },
  { month: 'Mar', patients: 2400 }, { month: 'Apr', patients: 3100 },
  { month: 'May', patients: 3800 }, { month: 'Jun', patients: 4600 },
  { month: 'Jul', patients: 5500 }, { month: 'Aug', patients: 6800 },
]

const stats = [
  { value: '2.4M+', label: 'Patients Served', icon: <Users size={20} /> },
  { value: '18,000+', label: 'Health Facilities', icon: <Building2 size={20} /> },
  { value: '94%', label: 'Referral Success Rate', icon: <CheckCircle size={20} /> },
  { value: '< 4min', label: 'Avg Triage Time', icon: <Activity size={20} /> },
]

const steps = [
  {
    icon: <Smartphone size={28} className="text-teal-500" />,
    title: 'Triage from anywhere',
    desc: 'ASHA workers and patients describe symptoms in any language. AI provides an instant risk assessment with clear next steps.',
  },
  {
    icon: <Network size={28} className="text-indigo-500" />,
    title: 'Seamless referrals',
    desc: 'If higher care is needed, records flow instantly to the next facility — no paper, no repeated history, no delays.',
  },
  {
    icon: <Heart size={28} className="text-coral-500" />,
    title: 'Continuity of care',
    desc: 'Every visit, prescription, and lab result is stored and accessible across the entire care network, for life.',
  },
]

const testimonials = [
  {
    quote: "Earlier I had to carry papers everywhere. Now everything is on my phone. My mother's diabetes records are always with me.",
    name: 'Sunita Devi',
    role: 'Patient, Nashik District',
    avatar: 'SD',
  },
  {
    quote: "I visit 40 families weekly. SwasthyaConnect helps me record symptoms and refer cases before they become emergencies.",
    name: 'Kavita Shinde',
    role: 'ASHA Worker, Aurangabad',
    avatar: 'KS',
  },
  {
    quote: "Referral patients now arrive with complete clinical history. It's cut my consultation time by half.",
    name: 'Dr. Ramesh Patil',
    role: 'Medical Officer, PHC Beed',
    avatar: 'RP',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  }),
}

export function LandingPage() {
  const navigate = useNavigate()
  const { setRole } = useApp()

  // Clear role when landing on this page to hide sidebar
  useEffect(() => {
    setRole(null)
  }, [setRole])

  return (
    <div className="min-h-screen">
      {/* ─── Hero ─── */}
      <section className="hero-mesh relative overflow-hidden" aria-label="Hero">
        {/* Decorative blobs */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl -z-0 animate-float" aria-hidden="true" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-indigo-500/8 rounded-full blur-3xl -z-0" aria-hidden="true" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <motion.div
              initial="hidden" animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.div variants={fadeUp} custom={0}>
                <span className="badge-teal mb-5 inline-flex">
                  <Shield size={11} />
                  ABDM-connected · Open-source · WCAG AA
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp} custom={1}
                className="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold leading-[1.15] tracking-tight text-[#2C2C2A] mb-6"
              >
                Healthcare that{' '}
                <span className="text-teal-500">follows you</span>,<br />
                not the other way around
              </motion.h1>

              <motion.p
                variants={fadeUp} custom={2}
                className="text-[#5F5E5A] text-lg leading-relaxed mb-8 max-w-lg"
              >
                Connecting patients, ASHA workers, doctors, and facilities across India's rural health network — from sub-centre to district hospital, in one seamless platform.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
                <button onClick={() => navigate('/login')} className="btn-primary text-base px-7 py-3.5 gap-2">
                  Get Started
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
                <button onClick={() => navigate('/login')} className="btn-secondary text-base px-7 py-3.5">
                  For Health Workers
                </button>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-8 flex items-center gap-4 text-sm text-[#5F5E5A]">
                <div className="flex -space-x-2">
                  {['SD', 'KS', 'RP', 'MK'].map(init => (
                    <div key={init} className="w-8 h-8 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-teal-700" aria-hidden="true">
                      {init}
                    </div>
                  ))}
                </div>
                <span>Trusted by <strong className="text-[#2C2C2A]">2.4M+ patients</strong> across 18 states</span>
              </motion.div>
            </motion.div>

            {/* Right: Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              {/* 3D-style illustrated care journey */}
              <div className="relative bg-white rounded-[24px] shadow-modal border border-[#D3D1C7] p-6 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-[#5F5E5A]">Care Journey</p>
                    <p className="text-sm font-semibold text-[#2C2C2A]">Priya Sharma · Patient #24819</p>
                  </div>
                  <span className="badge-green">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 status-dot-live" aria-hidden="true" />
                    Active
                  </span>
                </div>

                {/* Journey nodes */}
                <div className="flex items-center justify-between relative">
                  <div className="absolute inset-y-1/2 left-8 right-8 h-0.5 bg-gradient-to-r from-teal-300 via-indigo-300 to-coral-200" aria-hidden="true" />

                  {[
                    { label: 'Sub-centre', icon: <MapPin size={18} />, color: 'bg-teal-500', done: true },
                    { label: 'PHC', icon: <Activity size={18} />, color: 'bg-teal-500', done: true },
                    { label: 'Rural Hospital', icon: <Building2 size={18} />, color: 'bg-indigo-500', done: false },
                    { label: 'District', icon: <Stethoscope size={18} />, color: 'bg-coral-500', done: false },
                  ].map((node, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${node.done ? node.color : 'bg-gray-200'} transition-all`} aria-label={node.label}>
                        {node.icon}
                      </div>
                      <span className="text-[10px] font-medium text-[#5F5E5A] text-center leading-tight max-w-[52px]">{node.label}</span>
                    </div>
                  ))}
                </div>

                {/* Record card */}
                <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-teal-50 to-indigo-50 border border-teal-100">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCard />
                    <span className="text-xs font-semibold text-teal-700">Health Record synced</span>
                    <span className="ml-auto text-[10px] text-[#5F5E5A]">Just now</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="font-semibold text-[#2C2C2A] tabular-nums">BP 120/80</p>
                      <p className="text-[#5F5E5A]">Normal</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="font-semibold text-[#2C2C2A] tabular-nums">Hb 11.2</p>
                      <p className="text-amber-600">Low</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <p className="font-semibold text-[#2C2C2A] tabular-nums">28W</p>
                      <p className="text-[#5F5E5A]">Pregnant</p>
                    </div>
                  </div>
                </div>

                {/* Pulse data */}
                <div className="mt-4 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={impactData.slice(0, 6)}>
                      <defs>
                        <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0F6E56" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#0F6E56" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="patients" stroke="#0F6E56" strokeWidth={2} fill="url(#tealGrad)" dot={false} />
                      <Tooltip
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #D3D1C7' }}
                        formatter={(v) => [v, 'Patients']}
                        labelFormatter={() => ''}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 badge-teal shadow-card text-xs px-3 py-1.5">
                <Wifi size={11} /> Synced across 18 states
              </div>
              <div className="absolute -bottom-3 -left-3 badge-green shadow-card text-xs px-3 py-1.5">
                <Shield size={11} /> ABDM Compliant
              </div>
            </motion.div>
          </div>

          {/* Scroll hint */}
          <div className="flex justify-center mt-12">
            <a href="#how-it-works" className="flex flex-col items-center gap-1 text-xs text-[#5F5E5A] hover:text-teal-500 transition-colors" aria-label="Scroll to how it works">
              <span>Learn more</span>
              <ChevronDown size={18} className="animate-bounce" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="bg-teal-500 py-12" aria-label="Impact statistics">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <dt className="flex items-center justify-center gap-2 text-teal-100 text-sm mb-1">
                  <span aria-hidden="true">{stat.icon}</span>
                  {stat.label}
                </dt>
                <dd className="text-3xl font-semibold text-white tabular-nums">{stat.value}</dd>
              </motion.div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="py-20 bg-[#FAFAF7]" aria-labelledby="how-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="badge-teal mb-4 inline-flex">How it works</span>
            <h2 id="how-heading" className="text-3xl font-semibold text-[#2C2C2A] mb-4">
              Three steps to better healthcare
            </h2>
            <p className="text-[#5F5E5A] text-lg leading-relaxed">
              Whether you're a patient, ASHA worker, or doctor — SwasthyaConnect connects every step of your health journey.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                variants={fadeUp} custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="card p-7"
              >
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-5">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-[#2C2C2A] mb-2">{step.title}</h3>
                <p className="text-[#5F5E5A] leading-relaxed text-sm">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 bg-white" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 id="testimonials-heading" className="text-3xl font-semibold text-[#2C2C2A]">
              Voices from the field
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.figure
                key={t.name}
                variants={fadeUp} custom={i}
                initial="hidden" whileInView="show"
                viewport={{ once: true }}
                className="card p-6"
              >
                <div className="flex mb-3" aria-label="5 out of 5 stars">
                  {Array(5).fill(0).map((_, j) => (
                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-[#5F5E5A] text-sm leading-relaxed mb-4">
                  "{t.quote}"
                </blockquote>
                <figcaption className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-sm font-semibold text-teal-700" aria-hidden="true">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2A]">{t.name}</p>
                    <p className="text-xs text-[#5F5E5A]">{t.role}</p>
                  </div>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-gradient-to-br from-teal-500 to-teal-600" aria-label="Call to action">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl font-semibold text-white mb-4">
              Ready to transform rural healthcare?
            </h2>
            <p className="text-teal-100 text-lg mb-8">
              Join 2.4 million patients, 18,000+ facilities, and thousands of health workers already on SwasthyaConnect.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => navigate('/login')} className="bg-white text-teal-600 hover:bg-teal-50 px-8 py-3.5 rounded-btn font-semibold transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-white">
                Get started free
              </button>
              <button className="border-2 border-white/50 text-white px-8 py-3.5 rounded-btn font-medium hover:bg-white/10 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-white">
                View documentation
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#2C2C2A] text-[#D3D1C7] py-12" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Heart size={18} className="text-teal-300" aria-hidden="true" />
              <span className="font-semibold text-white">SwasthyaConnect</span>
              <span className="text-sm ml-2 text-[#5F5E5A]">An Integrated Care-Access Platform</span>
            </div>
            <p className="text-xs text-center">
              Built under National Digital Health Mission · Ayushman Bharat · NHA India<br />
              ABDM-compliant · HIPAA-aligned data practices · Open source
            </p>
            <p className="text-xs">© 2026 MoHFW, Government of India</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FileCard() {
  return (
    <div className="w-6 h-7 bg-teal-500 rounded flex items-center justify-center" aria-hidden="true">
      <div className="space-y-0.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-3 h-0.5 bg-white/80 rounded-full" />
        ))}
      </div>
    </div>
  )
}
