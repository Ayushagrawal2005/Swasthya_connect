/**
 * Patient Consent Management Page
 * 
 * Allows patients to:
 * - View all active consents
 * - Grant new consent
 * - Revoke existing consent
 * - View consent history
 */

import { useState, useEffect } from 'react'
import { Shield, Plus, Eye, EyeOff, AlertCircle, CheckCircle, XCircle, Clock, History } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import consentApi from '../../services/consentApi'
import type { Consent, DataCategory, ConsentCreateRequest } from '../../types/consent'
import { format } from 'date-fns'

const DATA_CATEGORIES: DataCategory[] = [
  'Personal Information',
  'Medical Records',
  'Lab Reports',
  'Prescriptions',
  'Vaccination Records',
  'Diagnosis/Conditions',
  'Insurance Information',
  'Government Scheme Information',
  'Documents/Certificates',
]

const RECIPIENT_ROLES = [
  { value: 'asha', label: 'ASHA Worker' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'Facility Administrator' },
]

export default function ConsentManagement() {
  const { patientId } = useApp()
  const [consents, setConsents] = useState<Consent[]>([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [showGrantForm, setShowGrantForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Grant consent form state
  const [grantForm, setGrantForm] = useState<ConsentCreateRequest>({
    recipientId: '',
    recipientRole: 'asha',
    recipientName: '',
    dataCategory: 'Medical Records',
    purpose: '',
    durationDays: 30,
  })

  useEffect(() => {
    loadConsents()
  }, [showHistory])

  const loadConsents = async () => {
    try {
      setLoading(true)
      const data = await consentApi.getConsents(showHistory)
      setConsents(data)
    } catch (err: any) {
      setError('Failed to load consents')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleGrantConsent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!grantForm.purpose.trim()) {
      setError('Purpose is required')
      return
    }

    try {
      setError('')
      await consentApi.createConsent(grantForm)
      setSuccess('Consent granted successfully')
      setShowGrantForm(false)
      setGrantForm({
        recipientId: '',
        recipientRole: 'asha',
        recipientName: '',
        dataCategory: 'Medical Records',
        purpose: '',
        durationDays: 30,
      })
      loadConsents()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grant consent')
    }
  }

  const handleRevokeConsent = async (consentId: string) => {
    if (!confirm('Are you sure you want to revoke this consent? The recipient will immediately lose access.')) {
      return
    }

    try {
      setError('')
      await consentApi.revokeConsent(consentId)
      setSuccess('Consent revoked successfully')
      loadConsents()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke consent')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle size={12} />
            Active
          </span>
        )
      case 'REVOKED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <XCircle size={12} />
            Revoked
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            <Clock size={12} />
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            <Clock size={12} />
            Pending
          </span>
        )
    }
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No expiry'
    try {
      return format(new Date(dateString), 'dd MMM yyyy')
    } catch {
      return dateString
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-[#FF9933]" size={28} />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Privacy & Consent Management</h1>
        </div>
        <p className="text-sm text-[#6B6B6B]">
          Control who can access your health information and for what purpose
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-medium text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-green-900">{success}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setShowGrantForm(!showGrantForm)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={18} />
          Grant New Consent
        </button>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="btn-secondary inline-flex items-center gap-2"
        >
          {showHistory ? <EyeOff size={18} /> : <History size={18} />}
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {/* Grant Consent Form */}
      {showGrantForm && (
        <div className="mb-6 p-6 bg-white border border-[#D4D4D4] rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-[#1A1A1A] mb-4">Grant Data Access Consent</h2>
          <form onSubmit={handleGrantConsent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Data Category */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Data Category *
                </label>
                <select
                  value={grantForm.dataCategory}
                  onChange={e => setGrantForm({ ...grantForm, dataCategory: e.target.value as DataCategory })}
                  className="input-field"
                  required
                >
                  {DATA_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Role */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Share With *
                </label>
                <select
                  value={grantForm.recipientRole}
                  onChange={e => setGrantForm({ ...grantForm, recipientRole: e.target.value })}
                  className="input-field"
                  required
                >
                  {RECIPIENT_ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipient Name (Optional) */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Recipient Name (Optional)
                </label>
                <input
                  type="text"
                  value={grantForm.recipientName}
                  onChange={e => setGrantForm({ ...grantForm, recipientName: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Dr. Sharma"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                  Duration (Days) *
                </label>
                <input
                  type="number"
                  value={grantForm.durationDays || ''}
                  onChange={e => setGrantForm({ ...grantForm, durationDays: parseInt(e.target.value) || undefined })}
                  className="input-field"
                  min="1"
                  max="365"
                  placeholder="30"
                />
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Leave empty for no expiry
                </p>
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1">
                Purpose *
              </label>
              <textarea
                value={grantForm.purpose}
                onChange={e => setGrantForm({ ...grantForm, purpose: e.target.value })}
                className="input-field"
                rows={3}
                placeholder="e.g., For treatment consultation, For government scheme application, etc."
                required
              />
            </div>

            {/* Confirmation Notice */}
            <div className="p-4 bg-[#FFF5EB] border border-[#FFD4A3] rounded-lg">
              <p className="text-sm text-[#1A1A1A]">
                <strong>You are about to grant access to:</strong>
              </p>
              <ul className="text-sm text-[#6B6B6B] mt-2 space-y-1 ml-4 list-disc">
                <li>Data: <strong>{grantForm.dataCategory}</strong></li>
                <li>Recipient: <strong>{RECIPIENT_ROLES.find(r => r.value === grantForm.recipientRole)?.label}</strong></li>
                <li>Purpose: <strong>{grantForm.purpose || '(Please specify)'}</strong></li>
                <li>
                  Expires: <strong>
                    {grantForm.durationDays
                      ? `In ${grantForm.durationDays} days`
                      : 'No expiry (until revoked)'}
                  </strong>
                </li>
              </ul>
              <p className="text-xs text-[#6B6B6B] mt-3">
                You can revoke this consent at any time.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                Grant Consent
              </button>
              <button
                type="button"
                onClick={() => setShowGrantForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Consents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933]"></div>
            <p className="text-sm text-[#6B6B6B] mt-3">Loading consents...</p>
          </div>
        ) : consents.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#D4D4D4] rounded-lg">
            <Shield size={48} className="mx-auto text-[#D4D4D4] mb-3" />
            <p className="text-sm font-medium text-[#1A1A1A]">No Consents Found</p>
            <p className="text-sm text-[#6B6B6B] mt-1">
              {showHistory
                ? 'You haven\'t granted any consents yet'
                : 'You have no active consents'}
            </p>
          </div>
        ) : (
          consents.map(consent => (
            <div
              key={consent.id}
              className="p-5 bg-white border border-[#D4D4D4] rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-[#1A1A1A]">
                    {consent.dataCategory}
                  </h3>
                  <p className="text-sm text-[#6B6B6B] mt-1">
                    Shared with: <strong>{consent.recipientName || consent.recipientRole}</strong>
                  </p>
                </div>
                {getStatusBadge(consent.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[#6B6B6B]">Purpose</p>
                  <p className="text-[#1A1A1A] font-medium">{consent.purpose}</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B]">Granted</p>
                  <p className="text-[#1A1A1A] font-medium">{formatDate(consent.grantedAt)}</p>
                </div>
                <div>
                  <p className="text-[#6B6B6B]">Expires</p>
                  <p className="text-[#1A1A1A] font-medium">{formatDate(consent.expiresAt)}</p>
                </div>
                {consent.revokedAt && (
                  <div>
                    <p className="text-[#6B6B6B]">Revoked</p>
                    <p className="text-[#1A1A1A] font-medium">{formatDate(consent.revokedAt)}</p>
                  </div>
                )}
              </div>

              {consent.status === 'ACTIVE' && (
                <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                  <button
                    onClick={() => handleRevokeConsent(consent.id)}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Revoke Access
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
