/**
 * SwasthyaConnect Landing Page
 * Government Healthcare Portal Design
 * Integrated Rural Healthcare Platform
 */

import { useNavigate } from 'react-router-dom'
import { 
  Search, ChevronRight, Users, Building2, Stethoscope, 
  Activity, Phone, MapPin, Calendar, FileText, 
  Shield, Clock, Award, TrendingUp, Home, Briefcase,
  Heart, Share2, CheckCircle, AlertTriangle, Zap
} from 'lucide-react'
import ImagePlaceholder from '../components/ui/ImagePlaceholder'

export function LandingNew() {
  const navigate = useNavigate()
  
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Government Top Banner */}
      <div className="gov-banner">
        <div className="container-custom flex items-center justify-between text-xs">
          <span>Government of India</span>
          <span className="hidden sm:block">Ministry of Health & Family Welfare</span>
          <div className="flex items-center gap-4">
            <button className="hover:underline">Skip to main content</button>
            <button className="hover:underline">Screen Reader Access</button>
            <select className="bg-transparent border-none text-xs">
              <option>A-</option>
              <option>A</option>
              <option selected>A+</option>
            </select>
            <select className="bg-transparent border-none text-xs">
              <option selected>English</option>
              <option>हिन्दी</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Header with Logo & Search */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
                <Heart className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Swasthya Connect</h1>
                <p className="text-xs text-gray-600">Integrated Rural Healthcare Platform</p>
              </div>
            </div>
            
            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-2xl">
              <div className="search-bar w-full">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search services, health information, facilities..."
                  className="flex-1 outline-none bg-transparent"
                />
                <button className="btn-primary px-4 py-2 text-sm">
                  <Search size={16} />
                  Search
                </button>
              </div>
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-3">
              <button className="hidden lg:flex items-center gap-2 text-sm text-gray-700 hover:text-primary-600">
                <span className="font-medium">Digital India</span>
                <span className="text-xs">Power to Empower</span>
              </button>
              <button 
                onClick={() => navigate('/login')}
                className="btn-secondary text-sm"
              >
                Login / Register
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Navigation */}
        <nav className="bg-primary-700 text-white">
          <div className="container-custom">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3">Home</button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3">About</button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3 flex items-center gap-1">
                  Services <ChevronRight size={14} />
                </button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3 flex items-center gap-1">
                  For Patients <ChevronRight size={14} />
                </button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3 flex items-center gap-1">
                  For Frontline Workers <ChevronRight size={14} />
                </button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3 flex items-center gap-1">
                  For Doctors <ChevronRight size={14} />
                </button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3 flex items-center gap-1">
                  For Facilities <ChevronRight size={14} />
                </button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3 flex items-center gap-1">
                  Schemes & Policies <ChevronRight size={14} />
                </button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3">Resources</button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3">Help</button>
                <button className="nav-link text-white hover:bg-primary-600 px-4 py-3">Contact</button>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Search Bar - Mobile */}
        <div className="md:hidden p-4 bg-gray-50">
          <div className="search-bar">
            <Search size={18} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search services, health information, facilities..."
              className="flex-1 outline-none bg-transparent text-sm"
            />
          </div>
        </div>
      </header>

      {/* Quick Access Buttons */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border-b border-gray-200">
        <div className="container-custom py-4">
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn-outline text-sm py-2 px-4">
              <MapPin size={16} />
              Quick Access
            </button>
            <button className="text-sm px-4 py-2 hover:bg-white rounded-lg transition-colors">
              Find a Health Facility
            </button>
            <button className="text-sm px-4 py-2 hover:bg-white rounded-lg transition-colors">
              Telemedicine
            </button>
            <button className="text-sm px-4 py-2 hover:bg-white rounded-lg transition-colors">
              Emergency Services
            </button>
            <button className="text-sm px-4 py-2 hover:bg-white rounded-lg transition-colors">
              Check Scheme Eligibility
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-navy-900 to-navy-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('/patterns/grid.svg')]"></div>
        </div>
        
        <div className="container-custom relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center py-16 md:py-24">
            {/* Left Content */}
            <div>
              <div className="inline-block mb-6">
                <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider bg-primary-900/50 px-4 py-2 rounded-full">
                  INTEGRATED RURAL HEALTHCARE PLATFORM
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Healthcare that reaches<br />
                every home in <span className="text-secondary-400">rural India</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
                Accessible. People-Centric. Technology-Enabled.
              </p>
              
              <p className="text-base text-gray-400 mb-8 max-w-2xl">
                Swasthya Connect brings together patients, frontline workers, doctors and health facilities for 
                continuous care — accessible in rural communities.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-primary text-lg px-8 py-4"
                >
                  Access Services
                  <ChevronRight size={20} />
                </button>
                <button className="btn-outline text-white border-white hover:bg-white hover:text-primary-700 text-lg px-8 py-4">
                  Learn More
                </button>
              </div>
              
              <div className="bg-navy-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Sushila Devi</p>
                    <p className="text-sm text-gray-400">ASHA Worker, Beed District</p>
                  </div>
                </div>
                <p className="text-sm text-gray-300 italic">
                  "NO LONGER DO I NEED TO CARRY PAPER FORMS AND WAIT FOR DOCTOR VISITS"
                </p>
              </div>
            </div>
            
            {/* Right Image */}
            <div className="relative">
              <div className="relative z-10">
                <ImagePlaceholder 
                  type="hero"
                  className="w-full h-[500px] rounded-2xl shadow-2xl"
                  alt="Rural Indian woman in traditional attire representing healthcare accessibility"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-full h-full bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl -z-0"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Can Use Section - Cards */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="bg-primary-50 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Who can use Swasthya Connect?
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Patient Card */}
              <div className="user-type-card bg-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Patient</h3>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Get quick health check-ups and referrals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>View appointments, prescriptions, medical history</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Connect via video to doctors for consultations</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Track follow-ups</span>
                  </li>
                </ul>
                <button 
                  onClick={() => navigate('/login?role=patient')}
                  className="btn-primary w-full"
                >
                  Access Patient Portal
                  <ChevronRight size={18} />
                </button>
              </div>
              
              {/* Frontline Worker Card */}
              <div className="user-type-card bg-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Frontline Worker<br />
                  <span className="text-lg font-normal text-gray-600">(ASHA / ANM)</span>
                </h3>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Register patients</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Conduct AI triage (voice & text)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Upload documents, prescriptions via OCR</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Book follow-ups</span>
                  </li>
                </ul>
                <button 
                  onClick={() => navigate('/login?role=asha')}
                  className="btn-primary w-full"
                >
                  Access ASHA Portal
                  <ChevronRight size={18} />
                </button>
              </div>
              
              {/* Doctor Card */}
              <div className="user-type-card bg-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Doctor</h3>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>View referrals</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Accept/reject and manage care flow</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Video teleconsultation and real-time collaboration</span>
                  </li>
                </ul>
                <button 
                  onClick={() => navigate('/login?role=doctor')}
                  className="btn-primary w-full"
                >
                  Access Doctor Portal
                  <ChevronRight size={18} />
                </button>
              </div>
              
              {/* Health Facility Card */}
              <div className="user-type-card bg-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Health Facility</h3>
                <ul className="space-y-3 text-gray-700 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Manage capacity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Queue management</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Bed availability and ambulance coordination</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                    <span>Pharmacy and diagnostic services</span>
                  </li>
                </ul>
                <button 
                  onClick={() => navigate('/login?role=facility')}
                  className="btn-primary w-full"
                >
                  Access Facility Portal
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="stat-card">
              <div className="stat-number text-white">2.4+</div>
              <div className="stat-label text-primary-100">Lakh Patients (users)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-white">150+</div>
              <div className="stat-label text-primary-100">ASHA Workers (trained)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-white">500+</div>
              <div className="stat-label text-primary-100">Empanelled Health Centres (PHCs)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number text-white">95%</div>
              <div className="stat-label text-primary-100">Patient Satisfaction (%mins)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon bg-blue-100">
                <Activity className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-powered Triage</h3>
              <p className="text-gray-600">
                Early risk detection and guidance
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon bg-green-100">
                <Share2 className="text-green-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Referrals</h3>
              <p className="text-gray-600">
                Seamless care coordination
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon bg-purple-100">
                <FileText className="text-purple-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Health Records</h3>
              <p className="text-gray-600">
                Longitudinal care and consent-based sharing
              </p>
            </div>
            
            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon bg-orange-100">
                <Phone className="text-orange-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Emergency Support</h3>
              <p className="text-gray-600">
                Ambulance coordination
              </p>
            </div>
            
            {/* Feature 5 */}
            <div className="feature-card">
              <div className="feature-icon bg-red-100">
                <Shield className="text-red-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Scheme Coverage</h3>
              <p className="text-gray-600">
                Check eligibility for government health schemes
              </p>
            </div>
            
            {/* Feature 6 */}
            <div className="feature-card">
              <div className="feature-icon bg-teal-100">
                <Zap className="text-teal-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Offline-first Technology</h3>
              <p className="text-gray-600">
                Integrated facility services
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Citizens & Health Workers Sections */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* For Citizens */}
            <div className="bg-secondary-50 rounded-xl p-8">
              <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                <ImagePlaceholder type="citizen" className="w-full h-full" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">For Citizens</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-secondary-600" />
                  <span>Patient Services</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-secondary-600" />
                  <span>View appointments, prescriptions</span>
                </li>
              </ul>
            </div>
            
            {/* For Health Workers */}
            <div className="bg-primary-50 rounded-xl p-8">
              <div className="w-full h-48 mb-6 rounded-lg overflow-hidden">
                <ImagePlaceholder type="health-worker" className="w-full h-full" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                For Health Workers & Professionals
              </h3>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>ASHA / ANM</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>Register patients, conduct triage</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>Doctors</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>Manage referrals and teleconsult</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>Facility Staff</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>Manage queue, pharmacy, ambulance and more</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>District Administration</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <ChevronRight size={18} className="text-primary-600" />
                  <span>View district-level coordinating health metrics</span>
                </li>
              </ul>
            </div>
            
            {/* Important Links */}
            <div className="bg-navy-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Important Links</h3>
              <ul className="space-y-3">
                <li>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <FileText size={18} />
                    <span>User Guide</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <Users size={18} />
                    <span>Training Materials</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <Shield size={18} />
                    <span>How to use Swasthya Connect</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <FileText size={18} />
                    <span>FAQs</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <FileText size={18} />
                    <span>Frequently Asked Questions</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <FileText size={18} />
                    <span>Policy Documents</span>
                  </button>
                </li>
                <li>
                  <button className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium">
                    <FileText size={18} />
                    <span>Guidelines, privacy policy, terms & conditions</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* What's New Section */}
      <section className="section bg-gray-50">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">What's New</h2>
            <button className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2">
              View All
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { date: '27 NOV 2026', type: 'Announcement', title: 'SwasthyaConnect Web Launch for West Bengal announced' },
              { date: '18 NOV 2026', type: 'Updates', title: 'New govt ASHA version now available' },
              { date: '25 OCT 2026', type: 'Update', title: 'Video call and real-time health services' },
              { date: '20 OCT 2026', type: 'Events', title: 'Webinar on Digital Healthcare for Rural Communities' }
            ].map((item, idx) => (
              <div key={idx} className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Calendar size={14} />
                  <span>{item.date}</span>
                </div>
                <span className="inline-block px-3 py-1 bg-secondary-100 text-secondary-700 text-xs font-semibold rounded-full mb-3">
                  {item.type}
                </span>
                <p className="text-gray-900 font-medium">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Badges */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
            <div>
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-600" />
              <p className="text-sm font-semibold text-gray-700">ABDM-ready Architecture</p>
            </div>
            <div>
              <Shield className="w-12 h-12 mx-auto mb-3 text-blue-600" />
              <p className="text-sm font-semibold text-gray-700">Patient-first Design</p>
            </div>
            <div>
              <Zap className="w-12 h-12 mx-auto mb-3 text-orange-600" />
              <p className="text-sm font-semibold text-gray-700">Offline-first Technology</p>
            </div>
            <div>
              <Shield className="w-12 h-12 mx-auto mb-3 text-purple-600" />
              <p className="text-sm font-semibold text-gray-700">Accessible & Inclusive</p>
            </div>
            <div>
              <Award className="w-12 h-12 mx-auto mb-3 text-teal-600" />
              <p className="text-sm font-semibold text-gray-700">PROTOTYPE DEMO OVER</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-gray-300">
        <div className="container-custom py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="text-white" size={24} />
                <span className="text-white font-bold text-lg">Swasthya Connect</span>
              </div>
              <p className="text-sm mb-4">
                INTEGRATED RURAL HEALTHCARE PLATFORM
              </p>
              <p className="text-xs text-gray-400">
                SWASTHYA BHARAT | HEALTHY INDIA INITIATIVE
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">About</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="footer-link">Overview</button></li>
                <li><button className="footer-link">Objectives</button></li>
                <li><button className="footer-link">Team</button></li>
                <li><button className="footer-link">Contact Us</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="footer-link">For Patients</button></li>
                <li><button className="footer-link">For Frontline Workers</button></li>
                <li><button className="footer-link">For Doctors</button></li>
                <li><button className="footer-link">For Facilities</button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><button className="footer-link">User Guide</button></li>
                <li><button className="footer-link">Training Materials</button></li>
                <li><button className="footer-link">Research & Reports</button></li>
                <li><button className="footer-link">Media Gallery</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <a href="#" className="footer-link">Feedback</a>
                <span className="text-gray-600">|</span>
                <a href="#" className="footer-link">Sitemap</a>
              </div>
              <p className="text-gray-500">
                Content owned by <strong className="text-white">Government of India Website</strong> | 
                Maintained by <strong className="text-white">SwasthyaConnect Electronics</strong> | 
                Last updated: <strong className="text-white">04 Feb 2026</strong>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingNew
