import ProspectFinder from './components/ProspectFinder'
import './App.css'

export default function App() {
  return (
    <div className="page page--app">
      <header className="app-bar">
        <div className="app-bar__inner">
          <a className="app-bar__brand" href="#top" aria-label="MacKnight Safety Solutions home">
            <span className="nav__mark" aria-hidden="true" />
            <span>
              <strong>MacKnight Safety Solutions</strong>
              <span className="app-bar__product">Sales Prospecting</span>
            </span>
          </a>
          <p className="app-bar__badge">Internal use</p>
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
