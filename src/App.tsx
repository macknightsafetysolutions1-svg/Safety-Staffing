import { useEffect, useState } from 'react'
import ProspectFinder from './components/ProspectFinder'
import ContactedPage from './components/ContactedPage'
import LoginPage from './components/LoginPage'
import { useContacted } from './lib/contacted'
import { useAuth } from './lib/auth'
import './App.css'

type Route = 'search' | 'contacted'

function parseHash(): Route {
  return window.location.hash.replace(/^#\/?/, '') === 'contacted' ? 'contacted' : 'search'
}

export default function App() {
  const auth = useAuth()
  const store = useContacted()
  const [route, setRoute] = useState<Route>(() => parseHash())

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (!auth.user) {
    return <LoginPage auth={auth} />
  }

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
          <div className="app-user">
            <span className="app-user__who">
              <span className="app-user__name">{auth.user.name}</span>
              <span className="app-user__title">{auth.user.title}</span>
            </span>
            <button type="button" className="app-user__logout" onClick={auth.logout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {route === 'search' ? (
          <ProspectFinder store={store} />
        ) : (
          <ContactedPage store={store} userName={auth.user.name} />
        )}
      </main>
    </div>
  )
}
