import { Link, Navigate } from 'react-router-dom'
import ProspectFinder from '../components/ProspectFinder'
import { useAuth } from '../auth/AuthContext'

export default function ProspectingPage() {
  const { user, loading, logout } = useAuth()

  if (!loading && !user) return <Navigate to="/login" replace />
  if (!loading && user?.mustChangePassword) return <Navigate to="/change-password" replace />

  return (
    <div className="page page--app">
      <header className="app-bar">
        <div className="app-bar__inner">
          <Link className="app-bar__brand" to="/">
            <span className="nav__mark" aria-hidden="true" />
            <span>
              <strong>MacKnight Safety Solutions</strong>
              <span className="app-bar__product">Sales Prospecting</span>
            </span>
          </Link>
          <div className="app-bar__actions">
            <p className="app-bar__user">{user?.email}</p>
            {user?.role === 'admin' ? (
              <Link className="nav__link" to="/admin">
                Admin
              </Link>
            ) : null}
            <button type="button" className="btn btn--ghost btn--small" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="app-main">
        <section className="app-intro" aria-labelledby="app-heading">
          <p className="eyebrow">Territory intel</p>
          <h1 id="app-heading">Find jobsites that need safety staffing.</h1>
          <p className="app-intro__lede">
            Set a city or state and mileage radius. Results are ranked by need
            probability so your team can prioritize outreach and open
            conversations with the likely decision maker.
          </p>
          <ul className="app-intro__points">
            <li>Geo filter by city or state + miles</li>
            <li>Filter by industry — including data centers, fabs, EV/battery, and tech builds</li>
            <li>Ranked by probability of needing SSO / HSE coverage</li>
            <li>Decision maker, talk track, and pipeline status for sales</li>
          </ul>
        </section>

        <section className="app-tool" aria-label="Jobsite prospect finder">
          <ProspectFinder />
        </section>
      </main>

      <footer className="footer footer--app">
        <div className="footer__inner">
          <p>
            <strong>MacKnight Safety Solutions</strong> — internal sales tool.
            Demo site data; connect live permit / OSHA / CRM feeds for production.
          </p>
        </div>
      </footer>
    </div>
  )
}
