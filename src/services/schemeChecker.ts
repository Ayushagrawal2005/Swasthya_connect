/**
 * Government Scheme Checker using Groq API
 * Fetches latest health schemes and checks eligibility based on user criteria
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface UserCriteria {
  annualIncome: number
  age: number
  gender: 'M' | 'F' | 'O'
  state: string
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS'
  hasDisability?: boolean
  isPregnant?: boolean
  hasChronic?: boolean
  familySize?: number
  isBPL?: boolean // Below Poverty Line
}

export interface HealthScheme {
  id: string
  name: string
  nameHindi?: string
  description: string
  category: 'health' | 'maternity' | 'child' | 'insurance' | 'nutrition' | 'disability'
  eligibility: {
    incomeLimit?: number
    ageRange?: { min: number; max: number }
    gender?: 'M' | 'F' | 'O' | 'All'
    states?: string[]
    categories?: string[]
    specialConditions?: string[]
  }
  benefits: string[]
  howToApply: string
  documents: string[]
  officialLink?: string
  isActive: boolean
  launchYear: number
}

// Comprehensive list of Indian Government Health Schemes
export const GOVERNMENT_SCHEMES: HealthScheme[] = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat PM-JAY',
    nameHindi: 'आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना',
    description: 'World\'s largest health insurance scheme providing ₹5 lakh coverage per family per year for secondary and tertiary care hospitalization',
    category: 'insurance',
    eligibility: {
      incomeLimit: 100000,
      categories: ['BPL', 'All'],
      specialConditions: ['Family must be in SECC 2011 database']
    },
    benefits: [
      'Free treatment up to ₹5 lakh per family per year',
      'Cashless hospitalization at empaneled hospitals',
      'Coverage for pre and post-hospitalization expenses',
      'Covers 1,393+ procedures including cancer, heart surgery, etc.'
    ],
    howToApply: 'Visit nearest Common Service Centre (CSC) or Ayushman Bharat PM-JAY empaneled hospital with Aadhaar',
    documents: ['Aadhaar Card', 'Ration Card', 'SECC Card', 'Voter ID'],
    officialLink: 'https://pmjay.gov.in',
    isActive: true,
    launchYear: 2018
  },
  {
    id: 'pmsby',
    name: 'PM Suraksha Bima Yojana',
    nameHindi: 'प्रधानमंत्री सुरक्षा बीमा योजना',
    description: 'Accident insurance scheme providing ₹2 lakh coverage for accidental death/disability at just ₹12 per year',
    category: 'insurance',
    eligibility: {
      ageRange: { min: 18, max: 70 },
      incomeLimit: 1000000
    },
    benefits: [
      '₹2 lakh for accidental death',
      '₹2 lakh for permanent total disability',
      '₹1 lakh for permanent partial disability',
      'Premium: Only ₹12 per year'
    ],
    howToApply: 'Apply through your bank account with auto-debit facility',
    documents: ['Bank Account', 'Aadhaar Card'],
    officialLink: 'https://jansuraksha.gov.in',
    isActive: true,
    launchYear: 2015
  },
  {
    id: 'pmssy',
    name: 'Pradhan Mantri Surakshit Matritva Abhiyan',
    nameHindi: 'प्रधानमंत्री सुरक्षित मातृत्व अभियान',
    description: 'Free comprehensive ANC checkup on 9th of every month for pregnant women',
    category: 'maternity',
    eligibility: {
      gender: 'F',
      specialConditions: ['Pregnant women in 2nd and 3rd trimester']
    },
    benefits: [
      'Free comprehensive health check-up',
      'Identification of high-risk pregnancies',
      'Free medicines and supplements',
      'Quality ANC by doctors/specialists'
    ],
    howToApply: 'Visit nearest government hospital/PHC on 9th of every month',
    documents: ['Aadhaar Card', 'Pregnancy Card'],
    officialLink: 'https://pmsma.nhp.gov.in',
    isActive: true,
    launchYear: 2016
  },
  {
    id: 'janani-suraksha',
    name: 'Janani Suraksha Yojana (JSY)',
    nameHindi: 'जननी सुरक्षा योजना',
    description: 'Cash assistance for pregnant women delivering in government facilities or accredited private institutions',
    category: 'maternity',
    eligibility: {
      gender: 'F',
      incomeLimit: 120000,
      specialConditions: ['BPL families', 'Pregnant women above 19 years']
    },
    benefits: [
      'Cash assistance: ₹1,400 (rural), ₹1,000 (urban) for institutional delivery',
      'Free delivery care',
      'ASHA incentive for facilitation',
      'Transport assistance'
    ],
    howToApply: 'Register at nearest Anganwadi or PHC during pregnancy',
    documents: ['Aadhaar Card', 'BPL Card', 'Bank Account', 'Pregnancy Registration'],
    officialLink: 'https://nhm.gov.in/index1.php?lang=1&level=3&sublinkid=841&lid=309',
    isActive: true,
    launchYear: 2005
  },
  {
    id: 'rbsk',
    name: 'Rashtriya Bal Swasthya Karyakram (RBSK)',
    nameHindi: 'राष्ट्रीय बाल स्वास्थ्य कार्यक्रम',
    description: 'Child health screening and early intervention services for children from birth to 18 years',
    category: 'child',
    eligibility: {
      ageRange: { min: 0, max: 18 },
      categories: ['All']
    },
    benefits: [
      'Free health screening for 4Ds: Defects at birth, Diseases, Deficiencies, Development delays',
      'Treatment for identified conditions',
      'Referral services',
      'Follow-up care'
    ],
    howToApply: 'Screening done at Anganwadi centers and schools',
    documents: ['Birth Certificate', 'Aadhaar Card (if available)'],
    officialLink: 'https://rbsk.gov.in',
    isActive: true,
    launchYear: 2013
  },
  {
    id: 'pmjjby',
    name: 'PM Jeevan Jyoti Bima Yojana',
    nameHindi: 'प्रधानमंत्री जीवन ज्योति बीमा योजना',
    description: 'Life insurance scheme providing ₹2 lakh coverage for death at premium of ₹330 per year',
    category: 'insurance',
    eligibility: {
      ageRange: { min: 18, max: 50 },
      incomeLimit: 1000000
    },
    benefits: [
      '₹2 lakh for death due to any reason',
      'Renewable yearly',
      'Premium: ₹330 per year',
      'Coverage till age 55'
    ],
    howToApply: 'Apply through your bank account with auto-debit',
    documents: ['Bank Account', 'Aadhaar Card', 'Consent Form'],
    officialLink: 'https://jansuraksha.gov.in',
    isActive: true,
    launchYear: 2015
  },
  {
    id: 'niramaya',
    name: 'Niramaya Health Insurance Scheme',
    nameHindi: 'निरामया स्वास्थ्य बीमा योजना',
    description: 'Health insurance for families living below poverty line covering major illnesses',
    category: 'insurance',
    eligibility: {
      incomeLimit: 50000,
      categories: ['BPL'],
      specialConditions: ['Must have BPL card']
    },
    benefits: [
      'Coverage up to ₹1.5 lakh per family',
      'Covers major illnesses and surgeries',
      'Cashless treatment',
      'Pre and post-hospitalization coverage'
    ],
    howToApply: 'Apply through district health office with BPL certificate',
    documents: ['BPL Card', 'Aadhaar Card', 'Income Certificate', 'Residence Proof'],
    officialLink: 'https://socialjustice.nic.in',
    isActive: true,
    launchYear: 2008
  },
  {
    id: 'deendayal',
    name: 'Deendayal Disabled Rehabilitation Scheme',
    nameHindi: 'दीनदयाल विकलांग पुनर्वास योजना',
    description: 'Financial assistance for rehabilitation of persons with disabilities',
    category: 'disability',
    eligibility: {
      specialConditions: ['Person with 40% or more disability'],
      incomeLimit: 200000
    },
    benefits: [
      'Financial assistance for rehabilitation',
      'Artificial limbs and aids',
      'Skill development training',
      'Employment assistance'
    ],
    howToApply: 'Apply through district social welfare office',
    documents: ['Disability Certificate', 'Income Certificate', 'Aadhaar Card', 'Bank Account'],
    officialLink: 'https://disabilityaffairs.gov.in',
    isActive: true,
    launchYear: 1999
  },
  {
    id: 'icds',
    name: 'Integrated Child Development Services (ICDS)',
    nameHindi: 'एकीकृत बाल विकास सेवाएं',
    description: 'Nutrition and health services for children under 6 years and pregnant/lactating mothers',
    category: 'nutrition',
    eligibility: {
      specialConditions: ['Children 0-6 years', 'Pregnant women', 'Lactating mothers'],
      categories: ['All']
    },
    benefits: [
      'Supplementary nutrition',
      'Immunization',
      'Health check-ups',
      'Referral services',
      'Pre-school education'
    ],
    howToApply: 'Register at nearest Anganwadi center',
    documents: ['Birth Certificate (for children)', 'Aadhaar Card', 'Residence Proof'],
    officialLink: 'https://icds-wcd.nic.in',
    isActive: true,
    launchYear: 1975
  },
  {
    id: 'pmuy',
    name: 'Pradhan Mantri Matru Vandana Yojana',
    nameHindi: 'प्रधानमंत्री मातृ वंदना योजना',
    description: 'Cash incentive of ₹5,000 for pregnant and lactating mothers for first living child',
    category: 'maternity',
    eligibility: {
      gender: 'F',
      specialConditions: ['Pregnant women', 'First living child', 'Age 19+'],
      categories: ['All']
    },
    benefits: [
      '₹5,000 cash in 3 installments',
      'Wage compensation for nutrition',
      'Promotes institutional delivery',
      'Encourages ANC registration'
    ],
    howToApply: 'Register at nearest Anganwadi or health facility',
    documents: ['Bank/Post Office Account', 'Aadhaar Card', 'MCP Card', 'Identity Proof'],
    officialLink: 'https://pmmvy.nic.in',
    isActive: true,
    launchYear: 2017
  }
]

/**
 * Use Groq AI to check eligibility and suggest relevant schemes
 */
export async function checkSchemeEligibilityWithAI(
  criteria: UserCriteria
): Promise<{
  eligibleSchemes: HealthScheme[]
  recommendations: string
  summary: string
}> {
  console.log('🔍 Groq API Key present:', !!GROQ_API_KEY)
  console.log('🔍 API Key length:', GROQ_API_KEY?.length)
  
  if (!GROQ_API_KEY) {
    console.warn('⚠️ No Groq API key - using rule-based matching')
    return checkSchemeEligibilityRuleBased(criteria)
  }

  console.log('🤖 Starting Groq AI eligibility check...')
  
  try {
    const prompt = `You are an expert on Indian Government Health Schemes. Analyze the user profile and return ONLY a valid JSON object with no additional text.

User Profile:
- Annual Income: ₹${criteria.annualIncome.toLocaleString('en-IN')}
- Age: ${criteria.age} years
- Gender: ${criteria.gender === 'M' ? 'Male' : criteria.gender === 'F' ? 'Female' : 'Other'}
- State: ${criteria.state}
- Category: ${criteria.category}
- Below Poverty Line: ${criteria.isBPL ? 'Yes' : 'No'}
${criteria.hasDisability ? '- Has Disability: Yes' : ''}
${criteria.isPregnant ? '- Pregnant: Yes' : ''}
${criteria.hasChronic ? '- Has Chronic Illness: Yes' : ''}
${criteria.familySize ? `- Family Size: ${criteria.familySize}` : ''}

Available Schemes:
${GOVERNMENT_SCHEMES.map(s => `- ID: ${s.id}, Name: ${s.name}, Income Limit: ${s.eligibility.incomeLimit || 'None'}, Age: ${s.eligibility.ageRange ? `${s.eligibility.ageRange.min}-${s.eligibility.ageRange.max}` : 'Any'}`).join('\n')}

Return this exact JSON structure:
{
  "eligibleSchemeIds": ["scheme_id_1", "scheme_id_2"],
  "recommendations": "Detailed 2-3 sentence explanation of why these schemes match the user profile",
  "summary": "You are eligible for X government health schemes with coverage of ₹Y lakh"
}

Return ONLY the JSON object, no other text.`

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b', // OpenAI model hosted on Groq
        response_format: { type: "json_object" }, // Force JSON output
        messages: [
          {
            role: 'system',
            content: 'You are an expert on Indian Government Health Schemes and welfare programs. Provide accurate, helpful eligibility information in valid JSON format only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Lower for more factual responses
        max_tokens: 1500
      })
    })

    console.log('📡 Groq API Response Status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Groq API error response:', errorText)
      throw new Error(`Groq API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    console.log('✅ Groq API response received:', data)
    
    const content = data.choices?.[0]?.message?.content || ''
    console.log('📄 AI Response content:', content)
    
    // Parse JSON - it should be clean JSON now with response_format
    let result
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      console.error('❌ JSON parse error, trying to extract:', parseError)
      // Fallback: try to extract JSON from text
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }
      result = JSON.parse(jsonMatch[0])
    }
    
    console.log('✅ Parsed AI result:', result)
    
    // Map scheme IDs to actual scheme objects
    const eligibleSchemes = GOVERNMENT_SCHEMES.filter(scheme =>
      result.eligibleSchemeIds?.includes(scheme.id)
    )

    console.log('✅ Eligible schemes found:', eligibleSchemes.length)

    return {
      eligibleSchemes,
      recommendations: result.recommendations || 'Based on your profile, we have identified several schemes you may be eligible for.',
      summary: result.summary || `You are eligible for ${eligibleSchemes.length} government health schemes.`
    }
  } catch (error) {
    console.error('❌ Groq API error, falling back to rule-based:', error)
    return checkSchemeEligibilityRuleBased(criteria)
  }
}

/**
 * Rule-based eligibility check (fallback when AI fails)
 */
function checkSchemeEligibilityRuleBased(criteria: UserCriteria): {
  eligibleSchemes: HealthScheme[]
  recommendations: string
  summary: string
} {
  const eligible = GOVERNMENT_SCHEMES.filter(scheme => {
    // Check income
    if (scheme.eligibility.incomeLimit && criteria.annualIncome > scheme.eligibility.incomeLimit) {
      return false
    }

    // Check age
    if (scheme.eligibility.ageRange) {
      if (criteria.age < scheme.eligibility.ageRange.min || criteria.age > scheme.eligibility.ageRange.max) {
        return false
      }
    }

    // Check gender
    if (scheme.eligibility.gender && scheme.eligibility.gender !== 'All' && scheme.eligibility.gender !== criteria.gender) {
      return false
    }

    // Check BPL requirement
    if (scheme.eligibility.categories?.includes('BPL') && !criteria.isBPL) {
      // If scheme is specifically for BPL, skip it
      if (scheme.eligibility.categories.length === 1 && scheme.eligibility.categories[0] === 'BPL') {
        return false
      }
    }

    // Check special conditions
    if (scheme.eligibility.specialConditions) {
      if (scheme.eligibility.specialConditions.some(cond => cond.includes('Pregnant')) && !criteria.isPregnant) {
        return false
      }
      if (scheme.eligibility.specialConditions.some(cond => cond.includes('disability')) && !criteria.hasDisability) {
        return false
      }
    }

    return scheme.isActive
  })

  // Calculate total coverage from schemes
  let totalCoverage = 0
  eligible.forEach(scheme => {
    // Look for coverage amounts in benefits
    const benefitText = scheme.benefits.join(' ')
    const lakhMatch = benefitText.match(/₹([\d.]+)\s*lakh/i)
    if (lakhMatch) {
      totalCoverage += parseFloat(lakhMatch[1]) * 100000
    } else {
      // Try to find amounts in thousands/regular format
      const amountMatch = benefitText.match(/₹([\d,]+)/)
      if (amountMatch) {
        const amount = parseInt(amountMatch[1].replace(/,/g, ''))
        // Only add if it's a reasonable coverage amount (> 10000)
        if (amount > 10000) {
          totalCoverage += amount
        }
      }
    }
  })

  const coverageText = totalCoverage > 0 
    ? ` with potential coverage of ₹${(totalCoverage / 100000).toFixed(1)} lakh`
    : ''

  return {
    eligibleSchemes: eligible,
    recommendations: generateRecommendations(eligible, criteria),
    summary: `You are eligible for ${eligible.length} government health scheme${eligible.length !== 1 ? 's' : ''}${coverageText}`
  }
}

function generateRecommendations(schemes: HealthScheme[], criteria: UserCriteria): string {
  let recs: string[] = []

  if (criteria.annualIncome <= 100000) {
    recs.push('Your income qualifies you for Ayushman Bharat PM-JAY, which provides up to ₹5 lakh health coverage per year.')
  }

  if (criteria.isPregnant) {
    recs.push('As a pregnant woman, you should immediately enroll in Janani Suraksha Yojana and PMSMA for comprehensive maternal care and cash benefits.')
  }

  if (criteria.age < 18) {
    recs.push('RBSK provides free health screening and treatment for children. Ensure regular check-ups at your nearest Anganwadi.')
  }

  if (criteria.hasDisability) {
    recs.push('The Deendayal Disabled Rehabilitation Scheme can help with artificial aids, skill development, and employment assistance.')
  }

  if (recs.length === 0) {
    recs.push('Consider enrolling in insurance schemes like PM-JAY for comprehensive health coverage.')
  }

  return recs.join(' ')
}

/**
 * Get scheme details by ID
 */
export function getSchemeById(id: string): HealthScheme | undefined {
  return GOVERNMENT_SCHEMES.find(s => s.id === id)
}

/**
 * Search schemes by keyword
 */
export function searchSchemes(query: string): HealthScheme[] {
  const lowerQuery = query.toLowerCase()
  return GOVERNMENT_SCHEMES.filter(scheme =>
    scheme.name.toLowerCase().includes(lowerQuery) ||
    scheme.nameHindi?.includes(query) ||
    scheme.description.toLowerCase().includes(lowerQuery) ||
    scheme.category.includes(lowerQuery)
  )
}
