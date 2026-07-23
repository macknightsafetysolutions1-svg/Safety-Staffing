import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../auth/AuthContext'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetUrl, setResetUrl] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')
    setResetUrl('')
    setSubmitting(true)
    try {
      const data = await api<{ message: string; resetUrl?: string }>('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      })
      setMessage(data.message)
      if (data.resetUrl) setResetUrl(data.resetUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Password reset</p>
        <h1>Forgot password</h1>
        <p className="auth-card__lede">
          Enter your work email. We’ll send a reset link (or show one if email
          delivery isn’t configured yet).
        </p>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="form-success" role="status">
            {message}
          </p>
        ) : null}
        {resetUrl ? (
          <p className="form-success">
            Reset link (email not configured):{' '}
            <a href={resetUrl}>{resetUrl}</a>
          </p>
        ) : null}

        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>

        <p className="auth-card__footer">
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </div>
  )
}
