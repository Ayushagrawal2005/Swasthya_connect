/**
 * Consent Management API Client
 */

import axios from 'axios'
import type {
  Consent,
  ConsentCreateRequest,
  ConsentCheckRequest,
  ConsentCheckResponse,
} from '../types/consent'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('swasthya_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const consentApi = {
  /**
   * Get all consents for the current user
   */
  async getConsents(includeHistory = false): Promise<Consent[]> {
    const response = await axios.get(`${API_URL}/consents`, {
      headers: getAuthHeader(),
      params: { history: includeHistory },
    })
    return response.data
  },

  /**
   * Get a specific consent by ID
   */
  async getConsentById(id: string): Promise<Consent> {
    const response = await axios.get(`${API_URL}/consents/${id}`, {
      headers: getAuthHeader(),
    })
    return response.data
  },

  /**
   * Create a new consent
   */
  async createConsent(data: ConsentCreateRequest): Promise<Consent> {
    const response = await axios.post(`${API_URL}/consents`, data, {
      headers: getAuthHeader(),
    })
    return response.data
  },

  /**
   * Revoke a consent
   */
  async revokeConsent(id: string): Promise<Consent> {
    const response = await axios.patch(
      `${API_URL}/consents/${id}/revoke`,
      {},
      {
        headers: getAuthHeader(),
      }
    )
    return response.data
  },

  /**
   * Check if valid consent exists
   */
  async checkConsent(data: ConsentCheckRequest): Promise<ConsentCheckResponse> {
    const response = await axios.post(`${API_URL}/consents/check`, data, {
      headers: getAuthHeader(),
    })
    return response.data
  },

  /**
   * Get consent history for a patient
   */
  async getConsentHistory(patientId: string): Promise<Consent[]> {
    const response = await axios.get(`${API_URL}/consents/history/${patientId}`, {
      headers: getAuthHeader(),
    })
    return response.data
  },
}

export default consentApi
