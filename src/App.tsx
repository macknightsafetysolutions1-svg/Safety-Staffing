import { useEffect, useState } from 'react'
import ProspectFinder from './components/ProspectFinder'
import ContactedPage from './components/ContactedPage'
import { useContacted } from './lib/contacted'
import { useUserName } from './lib/user'
import './App.css'

type Route = 'search' | 'contacted'

function parseHash(): Route {
  return window.location.hash.replace(/^#\/?/, '') === 'contacted' ? 'contacted' : 'search'
}

export default function App() {
  const store = useContacted()
  const [userName, setUserName] = useUserName()
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
        <div className="app-bar__right">
          <label className="app-user">
            <span className="app-user__label">You</span>
            <input
              className="app-user__input"
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              autoComplete="name"
              aria-label="Your name (signs the notes you add)"
            />
          </label>
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
        </div>
      </header>

      <main className="app-main">
        {route === 'search' ? (
          <ProspectFinder store={store} />
        ) : (
          <ContactedPage store={store} userName={userName} />
        )}
      </main>
    </div>
  )
}
