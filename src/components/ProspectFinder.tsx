import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CITY_CENTROIDS, INDUSTRY_OPTIONS, US_STATES, type Industry } from '../data/prospects'
import {
  RADIUS_OPTIONS,
  searchProspects,
  type GeoMode,
  type RankedProspect,
  type SearchParams,
} from '../lib/geo'

const CITY_OPTIONS = Object.values(CITY_CENTROIDS)
  .map((c) => c.label)
  .sort((a, b) => a.localeCompare(b))

const PIPELINE_KEY = 'macknight-prospect-pipeline'

type PipelineStatus = 'new' | 'outreach' | 'spoke' | 'nurture' | 'closed'

type PipelineEntry = {
  status: PipelineStatus
  note: string
  updatedAt: string
}

type PipelineMap = Record<string, PipelineEntry>

function loadPipeline(): PipelineMap {
  try {
    return JSON.parse(localStorage.getItem(PIPELINE_KEY) ?? '{}') as PipelineMap
  } catch {
    return {}
  }
}

function savePipeline(map: PipelineMap) {
  localStorage.setItem(PIPELINE_KEY, JSON.stringify(map))
}

function probabilityTier(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Very high', className: 'tier tier--hot' }
  if (score >= 65) return { label: 'High', className: 'tier tier--high' }
  if (score >= 50) return { label: 'Moderate', className: 'tier tier--mid' }
  return { label: 'Lower', className: 'tier tier--low' }
}

function buildTalkTrack(prospect: RankedProspect): string {
  const dm = prospect.primaryDecisionMaker
  const greeting = dm ? `Hi ${dm.name.split(' ')[0]},` : 'Hi,'
  const gap = !prospect.hasDedicatedSafetyStaff
    ? 'I noticed there may not be dedicated safety coverage on the roster'
    : 'I saw the site is in a high-demand phase where surge safety coverage often helps'
  return `${greeting}

I'm with MacKnight Safety Solutions. We staff certified safety officers, HSE managers, and coordinators for active jobsites.

Looking at ${prospect.siteName} (${prospect.city}, ${prospect.state}) — ${prospect.phase.toLowerCase()}, ~${prospect.crewSize} on site — ${gap}. ${prospect.signals[0] ?? ''}

Would you be open to a quick call this week about short-term or project-based coverage?

Thanks,
MacKnight Safety Solutions`
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Fallback for restricted clipboard
      const area = document.createElement('textarea')
      area.value = text
      document.body.appendChild(area)
      area.select()
      document.execCommand('copy')
      document.body.removeChild(area)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <button type="button" className="btn btn--ghost btn--small" onClick={handleCopy}>
      {copied ? 'Copied' : label}
    </button>
  )
}

function ProspectCard({
  prospect,
  rank,
  pipeline,
  onPipelineChange,
}: {
  prospect: RankedProspect
  rank: number
  pipeline: PipelineEntry | undefined
  onPipelineChange: (id: string, entry: PipelineEntry) => void
}) {
  const [open, setOpen] = useState(rank < 2)
  const [showTalk, setShowTalk] = useState(false)
  const tier = probabilityTier(prospect.needProbability)
  const dm = prospect.primaryDecisionMaker
  const status = pipeline?.status ?? 'new'
  const talkTrack = useMemo(() => buildTalkTrack(prospect), [prospect])

  return (
    <article className={`prospect ${status !== 'new' ? 'prospect--touched' : ''}`}>
      <header className="prospect__header">
        <div className="prospect__rank" aria-hidden="true">
          {String(rank + 1).padStart(2, '0')}
        </div>
        <div className="prospect__title-block">
          <p className="prospect__company">{prospect.company}</p>
          <h3 className="prospect__site">{prospect.siteName}</h3>
          <p className="prospect__industry">
            <span className="prospect__industry-label">Industry</span>
            <span className="prospect__industry-value">{prospect.industry}</span>
          </p>
          <p className="prospect__meta">
            {prospect.city}, {prospect.state}
            <span aria-hidden="true"> · </span>
            {prospect.distanceMiles} mi
            <span aria-hidden="true"> · </span>
            {prospect.phase}
            <span aria-hidden="true"> · </span>
            ~{prospect.crewSize} on site
          </p>
        </div>
        <div className="prospect__score" title="Estimated probability this site needs safety staffing">
          <span className={tier.className}>{tier.label}</span>
          <strong>{prospect.needProbability}%</strong>
          <span className="prospect__score-label">need probability</span>
        </div>
      </header>

      {dm ? (
        <div className="prospect__dm">
          <p className="prospect__dm-label">Primary outreach target</p>
          <div className="prospect__dm-body">
            <div>
              <strong>{dm.name}</strong>
              <span>{dm.title}</span>
            </div>
            <div className="prospect__dm-conf">
              <span>{dm.decisionConfidence}% decision-maker confidence</span>
              <span className="prospect__dm-source">{dm.source}</span>
            </div>
          </div>
          <div className="prospect__dm-contact">
            {dm.email ? <a href={`mailto:${dm.email}?subject=${encodeURIComponent(`Safety coverage — ${prospect.siteName}`)}`}>{dm.email}</a> : null}
            {dm.phone ? <a href={`tel:${dm.phone.replace(/\D/g, '')}`}>{dm.phone}</a> : null}
            {!dm.email && !dm.phone ? (
              <span className="muted">No direct contact — try company switchboard</span>
            ) : null}
          </div>
          <div className="prospect__actions">
            {dm.email ? <CopyButton text={dm.email} label="Copy email" /> : null}
            {dm.phone ? <CopyButton text={dm.phone} label="Copy phone" /> : null}
            <CopyButton text={talkTrack} label="Copy talk track" />
            <button
              type="button"
              className="btn btn--ghost btn--small"
              onClick={() => setShowTalk((v) => !v)}
            >
              {showTalk ? 'Hide talk track' : 'View talk track'}
            </button>
          </div>
          {showTalk ? (
            <pre className="prospect__talk">{talkTrack}</pre>
          ) : null}
        </div>
      ) : (
        <p className="prospect__dm-empty">No stakeholder identified yet — enrich before outreach.</p>
      )}

      <div className="prospect__pipeline">
        <label className="field field--inline">
          <span>Pipeline</span>
          <select
            value={status}
            onChange={(e) =>
              onPipelineChange(prospect.id, {
                status: e.target.value as PipelineStatus,
                note: pipeline?.note ?? '',
                updatedAt: new Date().toISOString(),
              })
            }
          >
            <option value="new">New</option>
            <option value="outreach">Outreach sent</option>
            <option value="spoke">Spoke / meeting</option>
            <option value="nurture">Nurture</option>
            <option value="closed">Closed / not a fit</option>
          </select>
        </label>
        <label className="field field--grow">
          <span>Sales note</span>
          <input
            type="text"
            value={pipeline?.note ?? ''}
            placeholder="Left voicemail, asked for HSE lead…"
            onChange={(e) =>
              onPipelineChange(prospect.id, {
                status,
                note: e.target.value,
                updatedAt: new Date().toISOString(),
              })
            }
          />
        </label>
      </div>

      <button
        type="button"
        className="prospect__toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide ranking factors' : 'Why this rank'}
      </button>

      {open ? (
        <div className="prospect__details">
          <ul className="prospect__reasons">
            {prospect.rankReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <div className="prospect__signals">
            <p className="prospect__dm-label">Site signals for the call</p>
            <ul>
              {prospect.signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          {prospect.stakeholders.length > 1 ? (
            <div className="prospect__stakeholders">
              <p className="prospect__dm-label">Other stakeholders</p>
              <ul>
                {prospect.stakeholders
                  .filter((s) => s.name !== dm?.name)
                  .map((s) => (
                    <li key={s.name}>
                      <strong>{s.name}</strong> — {s.title} ({s.decisionConfidence}%)
                      {s.email ? ` · ${s.email}` : ''}
                      {s.phone ? ` · ${s.phone}` : ''}
                    </li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export default function ProspectFinder() {
  const [mode, setMode] = useState<GeoMode>('city')
  const [city, setCity] = useState('Houston')
  const [state, setState] = useState('TX')
  const [radiusMiles, setRadiusMiles] = useState(50)
  const [industry, setIndustry] = useState<Industry | ''>('')
  const [query, setQuery] = useState<SearchParams | null>({
    mode: 'city',
    city: 'Houston',
    state: 'TX',
    radiusMiles: 50,
    industry: '',
  })
  const [error, setError] = useState('')
  const [pipeline, setPipeline] = useState<PipelineMap>({})
  const [hideWorked, setHideWorked] = useState(false)

  useEffect(() => {
    setPipeline(loadPipeline())
  }, [])

  const applyIndustryFilter = (nextIndustry: Industry | '') => {
    setIndustry(nextIndustry)
    setQuery((prev) => (prev ? { ...prev, industry: nextIndustry } : prev))
  }

  const updatePipeline = (id: string, entry: PipelineEntry) => {
    setPipeline((prev) => {
      const next = { ...prev, [id]: entry }
      savePipeline(next)
      return next
    })
  }

  const { results, originLabel } = useMemo(() => {
    if (!query) return { results: [] as RankedProspect[], originLabel: '' }
    return searchProspects(query)
  }, [query])

  const visibleResults = useMemo(() => {
    if (!hideWorked) return results
    return results.filter((r) => {
      const status = pipeline[r.id]?.status ?? 'new'
      return status === 'new'
    })
  }, [results, hideWorked, pipeline])

  const workedCount = results.filter((r) => (pipeline[r.id]?.status ?? 'new') !== 'new').length

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (mode === 'city' && !city.trim()) {
      setError('Enter or select a city.')
      return
    }
    if (mode === 'state' && !state) {
      setError('Select a state.')
      return
    }

    const next: SearchParams = {
      mode,
      city: city.trim(),
      state,
      radiusMiles,
      industry,
    }
    const check = searchProspects(next)
    if (check.error) {
      setError(check.error)
      setQuery(null)
      return
    }
    setQuery(next)
  }

  return (
    <div className="finder">
      <form className="finder__form" onSubmit={handleSubmit}>
        <fieldset className="finder__mode">
          <legend className="sr-only">Search by city or state</legend>
          <label className={mode === 'city' ? 'is-active' : ''}>
            <input
              type="radio"
              name="geo-mode"
              value="city"
              checked={mode === 'city'}
              onChange={() => {
                setMode('city')
                if (radiusMiles > 100) setRadiusMiles(50)
              }}
            />
            City + mileage
          </label>
          <label className={mode === 'state' ? 'is-active' : ''}>
            <input
              type="radio"
              name="geo-mode"
              value="state"
              checked={mode === 'state'}
              onChange={() => {
                setMode('state')
                if (radiusMiles < 250) setRadiusMiles(400)
              }}
            />
            State + mileage
          </label>
        </fieldset>

        <div className="finder__fields">
          {mode === 'city' ? (
            <>
              <label className="field">
                <span>City</span>
                <input
                  list="city-options"
                  name="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Houston"
                  autoComplete="address-level2"
                />
                <datalist id="city-options">
                  {CITY_OPTIONS.map((label) => (
                    <option key={label} value={label.split(',')[0]} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                <span>State (optional)</span>
                <select name="state-hint" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Any</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="field">
              <span>State</span>
              <select name="state" value={state} onChange={(e) => setState(e.target.value)} required>
                <option value="" disabled>
                  Select state
                </option>
                {US_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="field">
            <span>Radius (miles)</span>
            <select
              name="radius"
              value={radiusMiles}
              onChange={(e) => setRadiusMiles(Number(e.target.value))}
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r} miles
                </option>
              ))}
            </select>
          </label>

          <div className="finder__submit">
            <button type="submit" className="btn btn--primary">
              Find jobsites
            </button>
          </div>
        </div>

        <fieldset className="finder__subfilter">
          <legend>Industry subfilter</legend>
          <p className="finder__subfilter-hint">
            Narrow the list by vertical. Chips update results immediately after a search.
          </p>
          <div className="finder__chips" role="group" aria-label="Industry">
            <button
              type="button"
              className={`chip ${industry === '' ? 'is-active' : ''}`}
              aria-pressed={industry === ''}
              onClick={() => applyIndustryFilter('')}
            >
              All industries
            </button>
            {INDUSTRY_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                className={`chip ${industry === item ? 'is-active' : ''}`}
                aria-pressed={industry === item}
                onClick={() => applyIndustryFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <label className="field field--subfilter-select">
            <span>Or select industry</span>
            <select
              name="industry"
              value={industry}
              onChange={(e) => applyIndustryFilter((e.target.value || '') as Industry | '')}
            >
              <option value="">All industries</option>
              {INDUSTRY_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {query && !error ? (
        <div className="finder__results" aria-live="polite">
          <div className="finder__summary">
            <div>
              <p>
                <strong>{visibleResults.length}</strong> jobsite
                {visibleResults.length === 1 ? '' : 's'} within{' '}
                <strong>{query.radiusMiles} mi</strong> of <strong>{originLabel}</strong>
                {query.industry ? (
                  <>
                    {' '}
                    in <strong>{query.industry}</strong>
                  </>
                ) : null}
                {hideWorked && workedCount > 0 ? (
                  <span className="muted"> · {workedCount} hidden (already worked)</span>
                ) : null}
              </p>
              <p className="muted">
                Ranked by probability they need safety staffing — highest first for outbound sales.
              </p>
            </div>
            <label className="finder__filter">
              <input
                type="checkbox"
                checked={hideWorked}
                onChange={(e) => setHideWorked(e.target.checked)}
              />
              Hide already-worked
            </label>
          </div>

          {visibleResults.length === 0 ? (
            <p className="finder__empty">
              {results.length === 0
                ? 'No active sites in this radius. Widen mileage or try another city/state.'
                : 'All sites in this territory are marked worked. Uncheck the filter to see them.'}
            </p>
          ) : (
            <div className="finder__list">
              {visibleResults.map((prospect, index) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  rank={index}
                  pipeline={pipeline[prospect.id]}
                  onPipelineChange={updatePipeline}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
