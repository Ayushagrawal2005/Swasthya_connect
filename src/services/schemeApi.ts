/**
 * Government Scheme Checker API Client
 */

import axios from 'axios'
import type {
  Scheme,
  ApplicantInfo,
  SchemeEligibilityResponse,
  SchemeExplanationResponse,
} from '../types/scheme'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('swasthya_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const schemeApi = {
  /**
   * Get all active schemes (optionally filtered by state)
   */
  async getSchemes(state?: string): Promise<Scheme[]> {
    const response = await axios.get(`${API_URL}/schemes`, {
      headers: getAuthHeader(),
      params: state ? { state } : {},
    })
    return response.data
  },

  /**
   * Get a specific scheme by ID
   */
  async getSchemeById(id: string): Promise<Scheme> {
    const response = await axios.get(`${API_URL}/schemes/${id}`, {
      headers: getAuthHeader(),
    })
    return response.data
  },

  /**
   * Check eligibility for schemes
   */
  async checkEligibility(
    applicantInfo: ApplicantInfo,
    patientId?: string
  ): Promise<SchemeEligibilityResponse> {
    const response = await axios.post(
      `${API_URL}/schemes/check-eligibility`,
      { applicantInfo, patientId },
      {
        headers: getAuthHeader(),
      }
    )
    return response.data
  },

  /**
   * Get AI explanation for a scheme match
   */
  async explainScheme(
    schemeId: string,
    applicantInfo: ApplicantInfo,
    language: 'en' | 'hi' = 'en'
  ): Promise<SchemeExplanationResponse> {
    const response = await axios.post(
      `${API_URL}/schemes/explain`,
      { schemeId, applicantInfo, language },
      {
        headers: getAuthHeader(),
      }
    )
    return response.data
  },

  /**
   * Compare multiple schemes
   */
  async compareSchemes(
    schemeIds: string[],
    applicantInfo: ApplicantInfo,
    language: 'en' | 'hi' = 'en'
  ): Promise<any> {
    const response = await axios.post(
      `${API_URL}/schemes/compare`,
      { schemeIds, applicantInfo, language },
      {
        headers: getAuthHeader(),
      }
    )
    return response.data
  },

  /**
   * Create a new scheme (admin only)
   */
  async createScheme(scheme: Partial<Scheme>): Promise<Scheme> {
    const response = await axios.post(`${API_URL}/schemes`, scheme, {
      headers: getAuthHeader(),
    })
    return response.data
  },

  /**
   * Update a scheme (admin only)
   */
  async updateScheme(id: string, updates: Partial<Scheme>): Promise<Scheme> {
    const response = await axios.put(`${API_URL}/schemes/${id}`, updates, {
      headers: getAuthHeader(),
    })
    return response.data
  },
}

export default schemeApi
