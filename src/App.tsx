import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import { Navbar }           from './components/layout/Navbar'
import { Sidebar }          from './components/layout/Sidebar'
import { OfflineBanner }    from './components/ui/OfflineBanner'
import { SyncStatusDrawer } from './components/ui/SyncStatusDrawer'

// Public
import { LandingPage }      from './pages/Landing'
import { LoginPage }        from './pages/Login'
import { IvrSimulatorPage } from './pages/IvrSimulator'

// Frontline Worker (ASHA / ANM)
import { AshaDashboard }         from './pages/asha/AshaDashboard'
import { AshaRegisterPage }      from './pages/asha/AshaRegister'
import { AshaPatientSearchPage } from './pages/asha/AshaPatientSearch'
import { AshaTriage }            from './pages/asha/AshaTriage'
import { AshaAppointmentsPage }  from './pages/asha/AshaAppointments'
import { AshaFollowUpPage }      from './pages/asha/AshaFollowUp'
import { AshaReferralsPage }     from './pages/asha/AshaReferrals'
import { AshaTeleconsultPage }   from './pages/asha/AshaTeleconsult'
import { AshaOcrUploadPage }     from './pages/asha/AshaOcrUpload'
import { EmergencyEscalationPage as AshaEmergencyPage } from './pages/doctor/EmergencyEscalation'

// Doctor
import { DoctorHome }              from './pages/doctor/DoctorHome'
import { PatientDetailPage }       from './pages/doctor/PatientDetail'
import { ReferralInboxPage }       from './pages/doctor/ReferralInbox'
import { FollowUpBoardPage }       from './pages/doctor/FollowUpBoard'
import { EmergencyEscalationPage } from './pages/doctor/EmergencyEscalation'

// Admin
import { AdminOverview }              from './pages/admin/AdminOverview'
import { MedicineInventoryPage }      from './pages/admin/MedicineInventory'
import { DiagnosticCoordinationPage } from './pages/admin/DiagnosticCoordination'
import { StaffManagementPage }        from './pages/admin/StaffManagement'

// Shared
import { PatientFullRecord }  from './pages/shared/PatientFullRecord'
import { ChronicCareTracker } from './pages/shared/ChronicCareTracker'

// Patient
import { PatientHome }          from './pages/patient/PatientHome'
import { TriagePage }           from './pages/patient/Triage'
import { AppointmentsPage }     from './pages/patient/Appointments'
import { HealthRecordsPage }    from './pages/patient/HealthRecords'
import { MedicineTrackerPage }  from './pages/patient/MedicineTracker'
import { ReferralTrackerPage }  from './pages/patient/ReferralTracker'
import { TeleconsultPage }      from './pages/patient/Teleconsult'

function AppShell() {
  const { role, isOnline } = useApp()

  return (
    <div className="flex flex-col min-h-screen">
      {!isOnline && <OfflineBanner />}
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto" id="main-content">
          <Routes>
            {/* Public */}
            <Route path="/"      element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/ivr"   element={<IvrSimulatorPage />} />

            {/* Frontline Worker (ASHA) */}
            <Route path="/asha"             element={<AshaDashboard />} />
            <Route path="/asha/patients"    element={<AshaPatientSearchPage />} />
            <Route path="/asha/record"      element={<PatientFullRecord />} />
            <Route path="/asha/register"    element={<AshaRegisterPage />} />
            <Route path="/asha/triage"      element={<AshaTriage />} />
            <Route path="/asha/appointments" element={<AshaAppointmentsPage />} />
            <Route path="/asha/followup"    element={<AshaFollowUpPage />} />
            <Route path="/asha/referrals"   element={<AshaReferralsPage />} />
            <Route path="/asha/teleconsult" element={<AshaTeleconsultPage />} />
            <Route path="/asha/ocr"         element={<AshaOcrUploadPage />} />
            <Route path="/asha/chronic"     element={<ChronicCareTracker />} />
            <Route path="/asha/emergency"   element={<AshaEmergencyPage />} />

            {/* Doctor */}
            <Route path="/doctor"           element={<DoctorHome />} />
            <Route path="/doctor/patient"   element={<PatientDetailPage />} />
            <Route path="/doctor/record"    element={<PatientFullRecord />} />
            <Route path="/doctor/referrals" element={<ReferralInboxPage />} />
            <Route path="/doctor/followup"  element={<FollowUpBoardPage />} />
            <Route path="/doctor/chronic"   element={<ChronicCareTracker />} />
            <Route path="/doctor/emergency" element={<EmergencyEscalationPage />} />

            {/* Admin */}
            <Route path="/admin"             element={<AdminOverview />} />
            <Route path="/admin/inventory"   element={<MedicineInventoryPage />} />
            <Route path="/admin/diagnostics" element={<DiagnosticCoordinationPage />} />
            <Route path="/admin/followup"    element={<FollowUpBoardPage />} />
            <Route path="/admin/staff"       element={<StaffManagementPage />} />

            {/* Patient */}
            <Route path="/patient"              element={<PatientHome />} />
            <Route path="/patient/triage"       element={<TriagePage />} />
            <Route path="/patient/appointments" element={<AppointmentsPage />} />
            <Route path="/patient/records"      element={<HealthRecordsPage />} />
            <Route path="/patient/medicines"    element={<MedicineTrackerPage />} />
            <Route path="/patient/referrals"    element={<ReferralTrackerPage />} />
            <Route path="/patient/teleconsult"  element={<TeleconsultPage />} />
            <Route path="/patient/chronic"      element={<ChronicCareTracker />} />

            {/* Catch-all — patient role redirects to asha login */}
            <Route path="*" element={<Navigate to={role ? `/${role}` : '/'} replace />} />
          </Routes>
        </main>
      </div>

      {role && <SyncStatusDrawer />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </BrowserRouter>
  )
}
