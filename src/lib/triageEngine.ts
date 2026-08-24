/**
 * Hybrid Triage Engine
 * Uses ML predictions when available, falls back to rule-based scoring
 */

import { triageApi, type TriageInput } from '../services/triageApi'
import { computeRiskScore, type RiskLevel } from './riskScoring'

export interface HybridTriageResult {
  score: number
  level: RiskLevel
  autoEscalate: boolean
  breakdown: {
    vitalsScore: number
    symptomsScore: number
    severityScore: number
  }
  triggeredFlags: string[]
  confidence?: number
  mlUsed: boolean
  hospitalLevel: number       // 1–4 (India public health system)
  hospitalLevelLabel: string  // e.g. "PHC / CHC"
  hospitalLevelDesc: string   // short description
  probabilities?: {
    low: number
    medium: number
    high: number
    emergency: number
  }
}

class TriageEngine {
  private mlAvailable: boolean | null = null
  private useMl: boolean = true

  // Hospital level lookup — maps risk level to India public health system tier
  private readonly HOSPITAL_LEVELS: Record<RiskLevel, { level: number; label: string; desc: string }> = {
    low:       { level: 1, label: 'Sub-Centre / ASHA',         desc: 'Manage at home with ASHA guidance' },
    medium:    { level: 2, label: 'PHC / CHC',                 desc: 'Primary Health Centre or Community Health Centre' },
    high:      { level: 3, label: 'District Hospital',          desc: 'District or Rural Hospital' },
    emergency: { level: 4, label: 'Tertiary / Medical College', desc: 'Tertiary care — Medical College or Super-Speciality Hospital' },
  }

  constructor() {
    // Check feature flag
    this.useMl = true
    if (this.useMl) {
      this.checkMlAvailability()
    }
  }

  private async checkMlAvailability() {
    try {
      this.mlAvailable = await triageApi.healthCheck()
      console.log(`ML Triage API: ${this.mlAvailable ? '✓ Available' : '✗ Unavailable'}`)
    } catch (error) {
      this.mlAvailable = false
      console.warn('ML API check failed, using fallback scoring')
    }
  }

  /**
   * Parse severity from answers
   */
  private parseSeverity(answers: string[]): number {
    for (const answer of answers) {
      const match = answer.match(/\b(10|[1-9])\b/)
      if (match) {
        return Number(match[1])
      }
    }
    return 5 // default medium
  }

  /**
   * Parse duration from answers
   */
  private parseDuration(answers: string[]): number {
    for (const answer of answers) {
      const match = answer.match(/(\d+)\s*(day|days|week|weeks)/i)
      if (match) {
        const num = Number(match[1])
        const unit = match[2].toLowerCase()
        return unit.startsWith('week') ? num * 7 : num
      }
    }
    return 1 // default 1 day
  }

  /**
   * Assess triage using ML or fallback
   */
  async assessTriage(input: {
    vitals?: { bp?: string; temp?: string; spo2?: string; pulse?: string }
    answers?: string[]
  }): Promise<HybridTriageResult> {
    // Prepare ML input
    const mlInput: TriageInput = {
      vitals: input.vitals,
      answers: input.answers || [],
      severity: this.parseSeverity(input.answers || []),
      duration_days: this.parseDuration(input.answers || []),
    }

    // Try ML prediction first if enabled
    if (this.useMl && this.mlAvailable !== false) {
      try {
        const response = await triageApi.predict(mlInput)
        
        if (response.data && !response.error) {
          const mlResult = response.data
          const hosp = this.HOSPITAL_LEVELS[mlResult.risk_level]

          // Convert ML result to hybrid format
          return {
            score: mlResult.score,
            level: mlResult.risk_level,
            autoEscalate: mlResult.auto_escalate,
            breakdown: {
              vitalsScore: Math.round(mlResult.score * 0.4), // approximate
              symptomsScore: Math.round(mlResult.score * 0.35),
              severityScore: Math.round(mlResult.score * 0.25),
            },
            triggeredFlags: mlResult.flags,
            confidence: mlResult.confidence,
            mlUsed: true,
            hospitalLevel: mlResult.hospital_level ?? hosp.level,
            hospitalLevelLabel: mlResult.hospital_level_label ?? hosp.label,
            hospitalLevelDesc: mlResult.hospital_level_desc ?? hosp.desc,
            probabilities: mlResult.probabilities,
          }
        }
      } catch (error) {
        console.warn('ML prediction failed, using fallback:', error)
        this.mlAvailable = false
      }
    }

    // Fallback to rule-based scoring
    const ruleResult = computeRiskScore({
      vitals: input.vitals,
      answers: input.answers,
    })

    const hosp = this.HOSPITAL_LEVELS[ruleResult.level]
    return {
      ...ruleResult,
      mlUsed: false,
      hospitalLevel: hosp.level,
      hospitalLevelLabel: hosp.label,
      hospitalLevelDesc: hosp.desc,
    }
  }

  /**
   * Force refresh ML availability status
   */
  async refreshMlStatus(): Promise<boolean> {
    await this.checkMlAvailability()
    return this.mlAvailable === true
  }

  /**
   * Get current ML status
   */
  getMlStatus(): { available: boolean | null; enabled: boolean } {
    return {
      available: this.mlAvailable,
      enabled: this.useMl,
    }
  }
}

export const triageEngine = new TriageEngine()
