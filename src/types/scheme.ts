/**
 * Government Scheme Types
 */

export type EligibilityStatus = 'LIKELY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_MATCHING'

export interface SchemeEligibilityRule {
  minAge?: number
  maxAge?: number
  incomeLimit?: number
  genderRequirement?: 'M' | 'F' | 'ANY'
  occupationRequirement?: string[]
  ruralOnly?: boolean
  urbanOnly?: boolean
  disabilityRequired?: boolean
  seniorCitizenRequired?: boolean
  pregnancyRequired?: boolean
  healthConditionRequirement?: string[]
  categoryRequirement?: string[]
  stateRequirement?: string[]
  bplRequired?: boolean
}

export interface Scheme {
  id: string
  schemeName: string
  description: string
  ministry?: string
  state?: string
  officialSource?: string
  applicationUrl?: string
  benefits: string[]
  eligibilityRules: SchemeEligibilityRule
  requiredDocuments: string[]
  lastVerified?: string
  active: boolean
}

export interface ApplicantInfo {
  age?: number
  gender?: 'M' | 'F' | 'O'
  state?: string
  district?: string
  isRural?: boolean
  annualIncome?: number
  isBPL?: boolean
  occupation?: string
  familySize?: number
  isSeniorCitizen?: boolean
  hasDisability?: boolean
  disabilityType?: string
  isPregnant?: boolean
  healthCondition?: string
  category?: 'General' | 'SC' | 'ST' | 'OBC' | 'EWS'
  hasIncomeCertificate?: boolean
  hasDisabilityCertificate?: boolean
}

export interface EligibilityResult {
  scheme: Scheme
  status: EligibilityStatus
  matchedCriteria: string[]
  missingCriteria: string[]
  score: number
  reason: string
}

export interface SchemeEligibilityResponse {
  results: EligibilityResult[]
  totalEvaluated: number
  likelyEligible: number
  needsVerification: number
}

export interface SchemeExplanation {
  summary: string
  whyRelevant: string[]
  documents: string[]
  nextSteps: string[]
  disclaimer: string
  language?: 'en' | 'hi'
}

export interface SchemeExplanationResponse {
  scheme: Scheme
  eligibilityResult: EligibilityResult
  aiExplanation: SchemeExplanation | null
  aiError?: string
}
