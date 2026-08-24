/**
 * Shared facility + doctor data used by ASHA appointments, admin staff view,
 * and referral creation urgency-based suggestions.
 */

export type FacilityTier = 'sub-centre' | 'phc' | 'rural-hospital' | 'district'
export type UrgencyLevel  = 'routine' | 'urgent' | 'emergency'

export interface Doctor {
  id: string
  name: string
  specialty: string
  available: boolean
  slotsToday: number
  facilityId: string
}

export interface Facility {
  id: string
  name: string
  tier: FacilityTier
  distance: string   // from Sub-centre Mandav
  phone: string
  address: string
  doctors: Doctor[]
}

// Hierarchy: Sub-centre → PHC → Rural Hospital → District
export const facilities: Facility[] = [
  {
    id: 'SC001',
    name: 'Sub-Centre Mandav',
    tier: 'sub-centre',
    distance: '0 km (home)',
    phone: '02442-241001',
    address: 'Mandav Village, Beed District',
    doctors: [
      { id: 'D-SC01', name: 'ANM Kavita Shinde',  specialty: 'Community Health',    available: true,  slotsToday: 8,  facilityId: 'SC001' },
    ],
  },
  {
    id: 'PHC001',
    name: 'PHC Beed',
    tier: 'phc',
    distance: '18 km',
    phone: '02442-222101',
    address: 'Near Bus Stand, Beed',
    doctors: [
      { id: 'D-PHC01', name: 'Dr. Ramesh Patil',  specialty: 'General Medicine',   available: true,  slotsToday: 6,  facilityId: 'PHC001' },
      { id: 'D-PHC02', name: 'Dr. Sneha More',    specialty: 'OB/GYN',            available: true,  slotsToday: 4,  facilityId: 'PHC001' },
      { id: 'D-PHC03', name: 'Dr. Arun Wagh',     specialty: 'Paediatrics',       available: false, slotsToday: 0,  facilityId: 'PHC001' },
    ],
  },
  {
    id: 'RH001',
    name: 'Rural Hospital Beed',
    tier: 'rural-hospital',
    distance: '22 km',
    phone: '02442-233201',
    address: 'Civil Lines, Beed',
    doctors: [
      { id: 'D-RH01', name: 'Dr. Priya Desai',   specialty: 'General Medicine',   available: true,  slotsToday: 10, facilityId: 'RH001' },
      { id: 'D-RH02', name: 'Dr. Suresh Kale',   specialty: 'Surgery',           available: true,  slotsToday: 5,  facilityId: 'RH001' },
      { id: 'D-RH03', name: 'Dr. Neha Patil',    specialty: 'OB/GYN',            available: true,  slotsToday: 7,  facilityId: 'RH001' },
      { id: 'D-RH04', name: 'Dr. Vivek Shah',    specialty: 'Internal Medicine', available: false, slotsToday: 0,  facilityId: 'RH001' },
    ],
  },
  {
    id: 'DH001',
    name: 'District Hospital Beed',
    tier: 'district',
    distance: '38 km',
    phone: '02442-244401',
    address: 'Nanded Road, Beed',
    doctors: [
      { id: 'D-DH01', name: 'Dr. S. Kulkarni',    specialty: 'Cardiology',        available: true,  slotsToday: 3,  facilityId: 'DH001' },
      { id: 'D-DH02', name: 'Dr. M. Desai',       specialty: 'Nephrology',        available: true,  slotsToday: 4,  facilityId: 'DH001' },
      { id: 'D-DH03', name: 'Dr. R. Joshi',       specialty: 'Neurology',         available: false, slotsToday: 0,  facilityId: 'DH001' },
      { id: 'D-DH04', name: 'Dr. A. Singh',       specialty: 'Orthopaedics',      available: true,  slotsToday: 5,  facilityId: 'DH001' },
      { id: 'D-DH05', name: 'Dr. P. Rao',         specialty: 'Pulmonology',       available: true,  slotsToday: 6,  facilityId: 'DH001' },
    ],
  },
]

/**
 * Given urgency, return ordered list of facilities the patient should be referred to.
 * routine  → can stay at PHC or go to Rural Hospital
 * urgent   → Rural Hospital preferred; District if PHC is full
 * emergency → District Hospital immediately
 */
export function getRecommendedFacilities(urgency: UrgencyLevel): Facility[] {
  switch (urgency) {
    case 'routine':
      return facilities.filter(f => f.tier === 'phc' || f.tier === 'sub-centre')
    case 'urgent':
      return facilities.filter(f => f.tier === 'rural-hospital' || f.tier === 'phc')
    case 'emergency':
      return facilities.filter(f => f.tier === 'district' || f.tier === 'rural-hospital')
  }
}

export const urgencyToTier: Record<UrgencyLevel, FacilityTier[]> = {
  routine:   ['sub-centre', 'phc'],
  urgent:    ['phc', 'rural-hospital'],
  emergency: ['rural-hospital', 'district'],
}

export const tierLabel: Record<FacilityTier, string> = {
  'sub-centre':    'Sub-Centre',
  phc:             'PHC',
  'rural-hospital':'Rural Hospital',
  district:        'District Hospital',
}

export const tierColor: Record<FacilityTier, string> = {
  'sub-centre':    'bg-teal-50 text-teal-700 border-teal-200',
  phc:             'bg-indigo-50 text-indigo-700 border-indigo-200',
  'rural-hospital':'bg-amber-50 text-amber-700 border-amber-200',
  district:        'bg-coral-50 text-coral-700 border-coral-200',
}
