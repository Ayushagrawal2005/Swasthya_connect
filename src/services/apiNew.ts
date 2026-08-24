// Backend API configuration
const API_BASE_URL = 'http://localhost:4000'

// API client with auth header
const apiClient = {
  get: async (url: string) => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}${url}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
  
  post: async (url: string, data: any) => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${API_BASE_URL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  }
}

// Auth API  
export const authApi = {
  login: async (username: string, password: string) => {
    const result = await apiClient.post('/auth/login', { username, password })
    localStorage.setItem('auth_token', result.token)
    return result
  },
  
  me: async () => {
    return apiClient.get('/auth/me')
  },
  
  logout: async () => {
    localStorage.removeItem('auth_token')
  }
}

// Patients API  
export const patientsApi = {
  search: async (query?: string) => {
    return apiClient.get(`/patients/search${query ? `?q=${encodeURIComponent(query)}` : ''}`)
  },
  
  get: async (id: string) => {
    return apiClient.get(`/patients/${id}`)
  },
  
  register: async (data: any) => {
    return apiClient.post('/patients', data)
  }
}

// Triage API
export const triageApi = {
  assess: async (symptoms: any, vitals: any, patientId?: string) => {
    return apiClient.post('/triage/assess', { symptoms, vitals, patientId })
  }
}

// Appointments API
export const appointmentsApi = {
  getFacilities: async () => {
    return apiClient.get('/appointments/facilities')
  },
  
  getSlots: async (facilityId: string, date: string) => {
    return apiClient.get(`/appointments/slots?facilityId=${facilityId}&date=${date}`)
  },
  
  book: async (data: any) => {
    return apiClient.post('/appointments/book', data)
  }
}

// Admin API
export const adminApi = {
  getOverview: async () => {
    return apiClient.get('/admin/overview')
  }
}