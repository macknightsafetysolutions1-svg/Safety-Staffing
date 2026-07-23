import { useMemo, useState, type FormEvent } from 'react'
import { CITY_CENTROIDS, US_STATES } from '../data/prospects'
import {
  RADIUS_OPTIONS,
  searchProspects,
  type GeoMode,
  type RankedProspect,
  type SearchParams,
} from '../lib/geo'
import type { ContactedStore } from '../lib/contacted'

const CITY_OPTIONS = Object.values(CITY_CENTROIDS)
  .map((c) => c.label)
  .sort((a, b) => a.localeCompare(b))

function probabilityTier(score: number): { label: string; className: string } {
  if (score >= 80) return { label: 'Very high', className: 'tier tier--hot' }
  if (score >= 65) return { label: 'High', className: 'tier tier--high' }
  if (score >= 50) return { label: 'Moderate', className: 'tier tier--mid' }
  return { label: 'Lower', className: 'tier tier--low' }
}

function ProspectCard({
  prospect,
  rank,
  store,
}: {
  prospect: RankedProspect
  rank: number
  store: ContactedStore
}) {
  const [open, setOpen] = useState(rank < 3)
  const tier = probabilityTier(prospect.needProbability)
  const dm = prospect.primaryDecisionMaker
  const contacted = store.isContacted(prospect.id)

  return (
    <article className="prospect">
      <header className="prospect__header">
        <div className="prospect__rank" aria-hidden="true">
          {String(rank + 1).padStart(2, '0')}
        </div>
        <div className="prospect__title-block">
          <p className="prospect__company">{prospect.company}</p>
          <h3 className="prospect__site">{prospect.siteName}</h3>
          <p className="prospect__meta">
            {prospect.city}, {prospect.state}
            <span aria-hidden="true"> · </span>
            {prospect.distanceMiles} mi
            <span aria-hidden="true"> · </span>
            {prospect.industry}
            <span aria-hidden="true"> · </span>
            {prospect.phase}
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
          <p className="prospect__dm-label">Likely decision maker</p>
          <div className="prospect__dm-body">
            <div>
              <strong>{dm.name}</strong>
              <span>{dm.title}</span>
            </div>
            <div className="prospect__dm-conf">
              <span>{dm.decisionConfidence}% match confidence</span>
              <span className="prospect__dm-source">{dm.source}</span>
            </div>
          </div>
          <div className="prospect__dm-contact">
            {dm.email ? <a href={`mailto:${dm.email}`}>{dm.email}</a> : null}
            {dm.phone ? <a href={`tel:${dm.phone.replace(/\D/g, '')}`}>{dm.phone}</a> : null}
            {!dm.email && !dm.phone ? (
              <span className="muted">Contact via company switchboard</span>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="prospect__dm-empty">No stakeholder identified yet — enrich from CRM.</p>
      )}

      <div className="prospect__actions">
        <button
          type="button"
          className={contacted ? 'btn btn--done' : 'btn btn--primary'}
          onClick={() => store.markContacted(prospect)}
          disabled={contacted}
        >
          {contacted ? 'Contacted' : 'Mark as contacted'}
        </button>
        <button
          type="button"
          className="prospect__toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Hide ranking factors' : 'Why this rank'}
        </button>
      </div>

      {open ? (
        <div className="prospect__details">
          <ul className="prospect__reasons">
            {prospect.rankReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <div className="prospect__signals">
            <p className="prospect__dm-label">Site signals</p>
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

export default function ProspectFinder({ store }: { store: ContactedStore }) {
  const [mode, setMode] = useState<GeoMode>('city')
  const [city, setCity] = useState('Houston')
  const [state, setState] = useState('TX')
  const [radiusMiles, setRadiusMiles] = useState(50)
  const [query, setQuery] = useState<SearchParams | null>({
    mode: 'city',
    city: 'Houston',
    state: 'TX',
    radiusMiles: 50,
  })
  const [error, setError] = useState('')

  const { results, originLabel } = useMemo(() => {
    if (!query) return { results: [] as RankedProspect[], originLabel: '' }
    return searchProspects(query)
  }, [query])

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
      <div className="tool-head">
        <h1>Prospect search</h1>
        <p className="muted">
          Search a territory for active jobsites ranked by their probability of needing safety
          staffing. Mark the ones worth pursuing as contacted.
        </p>
      </div>
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
              Find sites
            </button>
          </div>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>

      {query && !error ? (
        <div className="finder__results" aria-live="polite">
          <div className="finder__summary">
            <p>
              <strong>{results.length}</strong> site{results.length === 1 ? '' : 's'} within{' '}
              <strong>{query.radiusMiles} mi</strong> of <strong>{originLabel}</strong>
            </p>
            <p className="muted">Ranked by probability of needing safety staffing.</p>
          </div>

          {results.length === 0 ? (
            <p className="finder__empty">
              No active sites in this radius. Widen mileage or try another city/state.
            </p>
          ) : (
            <div className="finder__list">
              {results.map((prospect, index) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  rank={index}
                  store={store}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
