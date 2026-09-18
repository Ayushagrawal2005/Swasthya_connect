/**
 * localize.ts — Smart text localization helpers for SwasthyaConnect
 *
 * Two strategies:
 *  1. Exact-match lookup  — known Indian proper nouns (patient names, villages,
 *     facility names, doctor names) are mapped to per-language transliterations.
 *  2. Condition keyword match — medical condition strings from the API/seed data
 *     are pattern-matched and returned in the UI language.
 *
 * For text that has no mapping we always fall back to the original English string
 * so nothing ever shows blank.
 */

import { type SupportedLanguage, translations } from './i18n'

// ─── Name / proper-noun lookup map ───────────────────────────────────────────
// Key = lowercase English canonical form  →  Value = TranslationKey in i18n.ts

const NAME_MAP: Record<string, keyof typeof translations> = {
  'meena patil':             'nameMeenaPatil',
  'ganesh wagh':             'nameGaneshWagh',
  'lata desai':              'nameLataDesai',
  'suresh kadam':            'nameSureshKadam',
  'radha pawar':             'nameRadhaPawar',
  'kavita shinde':           'nameKavitaShinde',
  'anm kavita shinde':       'nameKavitaShinde',
  'dr. ramesh patil':        'nameRameshPatil',
  'dr ramesh patil':         'nameRameshPatil',
  'ramesh patil':            'nameRameshPatil',
  'anjali kulkarni':         'nameAnjaleeKulkarni',
  'dr. priya desai':         'namePriyaDesai',
  'dr priya desai':          'namePriyaDesai',
  'priya desai':             'namePriyaDesai',
  'dr. s. kulkarni':         'nameSKulkarni',
  'dr s kulkarni':           'nameSKulkarni',
  // Fallback partial match handled in localizeProperNoun()
}

const VILLAGE_MAP: Record<string, keyof typeof translations> = {
  'mandav':                  'villageMandav',
  'mandav, beed district':   'villageMandav',
  'mandav, beed':            'villageMandav',
  'kirloskarwadi':           'villageKirloskarwadi',
  'tembhurni':               'villageTembhurni',
}

const FACILITY_MAP: Record<string, keyof typeof translations> = {
  'sub-centre mandav':       'facilitySubCentreMandav',
  'sub-center mandav':       'facilitySubCentreMandav',
  'sub centre mandav':       'facilitySubCentreMandav',
  'phc beed':                'facilityPHCBeed',
  'primary health centre beed': 'facilityPHCBeed',
  'rural hospital beed':     'facilityRuralHospitalBeed',
  'district hospital beed':  'facilityDistrictHospitalBeed',
}

const SPECIALTY_MAP: Record<string, keyof typeof translations> = {
  'community health':        'specCommunityHealth',
  'general medicine':        'specGeneralMedicine',
  'ob/gyn':                  'specOBGYN',
  'obstetrics':              'specOBGYN',
  'paediatrics':             'specPaediatrics',
  'pediatrics':              'specPaediatrics',
  'cardiology':              'specCardiology',
  'nephrology':              'specNephrology',
  'surgery':                 'specSurgery',
  'internal medicine':       'specInternalMedicine',
  'pulmonology':             'specPulmonology',
  'neurology':               'specNeurology',
  'orthopaedics':            'specOrthopaedics',
  'orthopedics':             'specOrthopaedics',
}

// ─── Condition keyword patterns ───────────────────────────────────────────────
// Each entry: [regex to test against condition string, TranslationKey]
const CONDITION_PATTERNS: [RegExp, keyof typeof translations][] = [
  [/hypertension/i,                  'condHypertension'],
  [/high\s*bp|high\s*blood\s*pressure/i, 'condHypertension'],
  [/type\s*2\s*diabet|diabetes/i,    'condDiabetes'],
  [/tuberculosis|tb\b|dots/i,        'condTB'],
  [/anaemia|anemia/i,                'condAnaemia'],
  [/iron.deficiency/i,               'condAnaemia'],
  [/chronic\s*kidney|ckd/i,          'condCKD'],
  [/copd/i,                          'condCOPD'],
  [/heart\s*disease|cardiac/i,       'condHeartDisease'],
  [/left\s*ventricular\s*hypertrophy|lvh/i, 'condLVH'],
  [/dyslipidaemia|dyslipidemia/i,    'condDyslipidaemia'],
  [/pregnancy|antenatal|anc|prenatal/i, 'condPregnancy'],
  [/malnutrition/i,                  'condMalnutrition'],
  [/fever/i,                         'condFever'],
]

// ─── Status / progression maps ────────────────────────────────────────────────
const STATUS_MAP: Record<string, keyof typeof translations> = {
  active:       'active',
  resolved:     'resolved',
  chronic:      'chronic',
  current:      'current',
  discontinued: 'discontinued',
  completed:    'completed',
  pending:      'pending',
  accepted:     'accepted',
  rejected:     'rejected',
  treated:      'treated',
  'in-transit': 'inTransit',
  stable:       'stable',
  improving:    'improving',
  worsening:    'worsening',
  critical:     'critical',
  overdue:      'overdue',
  'due-today':  'dueToday',
  upcoming:     'upcoming',
  urgent:       'urgent',
  routine:      'routine',
  emergency:    'emergency',
}

// ─── Tier map ─────────────────────────────────────────────────────────────────
const TIER_MAP: Record<string, keyof typeof translations> = {
  'sub-centre':     'tierSubCentre',
  'sub-center':     'tierSubCentre',
  phc:              'tierPHC',
  'rural-hospital': 'tierRuralHospital',
  district:         'tierDistrict',
}

// ─── Core lookup ──────────────────────────────────────────────────────────────
function lookup(
  key: keyof typeof translations,
  lang: SupportedLanguage,
): string {
  const entry = translations[key] as Record<SupportedLanguage, string>
  return entry[lang] ?? entry.en
}

// ─── Public helpers ───────────────────────────────────────────────────────────

/** Transliterate a patient/doctor/worker name into the current UI language. */
export function localizeName(name: string, lang: SupportedLanguage): string {
  if (!name) return name
  if (lang === 'en') return name
  const key = NAME_MAP[name.toLowerCase().trim()]
  if (key) return lookup(key, lang)
  // Partial match — find first entry whose canonical key is a substring
  const lower = name.toLowerCase().trim()
  for (const [canon, tkey] of Object.entries(NAME_MAP)) {
    if (lower.includes(canon) || canon.includes(lower)) return lookup(tkey, lang)
  }
  return name  // no mapping → keep original
}

/** Translate a village / locality name. */
export function localizeVillage(village: string, lang: SupportedLanguage): string {
  if (!village) return village
  if (lang === 'en') return village
  const key = VILLAGE_MAP[village.toLowerCase().trim()]
  if (key) return lookup(key, lang)
  // Partial
  const lower = village.toLowerCase()
  for (const [canon, tkey] of Object.entries(VILLAGE_MAP)) {
    if (lower.includes(canon.split(',')[0])) return lookup(tkey, lang)
  }
  return village
}

/** Translate a facility name. */
export function localizeFacility(name: string, lang: SupportedLanguage): string {
  if (!name) return name
  if (lang === 'en') return name
  const key = FACILITY_MAP[name.toLowerCase().trim()]
  if (key) return lookup(key, lang)
  const lower = name.toLowerCase()
  for (const [canon, tkey] of Object.entries(FACILITY_MAP)) {
    if (lower.includes(canon)) return lookup(tkey, lang)
  }
  return name
}

/** Translate a medical specialty. */
export function localizeSpecialty(spec: string, lang: SupportedLanguage): string {
  if (!spec) return spec
  if (lang === 'en') return spec
  const key = SPECIALTY_MAP[spec.toLowerCase().trim()]
  if (key) return lookup(key, lang)
  return spec
}

/**
 * Translate a medical condition string.
 * The condition may come from the API as a free-text string like
 * "Hypertension (Stage 2, chronic)" — we pattern-match and return
 * the localized label, keeping any parenthetical detail in English
 * since medical codes are internationally understood.
 */
export function localizeCondition(condition: string, lang: SupportedLanguage): string {
  if (!condition) return condition
  if (lang === 'en') return condition
  for (const [pattern, tkey] of CONDITION_PATTERNS) {
    if (pattern.test(condition)) {
      const translated = lookup(tkey, lang)
      // Preserve parenthetical detail from original if present
      const paren = condition.match(/\(([^)]+)\)/)
      return paren ? `${translated} (${paren[1]})` : translated
    }
  }
  return condition
}

/** Translate a status string (pending, accepted, chronic, etc.). */
export function localizeStatus(status: string, lang: SupportedLanguage): string {
  if (!status) return status
  if (lang === 'en') return status
  const key = STATUS_MAP[status.toLowerCase().trim()]
  if (key) return lookup(key, lang)
  return status
}

/** Translate a facility tier. */
export function localizeTier(tier: string, lang: SupportedLanguage): string {
  if (!tier) return tier
  if (lang === 'en') return tier
  const key = TIER_MAP[tier.toLowerCase().trim()]
  if (key) return lookup(key, lang)
  return tier
}

/**
 * Generic smart localizer — tries name → facility → village → condition → status
 * in order. Use this for unknown strings where you want best-effort translation.
 */
export function localizeAny(text: string, lang: SupportedLanguage): string {
  if (!text || lang === 'en') return text
  return (
    localizeName(text, lang) !== text     ? localizeName(text, lang)     :
    localizeFacility(text, lang) !== text ? localizeFacility(text, lang) :
    localizeVillage(text, lang) !== text  ? localizeVillage(text, lang)  :
    localizeCondition(text, lang) !== text? localizeCondition(text, lang):
    localizeStatus(text, lang) !== text   ? localizeStatus(text, lang)   :
    text
  )
}

/**
 * Convenience hook-like function — returns an object of localize helpers
 * pre-bound to the given language.
 */
export function createLocalizer(lang: SupportedLanguage) {
  return {
    name:      (s: string) => localizeName(s, lang),
    village:   (s: string) => localizeVillage(s, lang),
    facility:  (s: string) => localizeFacility(s, lang),
    specialty: (s: string) => localizeSpecialty(s, lang),
    condition: (s: string) => localizeCondition(s, lang),
    status:    (s: string) => localizeStatus(s, lang),
    tier:      (s: string) => localizeTier(s, lang),
    any:       (s: string) => localizeAny(s, lang),
    /** Localize an array of condition strings */
    conditions:(arr: string[]) => arr.map(c => localizeCondition(c, lang)),
  }
}
