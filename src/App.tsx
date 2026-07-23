import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import './App.css'

type FormState = {
  name: string
  company: string
  email: string
  phone: string
  roleNeeded: string
  timeline: string
  details: string
}

type StoredLead = FormState & { submittedAt: string }

const ROLES = [
  {
    title: 'Site Safety Officers',
    copy: 'Day-to-day hazard control, toolbox talks, and compliance on active jobsites.',
  },
  {
    title: 'HSE Managers',
    copy: 'Program leadership for multi-site operations, audits, and incident response.',
  },
  {
    title: 'Safety Coordinators',
    copy: 'Permits, training records, and contractor oversight that keeps crews moving.',
  },
  {
    title: 'Industrial Hygienists',
    copy: 'Air quality, exposure monitoring, and environmental controls for heavy industry.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Tell us the gap',
    copy: 'Share your site, trade, certifications needed, and when you need coverage.',
  },
  {
    num: '02',
    title: 'We match vetted talent',
    copy: 'Every candidate is screened for credentials, experience, and jobsite readiness.',
  },
  {
    num: '03',
    title: 'They show up ready',
    copy: 'Credential packets, onboarding support, and a dedicated staffing lead stay with you.',
  },
]

const INDUSTRIES = [
  'Heavy civil & infrastructure',
  'Oil, gas & energy',
  'Manufacturing & plants',
  'Commercial construction',
  'Warehousing & logistics',
  'Utilities & telecom',
]

const INITIAL_FORM: FormState = {
  name: '',
  company: '',
  email: '',
  phone: '',
  roleNeeded: '',
  timeline: '',
  details: '',
}

function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.18 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return ref as RefObject<T>
}

function LeadForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMsg('')

    if (!form.name.trim() || !form.company.trim() || !form.email.trim() || !form.roleNeeded) {
      setStatus('error')
      setErrorMsg('Please fill in your name, company, email, and the role you need.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatus('error')
      setErrorMsg('Enter a valid work email so we can follow up.')
      return
    }

    setStatus('submitting')

    // Demo lead capture — replace with your CRM / form endpoint.
    await new Promise((resolve) => setTimeout(resolve, 900))

    const leads = JSON.parse(localStorage.getItem('ridgeguard-leads') ?? '[]') as StoredLead[]
    leads.push({ ...form, submittedAt: new Date().toISOString() })
    localStorage.setItem('ridgeguard-leads', JSON.stringify(leads))

    setStatus('success')
    setForm(INITIAL_FORM)
  }

  if (status === 'success') {
    return (
      <div className="form-success" role="status">
        <p className="form-success__eyebrow">Request received</p>
        <h3>A staffing lead will contact you within one business day.</h3>
        <p>
          Keep an eye on your inbox—we’ll confirm your needs and send qualified
          candidate profiles.
        </p>
        <button type="button" className="btn btn--ghost" onClick={() => setStatus('idle')}>
          Submit another request
        </button>
      </div>
    )
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit} noValidate>
      <div className="lead-form__grid">
        <label className="field">
          <span>Full name</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Alex Rivera"
            required
          />
        </label>
        <label className="field">
          <span>Company</span>
          <input
            type="text"
            name="company"
            autoComplete="organization"
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
            placeholder="Northline Constructors"
            required
          />
        </label>
        <label className="field">
          <span>Work email</span>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            placeholder="alex@company.com"
            required
          />
        </label>
        <label className="field">
          <span>Phone</span>
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="(555) 012-3456"
          />
        </label>
        <label className="field">
          <span>Role needed</span>
          <select
            name="roleNeeded"
            value={form.roleNeeded}
            onChange={(e) => update('roleNeeded', e.target.value)}
            required
          >
            <option value="" disabled>
              Select a role
            </option>
            <option value="site-safety-officer">Site Safety Officer</option>
            <option value="hse-manager">HSE Manager</option>
            <option value="safety-coordinator">Safety Coordinator</option>
            <option value="industrial-hygienist">Industrial Hygienist</option>
            <option value="multiple">Multiple / project team</option>
            <option value="other">Other safety role</option>
          </select>
        </label>
        <label className="field">
          <span>Timeline</span>
          <select
            name="timeline"
            value={form.timeline}
            onChange={(e) => update('timeline', e.target.value)}
          >
            <option value="">When do you need coverage?</option>
            <option value="asap">ASAP / this week</option>
            <option value="2-weeks">Within 2 weeks</option>
            <option value="30-days">Within 30 days</option>
            <option value="planning">Planning ahead</option>
          </select>
        </label>
        <label className="field field--full">
          <span>Project details</span>
          <textarea
            name="details"
            rows={4}
            value={form.details}
            onChange={(e) => update('details', e.target.value)}
            placeholder="Site type, certifications required, shift schedule, location…"
          />
        </label>
      </div>

      {status === 'error' && errorMsg ? (
        <p className="form-error" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <div className="lead-form__footer">
        <button type="submit" className="btn btn--primary" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Sending…' : 'Request staffing'}
        </button>
        <p className="lead-form__note">No obligation. Typical response within one business day.</p>
      </div>
    </form>
  )
}

export default function App() {
  const rolesRef = useReveal<HTMLElement>()
  const processRef = useReveal<HTMLElement>()
  const formRef = useReveal<HTMLElement>()

  return (
    <div className="page">
      <header className="nav">
        <a className="nav__brand" href="#top" aria-label="Ridgeguard Safety Staffing home">
          <span className="nav__mark" aria-hidden="true" />
          Ridgeguard
        </a>
        <a className="nav__cta" href="#request">
          Request staffing
        </a>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-brand">
          <div className="hero__media" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2400&q=80"
              alt=""
              width={2400}
              height={1600}
            />
            <div className="hero__veil" />
          </div>

          <div className="hero__content">
            <p className="hero__brand" id="hero-brand">
              Ridgeguard Safety Staffing
            </p>
            <h1 className="hero__headline">
              Certified safety talent.
              <span> On site when you need them.</span>
            </h1>
            <p className="hero__lede">
              We place vetted safety officers, HSE managers, and coordinators on
              industrial and construction projects—so your crews stay protected
              and productive.
            </p>
            <div className="hero__actions">
              <a className="btn btn--primary" href="#request">
                Request staffing
              </a>
              <a className="btn btn--ghost" href="#roles">
                Roles we fill
              </a>
            </div>
          </div>
        </section>

        <section
          id="roles"
          className="section roles reveal"
          ref={rolesRef}
          aria-labelledby="roles-heading"
        >
          <div className="section__inner">
            <p className="eyebrow">What we staff</p>
            <h2 id="roles-heading">Safety professionals built for live jobsites.</h2>
            <p className="section__lede">
              Temporary, contract-to-hire, and project-based placements across
              high-risk environments.
            </p>
            <ul className="role-list">
              {ROLES.map((role) => (
                <li key={role.title}>
                  <h3>{role.title}</h3>
                  <p>{role.copy}</p>
                </li>
              ))}
            </ul>
            <div className="industries">
              <p className="industries__label">Industries we support</p>
              <ul>
                {INDUSTRIES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section
          className="section process reveal"
          ref={processRef}
          aria-labelledby="process-heading"
        >
          <div className="section__inner">
            <p className="eyebrow">How it works</p>
            <h2 id="process-heading">From open role to boots on the ground.</h2>
            <ol className="steps">
              {STEPS.map((step) => (
                <li key={step.num}>
                  <span className="steps__num" aria-hidden="true">
                    {step.num}
                  </span>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          id="request"
          className="section request reveal"
          ref={formRef}
          aria-labelledby="request-heading"
        >
          <div className="section__inner request__layout">
            <div className="request__copy">
              <p className="eyebrow">Lead request</p>
              <h2 id="request-heading">Tell us what your site needs.</h2>
              <p className="section__lede">
                Share a few details and a Ridgeguard staffing lead will match
                certified safety professionals to your timeline and credentials.
              </p>
              <ul className="request__points">
                <li>OSHA, CSP, CHST, and trade-specific screening</li>
                <li>Coverage for shutdowns, turnarounds, and surge work</li>
                <li>Nationwide network with local market knowledge</li>
              </ul>
            </div>
            <div className="request__form-shell">
              <LeadForm />
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <div className="footer__brand">
            <span className="nav__mark" aria-hidden="true" />
            <div>
              <strong>Ridgeguard Safety Staffing</strong>
              <p>Protecting people. Staffing the professionals who do it.</p>
            </div>
          </div>
          <div className="footer__meta">
            <a href="mailto:leads@ridgeguard.example">leads@ridgeguard.example</a>
            <a href="tel:+15550128000">(555) 012-8000</a>
            <p>© {new Date().getFullYear()} Ridgeguard Safety Staffing</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
