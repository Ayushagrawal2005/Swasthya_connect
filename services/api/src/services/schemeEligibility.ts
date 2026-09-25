/**
 * Government Scheme Eligibility Rule Engine
 * 
 * CRITICAL: This service determines eligibility using STRUCTURED RULES
 * AI is NOT used for eligibility determination
 * AI is only used for explanations after rules have determined matches
 */

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

export type EligibilityStatus = 'LIKELY_ELIGIBLE' | 'NEEDS_VERIFICATION' | 'NOT_MATCHING'

export interface EligibilityResult {
  scheme: Scheme
  status: EligibilityStatus
  matchedCriteria: string[]
  missingCriteria: string[]
  score: number // 0-100
  reason: string
}

export const schemeEligibilityService = {
  /**
   * Evaluate applicant against all active schemes
   */
  async evaluateEligibility(
    applicant: ApplicantInfo,
    schemes: Scheme[]
  ): Promise<EligibilityResult[]> {
    const results: EligibilityResult[] = []

    for (const scheme of schemes) {
      if (!scheme.active) continue

      const result = this.evaluateSingleScheme(applicant, scheme)
      results.push(result)
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score)
  },

  /**
   * Evaluate applicant against a single scheme
   * Returns detailed match information
   */
  evaluateSingleScheme(applicant: ApplicantInfo, scheme: Scheme): EligibilityResult {
    const rules = scheme.eligibilityRules
    const matched: string[] = []
    const missing: string[] = []
    let score = 0
    const totalCriteria = this.countCriteria(rules)

    // Age check
    if (rules.minAge !== undefined || rules.maxAge !== undefined) {
      if (applicant.age === undefined) {
        missing.push('Age')
      } else if (
        (rules.minAge === undefined || applicant.age >= rules.minAge) &&
        (rules.maxAge === undefined || applicant.age <= rules.maxAge)
      ) {
        matched.push('Age')
        score += 15
      } else {
        return this.createNotMatchingResult(scheme, 'Age requirement not met')
      }
    }

    // Income check
    if (rules.incomeLimit !== undefined) {
      if (applicant.annualIncome === undefined) {
        missing.push('Annual Income')
      } else if (applicant.annualIncome <= rules.incomeLimit) {
        matched.push('Income')
        score += 20
      } else {
        return this.createNotMatchingResult(scheme, 'Income exceeds limit')
      }
    }

    // Gender check
    if (rules.genderRequirement && rules.genderRequirement !== 'ANY') {
      if (applicant.gender === undefined) {
        missing.push('Gender')
      } else if (applicant.gender === rules.genderRequirement) {
        matched.push('Gender')
        score += 10
      } else {
        return this.createNotMatchingResult(scheme, 'Gender requirement not met')
      }
    }

    // Location check (Rural/Urban)
    if (rules.ruralOnly === true) {
      if (applicant.isRural === undefined) {
        missing.push('Location (Rural/Urban)')
      } else if (applicant.isRural === true) {
        matched.push('Rural Location')
        score += 10
      } else {
        return this.createNotMatchingResult(scheme, 'Scheme is for rural areas only')
      }
    }

    if (rules.urbanOnly === true) {
      if (applicant.isRural === undefined) {
        missing.push('Location (Rural/Urban)')
      } else if (applicant.isRural === false) {
        matched.push('Urban Location')
        score += 10
      } else {
        return this.createNotMatchingResult(scheme, 'Scheme is for urban areas only')
      }
    }

    // State check
    if (rules.stateRequirement && rules.stateRequirement.length > 0) {
      if (!applicant.state) {
        missing.push('State')
      } else if (rules.stateRequirement.includes(applicant.state)) {
        matched.push('State')
        score += 10
      } else {
        return this.createNotMatchingResult(scheme, 'State requirement not met')
      }
    }

    // BPL check
    if (rules.bplRequired === true) {
      if (applicant.isBPL === undefined) {
        missing.push('BPL Status')
      } else if (applicant.isBPL === true) {
        matched.push('BPL Status')
        score += 15
      } else {
        return this.createNotMatchingResult(scheme, 'BPL status required')
      }
    }

    // Senior Citizen check
    if (rules.seniorCitizenRequired === true) {
      if (applicant.isSeniorCitizen === undefined) {
        missing.push('Senior Citizen Status')
      } else if (applicant.isSeniorCitizen === true) {
        matched.push('Senior Citizen')
        score += 15
      } else {
        return this.createNotMatchingResult(scheme, 'Senior citizen status required')
      }
    }

    // Disability check
    if (rules.disabilityRequired === true) {
      if (applicant.hasDisability === undefined) {
        missing.push('Disability Status')
      } else if (applicant.hasDisability === true) {
        matched.push('Disability')
        score += 15
      } else {
        return this.createNotMatchingResult(scheme, 'Disability status required')
      }
    }

    // Pregnancy check
    if (rules.pregnancyRequired === true) {
      if (applicant.isPregnant === undefined) {
        missing.push('Pregnancy Status')
      } else if (applicant.isPregnant === true) {
        matched.push('Pregnancy')
        score += 15
      } else {
        return this.createNotMatchingResult(scheme, 'Pregnancy status required')
      }
    }

    // Occupation check
    if (rules.occupationRequirement && rules.occupationRequirement.length > 0) {
      if (!applicant.occupation) {
        missing.push('Occupation')
      } else if (rules.occupationRequirement.includes(applicant.occupation)) {
        matched.push('Occupation')
        score += 10
      } else {
        return this.createNotMatchingResult(scheme, 'Occupation requirement not met')
      }
    }

    // Category check (SC/ST/OBC/etc.)
    if (rules.categoryRequirement && rules.categoryRequirement.length > 0) {
      if (!applicant.category) {
        missing.push('Category')
      } else if (rules.categoryRequirement.includes(applicant.category)) {
        matched.push('Category')
        score += 10
      } else {
        return this.createNotMatchingResult(scheme, 'Category requirement not met')
      }
    }

    // Determine status
    let status: EligibilityStatus
    let reason: string

    if (missing.length === 0) {
      status = 'LIKELY_ELIGIBLE'
      reason = 'All required criteria matched'
      score = Math.min(100, score + 10) // Bonus for complete match
    } else if (matched.length >= totalCriteria / 2) {
      status = 'NEEDS_VERIFICATION'
      reason = `Additional information needed: ${missing.join(', ')}`
    } else {
      status = 'NOT_MATCHING'
      reason = 'Insufficient criteria matched'
    }

    return {
      scheme,
      status,
      matchedCriteria: matched,
      missingCriteria: missing,
      score,
      reason,
    }
  },

  /**
   * Count total criteria for a scheme
   */
  countCriteria(rules: SchemeEligibilityRule): number {
    let count = 0
    if (rules.minAge !== undefined || rules.maxAge !== undefined) count++
    if (rules.incomeLimit !== undefined) count++
    if (rules.genderRequirement && rules.genderRequirement !== 'ANY') count++
    if (rules.ruralOnly === true || rules.urbanOnly === true) count++
    if (rules.stateRequirement && rules.stateRequirement.length > 0) count++
    if (rules.bplRequired === true) count++
    if (rules.seniorCitizenRequired === true) count++
    if (rules.disabilityRequired === true) count++
    if (rules.pregnancyRequired === true) count++
    if (rules.occupationRequirement && rules.occupationRequirement.length > 0) count++
    if (rules.categoryRequirement && rules.categoryRequirement.length > 0) count++
    return Math.max(1, count) // At least 1 to avoid division by zero
  },

  /**
   * Create a NOT_MATCHING result
   */
  createNotMatchingResult(scheme: Scheme, reason: string): EligibilityResult {
    return {
      scheme,
      status: 'NOT_MATCHING',
      matchedCriteria: [],
      missingCriteria: [],
      score: 0,
      reason,
    }
  },

  /**
   * Filter results to show only likely eligible or needs verification
   */
  filterRelevantResults(results: EligibilityResult[]): EligibilityResult[] {
    return results.filter(r => r.status !== 'NOT_MATCHING' || r.score > 20)
  },
}

export default schemeEligibilityService
