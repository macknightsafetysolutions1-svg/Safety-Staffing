import { useEffect, useState } from 'react'
import ProspectFinder from './components/ProspectFinder'
import ContactedPage from './components/ContactedPage'
import { useContacted } from './lib/contacted'
import './App.css'

type Route = 'search' | 'contacted'

function parseHash(): Route {
  return window.location.hash.replace(/^#\/?/, '') === 'contacted' ? 'contacted' : 'search'
}

export default function App() {
  const store = useContacted()
  const [route, setRoute] = useState<Route>(() => parseHash())

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const contactedCount = store.contacted.length

  return (
    <div className="app">
      <header className="app-bar">
        <a className="app-bar__brand" href="#/search">
          <span className="app-bar__mark" aria-hidden="true" />
          <span>
            MacKnight <em>Safety Solutions</em>
          </span>
        </a>
        <nav className="app-bar__tabs" aria-label="Primary">
          <a
            className={`app-tab ${route === 'search' ? 'is-active' : ''}`}
            href="#/search"
            aria-current={route === 'search' ? 'page' : undefined}
          >
            Search
          </a>
          <a
            className={`app-tab ${route === 'contacted' ? 'is-active' : ''}`}
            href="#/contacted"
            aria-current={route === 'contacted' ? 'page' : undefined}
          >
            Contacted
            {contactedCount > 0 ? (
              <span className="app-tab__badge">{contactedCount}</span>
            ) : null}
          </a>
        </nav>
      </header>

      <main className="app-main">
        {route === 'search' ? (
          <ProspectFinder store={store} />
        ) : (
          <ContactedPage store={store} />
        )}
      </main>
    </div>
  )
}
