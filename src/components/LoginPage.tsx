import { useState, type FormEvent } from 'react'
import type { AuthStore } from '../lib/auth'

export default function LoginPage({ auth }: { auth: AuthStore }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    const result = auth.login(username, password)
    if (!result.ok) {
      setError(result.error ?? 'Sign in failed.')
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <div className="login__brand">
          <span className="app-bar__mark" aria-hidden="true" />
          <span>
            MacKnight <em>Safety Solutions</em>
          </span>
        </div>
        <h1 className="login__title">Sign in</h1>
        <p className="muted">Internal prospecting tool — sign in to continue.</p>

        <form className="login__form" onSubmit={submit} noValidate>
          <label className="field">
            <span>Username</span>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="dwhitfield"
              autoFocus
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}

          <button type="submit" className="btn btn--primary login__submit">
            Sign in
          </button>
        </form>

        <p className="login__hint muted">
          Demo accounts: <code>dwhitfield</code>, <code>mlee</code>, <code>jrivera</code> — password{' '}
          <code>safety123</code>
        </p>
      </div>
    </div>
  )
}
