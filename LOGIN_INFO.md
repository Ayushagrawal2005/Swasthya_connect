# 🔐 Quick Login Guide

## One-Click Login ⚡

The login page now has **one-click auto-login** buttons. Just click any role card to instantly log in!

## Available Demo Accounts

### 🟢 ASHA Worker (Frontline)
- **Username:** `asha1`
- **Password:** `password`
- **Role:** ASHA / ANM — triage, referrals & follow-up
- **Access:** Patient registration, triage, appointments, referrals, follow-ups

### 🔵 Doctor / Clinician
- **Username:** `doctor1`
- **Password:** `password`
- **Role:** Medical professional
- **Access:** Patient queue, consultations, prescriptions, referrals

### 🔴 Facility Admin
- **Username:** `admin1`
- **Password:** `password`
- **Role:** Healthcare facility administrator
- **Access:** Dashboard, KPIs, inventory, diagnostics, staff management

### 🟣 Patient
- **Username:** `patient1`
- **Password:** `password`
- **Role:** Patient (Meena Jadhav)
- **Access:** View records, book appointments, track referrals

## How to Login

### Method 1: One-Click (Recommended) ⚡
1. Go to http://localhost:5173
2. Click any role card on the left side
3. You're in! 🎉

### Method 2: Manual Entry
1. Type username (e.g., `asha1`)
2. Type password: `password`
3. Click "Sign in securely"

## System URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000
- **ML Backend:** http://localhost:5000 (optional)

## Features by Role

### ASHA Worker
- Register new patients
- Conduct triage assessments
- Book appointments
- Create referrals
- Manage follow-ups
- Upload OCR documents
- Teleconsultation

### Doctor
- View patient queue
- Access patient details
- Review referrals
- Manage follow-ups
- Emergency escalation

### Admin
- View dashboard metrics
- Monitor inventory
- Coordinate diagnostics
- Manage staff
- System overview

### Patient
- View health records
- Book appointments
- Track referrals
- View medications
- Access test results

## Quick Test

1. Click "ASHA Worker" card → Should login instantly
2. You'll see the ASHA dashboard
3. Try registering a patient or running triage

## Notes

- All passwords are `password` for demo purposes
- The system uses JWT authentication
- Session persists until logout
- Backend validates all requests

---

**Tip:** For fastest access, bookmark http://localhost:5173 and just click your preferred role! ⚡
