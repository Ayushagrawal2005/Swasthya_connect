# SwasthyaConnect

**An Integrated Care-Access and Quality Support Platform for Rural and Underserved Health Systems**

Built for Smart India Hackathon (SIH26133).

---

## Overview

SwasthyaConnect connects sub-centres, PHCs, rural hospitals, and district hospitals through a shared digital layer — giving frontline workers, doctors, and administrators the tools they need to deliver continuous, trackable care in low-connectivity rural environments.

---

## Tech Stack

- **React 18 + TypeScript + Vite**
- **Tailwind CSS** — design system (Deep Teal / Warm Coral / Deep Indigo palette)
- **Framer Motion** — page transitions and micro-interactions
- **Recharts** — data visualizations
- **React Router DOM** — routing

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Frontline Worker (ASHA/ANM) | `asha@swasthya.in` | `demo1234` |
| Doctor / Clinician | `doctor@swasthya.in` | `demo1234` |
| Facility Admin | `admin@swasthya.in` | `demo1234` |

---

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Core Modules

1. **Patient Identity & Records** — ABDM-linked longitudinal health records
2. **Digital Triage** — AI-assisted symptom checker with 0–100 risk scoring; auto-escalates at score ≥ 75
3. **Teleconsultation** — Adaptive streamer (video → audio-only on 2G/3G fallback)
4. **Appointment & Queue Management** — Facility → Doctor → Slot booking with live queue position
5. **Referral Management** — Urgency-based hospital suggestions; status stepper (referred → reached → treated)
6. **Diagnostic Coordination** — Test pipeline tracking; flags unavailable tests + nearest facility
7. **Medicine Availability** — Stock visibility with low-stock alerts and nearest facility check
8. **High-Risk Follow-Up** — Kanban board with auto-flagging for overdue cases
9. **Emergency Escalation** — One-tap emergency with priority routing and status tracking
10. **Facility & Quality Dashboard** — KPIs, charts, referral network map
11. **Chronic Disease Tracker** — Progression charting, auto-flagging, proactive worker outreach
12. **Hospital Kiosk Mode** — QR-based walk-in queue management
13. **IVR Helpline Simulator** — Non-smartphone pathway demonstration
14. **Offline Sync** — Encrypted on-device storage with background sync

---

## Project Structure

```
src/
├── components/
│   ├── layout/       # Navbar, Sidebar
│   └── ui/           # Shared UI components (AIPill, OfflineBanner, SyncStatusDrawer)
├── context/          # AppContext (role, language, offline state)
├── data/             # Seeded demo data (Meena patient, facility data, chronic data)
├── lib/              # Risk scoring engine, utilities
├── pages/
│   ├── asha/         # Frontline Worker portal
│   ├── doctor/       # Doctor portal
│   ├── admin/        # Admin portal
│   └── shared/       # Shared views (PatientFullRecord, ChronicCareTracker)
└── index.css         # Tailwind + design tokens
```

---

## Key Design Decisions

- **Offline-first**: `navigator.onLine` detection with pending sync count and encrypted local storage simulation
- **Risk scoring**: Deterministic 0–100 engine — vitals + symptom keywords + severity = score; ≥75 auto-escalates
- **Adaptive teleconsult**: Bandwidth simulation (4G→3G→2G audio-only) with live signal indicator
- **Explainable AI**: Every flag shows a plain-language reason — no black-box outputs
- **ABDM/FHIR compliance**: Mentioned throughout; health IDs follow ABDM format

---

## License

Open source — built for Digital Public Infrastructure under NDHM/Ayushman Bharat framework.
