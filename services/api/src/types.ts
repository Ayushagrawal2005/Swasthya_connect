export interface User {
  id: string
  username: string
  password: string
  role: 'asha' | 'doctor' | 'admin' | 'patient'
  name: string
}

export interface Patient {
  id: string
  name: string
  age: number
  gender: string
  phone: string
  village: string
  healthId: string
  visits: Visit[]
}

export interface Visit {
  id: string
  date: string
  type: string
  vitals?: any
  notes?: string
}

export interface Facility {
  id: string
  name: string
  type: string
}