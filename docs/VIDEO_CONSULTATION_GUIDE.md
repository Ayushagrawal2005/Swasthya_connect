# Video Consultation Feature - User Guide

## 📹 Overview

The Video Consultation feature allows doctors to conduct teleconsultations with automated prescription generation. The system records the consultation and creates a structured prescription that appears in real-time alongside the video.

## 🎯 Key Features

### For Doctors
- **Video Upload:** Upload recorded consultation videos
- **Live Playback:** Professional video player with full controls
- **Auto-Generated Prescription:** Prescription sections appear automatically during playback
- **Structured Format:** Patient info, symptoms, diagnosis, medicines, and advice
- **Export Function:** Download prescription as text file
- **Professional UI:** Clean, healthcare-themed interface

## 🚀 How to Access

### From Doctor Portal

1. **Login as Doctor:**
   - Username: `doctor1`
   - Password: `doc123`

2. **Navigate to Video Consultation:**
   - Click "Video Consultation" in the left sidebar
   - OR go to: `/doctor/teleconsult`

## 📖 How to Use

### Step 1: Upload Video
1. Click the "Upload Video" button
2. Select a consultation recording (MP4, WebM, etc.)
3. Video will load into the player

### Step 2: Start Consultation
1. Click the Play button (▶)
2. Video begins playing
3. Call status shows "LIVE" indicator
4. Control buttons (mic, camera, chat, hang up) become active

### Step 3: Watch Prescription Generate
As the video plays, prescription sections auto-reveal at specific timestamps:

| Time | Section | Content |
|------|---------|---------|
| 3s | Patient Info | Name, age, gender, ID, date |
| 10s | Symptoms | Chief complaints list |
| 18s | Diagnosis | Clinical diagnosis |
| 28s | Medicines | Structured prescription with dosages |
| 40s | Advice | Clinical recommendations & signature |

### Step 4: Export Prescription
- Once sections are revealed, click "Export" button
- Downloads a text file with complete prescription
- Can be shared with patient via SMS/email

## 🎨 Interface Layout

### Left Side: Video Player
- **Main Video Area:** Shows consultation recording
- **Progress Bar:** Click to seek to any point
- **Controls:**
  - Play/Pause
  - Volume/Mute
  - Time display (current / total)
  - Fullscreen
- **Call Controls (when playing):**
  - Microphone toggle
  - Camera toggle  
  - Chat button
  - End call button

### Right Side: Prescription Panel
- **Header:** "Consultation Notes" with export button
- **Prescription Card:** Professional prescription layout
- **Auto-Reveal Sections:**
  - Patient Information
  - Chief Complaints
  - Diagnosis (highlighted)
  - Prescribed Medicines (detailed cards)
  - Clinical Advice
  - Doctor Signature

## 💊 Prescription Format

### Patient Information
```
Name: Priya Sharma
Age: 28 years
Gender: Female
Patient ID: P-2026-5438
Date: Auto-filled
```

### Chief Complaints
```
• Persistent cough (5 days)
• Mild fever
• Chest discomfort
• Fatigue
```

### Diagnosis
```
Acute Bronchitis
```

### Prescribed Medicines
```
1. Azithromycin 500 mg
   Frequency: Once daily
   Duration: 5 days

2. Salbutamol Inhaler 2 puffs
   Frequency: Every 6 hours as needed
   Duration: 10 days

3. Paracetamol 650 mg
   Frequency: Every 8 hours if needed
   Duration: 5 days
```

### Clinical Advice
```
• Complete the full antibiotic course
• Use inhaler before physical activity
• Stay well hydrated
• Avoid cold air exposure
• Return if symptoms worsen or fever persists
```

### Doctor Signature
```
Dr. Ramesh Patil
Consulting Physician
[Signature style text]
```

## 🎬 Video Recommendations

### Best Practices
- **Duration:** 40+ seconds for full prescription reveal
- **Format:** MP4 (best compatibility)
- **Quality:** 720p or higher recommended
- **Audio:** Clear audio improves demo quality

### Content Suggestions
- Record actual consultation (with patient consent)
- Use stock medical consultation footage
- Create scenario-based training videos
- Screen record telehealth platforms

## 🔧 Customization

### Change Timeline
Edit reveal timestamps in `DoctorTeleconsult.tsx`:
```typescript
const revealTimeline = [
  { time: 3, section: 'patient' },
  { time: 10, section: 'symptoms' },
  { time: 18, section: 'diagnosis' },
  { time: 28, section: 'medicines' },
  { time: 40, section: 'advice' }
]
```

### Change Prescription Data
Modify `consultationData` object:
```typescript
const consultationData = {
  patient: {
    name: 'Your Patient Name',
    age: 30,
    gender: 'Male',
    id: 'P-XXXX-XXXX'
  },
  symptoms: ['Symptom 1', 'Symptom 2'],
  diagnosis: 'Your Diagnosis',
  medicines: [
    {
      name: 'Medicine Name',
      dosage: '500 mg',
      frequency: 'Twice daily',
      duration: '7 days'
    }
  ],
  // ... more fields
}
```

## 🎯 Use Cases

### 1. Real Teleconsultations
- Record live consultations with patient consent
- Generate prescription automatically
- Save to patient records
- Share digitally with patient

### 2. Training & Education
- Train new doctors on consultation format
- Show proper prescription practices
- Demonstrate teleconsult workflow
- Create educational content

### 3. Demonstrations
- Show stakeholders how platform works
- Demonstrate to potential clients
- Present at medical conferences
- Create marketing materials

### 4. Quality Assurance
- Review consultation quality
- Audit prescription accuracy
- Train on best practices
- Standardize consultation format

## 📊 Integration with Platform

### Connects With:
- **Patient Records:** Access patient history
- **Consultation API:** Save notes to database
- **Appointment System:** Link to scheduled appointments
- **Prescription Management:** Store structured prescriptions
- **Follow-up System:** Schedule next visits

### Data Flow:
```
Video Upload → Play → Auto-Reveal → Export
     ↓                                  ↓
Patient Data ← API → Database → Patient Records
```

## 🐛 Troubleshooting

### Video Won't Play
**Solutions:**
- Check file format (use MP4)
- Try smaller file size
- Refresh the page
- Use Chrome/Edge browser

### Sections Not Appearing
**Solutions:**
- Ensure video is playing (not paused)
- Wait for timestamp to be reached
- Check browser console for errors
- Reload page and re-upload

### Export Not Working
**Solutions:**
- Check browser download settings
- Disable popup blocker
- Try different browser
- Right-click and "Save As"

## 🔐 Security & Privacy

### Best Practices:
- ✅ Only upload with patient consent
- ✅ Secure video storage
- ✅ Encrypted transmission
- ✅ Access control by role
- ✅ Audit logging
- ❌ Don't share without authorization
- ❌ Don't use for unauthorized recordings

## 📱 Technical Details

### Supported Video Formats:
- MP4 (recommended)
- WebM
- OGG
- MOV (may need conversion)

### Browser Support:
- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Firefox
- ⚠️ Safari (may have issues)

### File Size Limits:
- Recommended: Under 100MB
- Maximum: 500MB
- Larger files may take time to load

## 🎓 Training Guide

### For New Users:
1. **Watch Demo:** Have supervisor demonstrate feature
2. **Practice:** Upload test video and observe
3. **Understand Timeline:** Learn when sections appear
4. **Export:** Practice downloading prescription
5. **Integrate:** Connect with actual workflow

### Training Checklist:
- [ ] Can access Video Consultation page
- [ ] Know how to upload video
- [ ] Understand auto-reveal timeline
- [ ] Can control playback
- [ ] Can export prescription
- [ ] Understand when to use feature
- [ ] Know privacy/consent requirements

## 📞 Support

### For Technical Issues:
- Check browser console for errors
- Verify video file format
- Try different browser
- Clear browser cache
- Contact IT support

### For Clinical Questions:
- Consult supervising physician
- Review prescription guidelines
- Check dosage references
- Follow institutional protocols

---

## ✅ Quick Reference

| Action | How To |
|--------|---------|
| Access | Doctor sidebar → "Video Consultation" |
| Upload | Click "Upload Video" button |
| Play | Click ▶ button |
| Pause | Click ⏸ button |
| Seek | Click on progress bar |
| Export | Click "Export" button |
| End | Click red phone button |

**URL:** `/doctor/teleconsult`

**Revealed At:**
- 3s = Patient Info
- 10s = Symptoms
- 18s = Diagnosis
- 28s = Medicines
- 40s = Advice

---

**Built for Professional Healthcare Delivery**
