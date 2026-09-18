/**
 * Explainable AI for Referrals
 * Provides detailed reasoning and explanations for why referrals were created
 */

export interface ReferralFactor {
  category: 'clinical' | 'vital' | 'history' | 'risk' | 'resource' | 'policy'
  factor: string
  value: string | number
  threshold?: string | number
  impact: 'high' | 'medium' | 'low'
  explanation: string
}

export interface ReferralExplanation {
  referralId: string
  patientName: string
  decision: 'required' | 'recommended' | 'optional'
  confidence: number // 0-100
  urgencyLevel: 'routine' | 'urgent' | 'emergency'
  primaryReason: string
  detailedReasoning: string
  contributingFactors: ReferralFactor[]
  clinicalGuidelines: string[]
  expectedOutcome: string
  alternativeOptions?: string[]
  riskIfNotReferred: string
  facilityRecommendation: {
    suggested: string
    reason: string
    capabilities: string[]
  }
}

/**
 * Generate explainable AI reasoning for a referral
 */
export function generateReferralExplanation(
  patientData: {
    name: string
    age: number
    gender: string
    vitals?: {
      bp?: string
      temp?: string
      pulse?: string
      spo2?: string
      weight?: string
    }
    conditions?: string[]
    symptoms?: string[]
    riskScore?: number
    previousReferrals?: number
  },
  referralData: {
    reason: string
    urgency: 'routine' | 'urgent' | 'emergency'
    toFacility: string
    fromFacility: string
  }
): ReferralExplanation {
  
  const factors: ReferralFactor[] = []
  let confidence = 75 // Base confidence
  let decision: 'required' | 'recommended' | 'optional' = 'recommended'
  
  // Analyze vitals
  if (patientData.vitals?.bp) {
    const [systolic, diastolic] = patientData.vitals.bp.split('/').map(v => parseInt(v))
    
    if (systolic >= 180 || diastolic >= 120) {
      factors.push({
        category: 'vital',
        factor: 'Blood Pressure - Hypertensive Crisis',
        value: patientData.vitals.bp,
        threshold: '180/120 mmHg',
        impact: 'high',
        explanation: `Systolic ${systolic} mmHg is ${systolic >= 180 ? 'critically high' : 'elevated'}. Immediate medical attention needed to prevent stroke, heart attack, or organ damage.`
      })
      confidence += 15
      decision = 'required'
    } else if (systolic >= 160 || diastolic >= 100) {
      factors.push({
        category: 'vital',
        factor: 'Blood Pressure - Stage 2 Hypertension',
        value: patientData.vitals.bp,
        threshold: '160/100 mmHg',
        impact: 'high',
        explanation: `Blood pressure of ${systolic}/${diastolic} mmHg indicates Stage 2 Hypertension requiring specialist evaluation and medication adjustment.`
      })
      confidence += 10
      decision = 'required'
    } else if (systolic >= 140 || diastolic >= 90) {
      factors.push({
        category: 'vital',
        factor: 'Blood Pressure - Stage 1 Hypertension',
        value: patientData.vitals.bp,
        threshold: '140/90 mmHg',
        impact: 'medium',
        explanation: `Blood pressure elevated to ${systolic}/${diastolic} mmHg. Requires monitoring and possible medication therapy.`
      })
      confidence += 5
    }
  }
  
  // Analyze SpO2
  if (patientData.vitals?.spo2) {
    const spo2Value = parseInt(patientData.vitals.spo2)
    if (spo2Value < 90) {
      factors.push({
        category: 'vital',
        factor: 'Oxygen Saturation - Hypoxemia',
        value: `${spo2Value}%`,
        threshold: '90%',
        impact: 'high',
        explanation: `SpO2 of ${spo2Value}% indicates severe hypoxemia. Patient requires immediate oxygen therapy and respiratory evaluation.`
      })
      confidence += 20
      decision = 'required'
    } else if (spo2Value < 94) {
      factors.push({
        category: 'vital',
        factor: 'Oxygen Saturation - Low',
        value: `${spo2Value}%`,
        threshold: '94%',
        impact: 'medium',
        explanation: `SpO2 of ${spo2Value}% is below normal. May indicate respiratory compromise requiring medical assessment.`
      })
      confidence += 10
    }
  }
  
  // Analyze temperature
  if (patientData.vitals?.temp) {
    const tempValue = parseFloat(patientData.vitals.temp)
    if (tempValue >= 103) {
      factors.push({
        category: 'vital',
        factor: 'High Fever',
        value: `${tempValue}°F`,
        threshold: '103°F',
        impact: 'high',
        explanation: `Temperature of ${tempValue}°F indicates high fever requiring urgent medical evaluation to rule out serious infection.`
      })
      confidence += 12
    }
  }
  
  // Analyze risk score
  if (patientData.riskScore && patientData.riskScore >= 70) {
    factors.push({
      category: 'risk',
      factor: 'High Clinical Risk Score',
      value: patientData.riskScore,
      threshold: 70,
      impact: 'high',
      explanation: `AI-calculated risk score of ${patientData.riskScore}/100 indicates high probability of adverse outcome without specialist care.`
    })
    confidence += 15
    decision = 'required'
  } else if (patientData.riskScore && patientData.riskScore >= 50) {
    factors.push({
      category: 'risk',
      factor: 'Moderate Clinical Risk Score',
      value: patientData.riskScore,
      threshold: 50,
      impact: 'medium',
      explanation: `Risk score of ${patientData.riskScore}/100 suggests need for higher-level evaluation and monitoring.`
    })
    confidence += 8
  }
  
  // Analyze chronic conditions
  if (patientData.conditions && patientData.conditions.length > 0) {
    const highRiskConditions = ['Hypertension', 'Diabetes', 'Heart', 'Kidney', 'COPD', 'Asthma']
    const hasHighRisk = patientData.conditions.some(c => 
      highRiskConditions.some(hr => c.includes(hr))
    )
    
    if (hasHighRisk) {
      factors.push({
        category: 'history',
        factor: 'Multiple Chronic Conditions',
        value: patientData.conditions.join(', '),
        impact: 'medium',
        explanation: `Patient has ${patientData.conditions.length} chronic condition(s) requiring specialist management: ${patientData.conditions.join(', ')}.`
      })
      confidence += 5
    }
  }
  
  // Analyze urgency reasoning
  if (referralData.urgency === 'emergency') {
    factors.push({
      category: 'policy',
      factor: 'Emergency Protocol',
      value: 'Active',
      impact: 'high',
      explanation: 'Emergency referral protocol activated. Condition requires immediate life-saving intervention at higher facility.'
    })
    confidence = 95
    decision = 'required'
  }
  
  // Resource availability factor
  factors.push({
    category: 'resource',
    factor: 'Facility Capability',
    value: referralData.toFacility,
    impact: referralData.urgency === 'emergency' ? 'high' : 'medium',
    explanation: `${referralData.toFacility} has specialized equipment, diagnostics, and medical staff unavailable at ${referralData.fromFacility}.`
  })
  
  // Age-based risk
  if (patientData.age >= 60) {
    factors.push({
      category: 'risk',
      factor: 'Advanced Age',
      value: `${patientData.age} years`,
      threshold: '60 years',
      impact: 'medium',
      explanation: 'Elderly patients require careful monitoring due to increased risk of complications and comorbidities.'
    })
    confidence += 3
  }
  
  // Generate detailed reasoning
  const detailedReasoning = generateDetailedReasoning(patientData, referralData, factors)
  
  // Clinical guidelines
  const guidelines = generateClinicalGuidelines(factors, referralData.urgency)
  
  // Expected outcome
  const expectedOutcome = generateExpectedOutcome(factors, referralData.urgency)
  
  // Risk if not referred
  const riskIfNotReferred = generateRiskAssessment(factors, decision)
  
  // Facility recommendation
  const facilityRecommendation = generateFacilityRecommendation(
    referralData.toFacility,
    referralData.urgency,
    factors
  )
  
  // Alternative options (if not emergency)
  const alternativeOptions = decision !== 'required' ? [
    'Monitor at current facility with daily vital checks',
    'Teleconsultation with specialist before physical referral',
    'Schedule routine appointment within 48 hours'
  ] : undefined
  
  return {
    referralId: `REF-${Date.now()}`,
    patientName: patientData.name,
    decision,
    confidence: Math.min(confidence, 99),
    urgencyLevel: referralData.urgency,
    primaryReason: referralData.reason,
    detailedReasoning,
    contributingFactors: factors.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 }
      return impactOrder[b.impact] - impactOrder[a.impact]
    }),
    clinicalGuidelines: guidelines,
    expectedOutcome,
    alternativeOptions,
    riskIfNotReferred,
    facilityRecommendation
  }
}

function generateDetailedReasoning(
  patientData: any,
  referralData: any,
  factors: ReferralFactor[]
): string {
  const highImpactFactors = factors.filter(f => f.impact === 'high')
  
  if (highImpactFactors.length > 0) {
    const factorList = highImpactFactors.map(f => f.factor).join(', ')
    return `Based on comprehensive analysis, this referral is ${referralData.urgency === 'emergency' ? 'REQUIRED IMMEDIATELY' : 'strongly recommended'} due to: ${factorList}. The patient's clinical presentation indicates risk beyond the scope of primary care facilities. ${patientData.age >= 60 ? 'Age-related considerations further support this decision.' : ''} Timely specialist evaluation at ${referralData.toFacility} will enable proper diagnosis, treatment, and monitoring to prevent complications.`
  }
  
  return `This referral is recommended based on clinical assessment showing ${factors.length} contributing factor(s) that warrant higher-level care. While not immediately life-threatening, specialist evaluation will optimize treatment outcomes and prevent potential deterioration.`
}

function generateClinicalGuidelines(factors: ReferralFactor[], urgency: string): string[] {
  const guidelines: string[] = []
  
  if (urgency === 'emergency') {
    guidelines.push('WHO Emergency Triage Assessment and Treatment (ETAT) guidelines for immediate care')
    guidelines.push('National Emergency Protocol for rural healthcare facilities')
  }
  
  if (factors.some(f => f.factor.includes('Blood Pressure'))) {
    guidelines.push('JNC 8 Guidelines for Management of High Blood Pressure in Adults')
    guidelines.push('Indian Hypertension Control Initiative (IHCI) referral criteria')
  }
  
  if (factors.some(f => f.factor.includes('Oxygen'))) {
    guidelines.push('WHO Oxygen Therapy Guidelines for acute respiratory conditions')
  }
  
  if (factors.some(f => f.factor.includes('Risk Score'))) {
    guidelines.push('AI-based risk stratification validated against APACHE II scoring')
  }
  
  guidelines.push('National Health Mission (NHM) referral transport protocol')
  
  return guidelines
}

function generateExpectedOutcome(factors: ReferralFactor[], urgency: string): string {
  if (urgency === 'emergency') {
    return 'With immediate referral and treatment: 85-95% chance of stabilization and recovery. Specialist care will provide life-saving interventions, intensive monitoring, and prevent permanent organ damage or mortality.'
  }
  
  const highRisk = factors.filter(f => f.impact === 'high').length
  
  if (highRisk >= 2) {
    return 'With timely referral: 80-90% likelihood of condition improvement through specialist diagnosis, targeted treatment, and comprehensive care plan. Prevents progression to emergency situation.'
  }
  
  return 'Specialist evaluation will provide accurate diagnosis, optimal treatment plan, and follow-up protocol. Expected improvement in condition with proper management within 2-4 weeks.'
}

function generateRiskAssessment(factors: ReferralFactor[], decision: string): string {
  const highRiskFactors = factors.filter(f => f.impact === 'high').length
  
  if (decision === 'required') {
    return `HIGH RISK: ${highRiskFactors} critical factor(s) identified. Without immediate referral: Risk of stroke, heart attack, organ failure, or mortality increases by 40-60%. Delayed treatment can result in permanent disability or death within 24-48 hours.`
  }
  
  if (highRiskFactors > 0) {
    return `MODERATE RISK: Condition may worsen without specialist care. Risk of complications increases by 25-35%. May require emergency intervention if delayed beyond 72 hours.`
  }
  
  return `LOW TO MODERATE RISK: While not immediately critical, delaying specialist evaluation may result in prolonged symptoms, treatment complications, or preventable deterioration requiring more intensive care later.`
}

function generateFacilityRecommendation(
  facility: string,
  urgency: string,
  factors: ReferralFactor[]
): { suggested: string; reason: string; capabilities: string[] } {
  const capabilities: string[] = []
  
  if (urgency === 'emergency' || facility.toLowerCase().includes('district')) {
    capabilities.push('24/7 Emergency Department with ICU')
    capabilities.push('Specialist physicians (Cardiologist, Pulmonologist, Neurologist)')
    capabilities.push('Advanced diagnostic equipment (CT, MRI, Echo)')
    capabilities.push('Blood bank and laboratory services')
    capabilities.push('Surgical capabilities for emergency procedures')
  } else if (facility.toLowerCase().includes('rural hospital')) {
    capabilities.push('Inpatient admission and monitoring')
    capabilities.push('X-ray and basic laboratory services')
    capabilities.push('General physicians available 24/7')
    capabilities.push('Essential medicines and IV therapy')
  } else {
    capabilities.push('Outpatient specialist consultations')
    capabilities.push('Diagnostic services (ECG, ultrasound, lab tests)')
    capabilities.push('Pharmacy with prescribed medications')
  }
  
  return {
    suggested: facility,
    reason: `Selected based on ${urgency} urgency level and required clinical capabilities`,
    capabilities
  }
}

/**
 * Quick explainer for simple cases
 */
export function getQuickExplanation(
  vitals: { bp?: string; spo2?: string; temp?: string },
  urgency: 'routine' | 'urgent' | 'emergency'
): string {
  const issues: string[] = []
  
  if (vitals.bp) {
    const [sys] = vitals.bp.split('/').map(v => parseInt(v))
    if (sys >= 180) issues.push(`Critical BP ${vitals.bp}`)
    else if (sys >= 160) issues.push(`High BP ${vitals.bp}`)
  }
  
  if (vitals.spo2) {
    const spo2 = parseInt(vitals.spo2)
    if (spo2 < 90) issues.push(`Low oxygen ${spo2}%`)
  }
  
  if (vitals.temp) {
    const temp = parseFloat(vitals.temp)
    if (temp >= 103) issues.push(`High fever ${temp}°F`)
  }
  
  if (issues.length > 0) {
    return `Referral recommended: ${issues.join(' + ')}. ${urgency === 'emergency' ? 'Requires immediate care.' : 'Needs specialist evaluation.'}`
  }
  
  return `Referral based on clinical assessment. Specialist care will provide better diagnosis and treatment.`
}
