import {
  CITY_CENTROIDS,
  PROSPECTS,
  STATE_CENTROIDS,
  type ProspectSite,
  type Stakeholder,
} from '../data/prospects'

const EARTH_RADIUS_MI = 3958.8

export type GeoMode = 'city' | 'state'

export type SearchParams = {
  mode: GeoMode
  city: string
  state: string
  radiusMiles: number
}

export type RankedProspect = ProspectSite & {
  distanceMiles: number
  needProbability: number
  rankReasons: string[]
  primaryDecisionMaker: Stakeholder | null
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/** Great-circle distance in miles (Haversine). */
export function distanceMiles(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function resolveOrigin(params: SearchParams): { lat: number; lng: number; label: string } | null {
  if (params.mode === 'city') {
    const raw = params.city.trim().toLowerCase()
    if (!raw) return null
    // Accept "Houston" or "Houston, TX"
    const key = raw.split(',')[0].trim()
    const hit = CITY_CENTROIDS[key]
    if (hit) {
      if (params.state && hit.state !== params.state.toUpperCase()) {
        // State hint disagrees — still use city coords if known
      }
      return { lat: hit.lat, lng: hit.lng, label: hit.label }
    }

    const fuzzy = Object.entries(CITY_CENTROIDS).find(
      ([k, v]) =>
        k.includes(key) ||
        key.includes(k) ||
        (params.state && v.state === params.state.toUpperCase() && k.startsWith(key.slice(0, 3))),
    )
    return fuzzy ? { lat: fuzzy[1].lat, lng: fuzzy[1].lng, label: fuzzy[1].label } : null
  }

  const state = params.state.trim().toUpperCase()
  if (!state) return null
  const centroid = STATE_CENTROIDS[state]
  if (!centroid) return null
  return { lat: centroid.lat, lng: centroid.lng, label: state }
}

/**
 * Need-probability model (0–100) for safety staffing demand.
 * Weighted signals: phase risk, crew size, missing SSO, incidents, permits, industry.
 */
export function scoreNeedProbability(site: ProspectSite): { score: number; reasons: string[] } {
  let score = 18
  const reasons: string[] = []

  const phaseWeights: Record<ProspectSite['phase'], number> = {
    Mobilization: 12,
    'Peak construction': 22,
    Turnaround: 26,
    'Steady operations': 6,
    Demobilizing: 4,
  }
  const phasePts = phaseWeights[site.phase]
  score += phasePts
  reasons.push(`${site.phase} phase (+${phasePts})`)

  if (site.crewSize >= 200) {
    score += 16
    reasons.push(`Large crew (${site.crewSize}) (+16)`)
  } else if (site.crewSize >= 100) {
    score += 12
    reasons.push(`Mid-large crew (${site.crewSize}) (+12)`)
  } else if (site.crewSize >= 50) {
    score += 7
    reasons.push(`Crew of ${site.crewSize} (+7)`)
  }

  if (!site.hasDedicatedSafetyStaff) {
    score += 18
    reasons.push('No dedicated safety staff on roster (+18)')
  } else {
    score += 4
    reasons.push('Has safety staff — surge/backfill likely (+4)')
  }

  if (site.recentIncidents > 0) {
    const pts = Math.min(14, site.recentIncidents * 5)
    score += pts
    reasons.push(`${site.recentIncidents} recent incident(s) (+${pts})`)
  }

  if (site.openPermits >= 5) {
    score += 10
    reasons.push(`High permit volume (${site.openPermits}) (+10)`)
  } else if (site.openPermits >= 2) {
    score += 5
    reasons.push(`Active permits (${site.openPermits}) (+5)`)
  }

  if (site.highRiskTrades) {
    score += 10
    reasons.push('High-risk trades on site (+10)')
  }

  const industryBoost: Partial<Record<ProspectSite['industry'], number>> = {
    'Oil & gas': 8,
    'Heavy civil': 6,
    Utilities: 5,
    'Commercial construction': 4,
  }
  const ind = industryBoost[site.industry] ?? 2
  score += ind
  reasons.push(`${site.industry} industry (+${ind})`)

  if (site.projectValueMm >= 80) {
    score += 6
    reasons.push(`Large project ($${site.projectValueMm}M) (+6)`)
  }

  return { score: Math.min(99, Math.round(score)), reasons }
}

export function primaryDecisionMaker(site: ProspectSite): Stakeholder | null {
  if (!site.stakeholders.length) return null
  return [...site.stakeholders].sort((a, b) => b.decisionConfidence - a.decisionConfidence)[0]
}

export function searchProspects(params: SearchParams): {
  results: RankedProspect[]
  originLabel: string
  error?: string
} {
  const origin = resolveOrigin(params)
  if (!origin) {
    return {
      results: [],
      originLabel: '',
      error:
        params.mode === 'city'
          ? 'Enter a supported city (try Houston, Dallas, Denver, Phoenix, Los Angeles…).'
          : 'Select a state to search.',
    }
  }

  const radius = Math.max(1, Math.min(500, params.radiusMiles || 50))
  const stateFilter = params.mode === 'state' ? params.state.toUpperCase() : null

  const results: RankedProspect[] = []

  for (const site of PROSPECTS) {
    if (stateFilter && site.state !== stateFilter) continue

    const dist = distanceMiles(origin.lat, origin.lng, site.lat, site.lng)
    if (dist > radius) continue

    const { score, reasons } = scoreNeedProbability(site)
    results.push({
      ...site,
      distanceMiles: Math.round(dist * 10) / 10,
      needProbability: score,
      rankReasons: reasons,
      primaryDecisionMaker: primaryDecisionMaker(site),
    })
  }

  results.sort((a, b) => {
    if (b.needProbability !== a.needProbability) return b.needProbability - a.needProbability
    return a.distanceMiles - b.distanceMiles
  })

  return { results, originLabel: origin.label }
}

export const RADIUS_OPTIONS = [10, 25, 50, 100, 150, 250, 400, 500] as const
