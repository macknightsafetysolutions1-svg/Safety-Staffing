import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ChangePasswordPage() {
  const { user, loading, changePassword } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && !user) return <Navigate to="/login" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('New passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      const next = await changePassword(currentPassword, newPassword)
      navigate(next.role === 'admin' ? '/admin' : '/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="eyebrow">Account security</p>
        <h1>{user?.mustChangePassword ? 'Set a new password' : 'Change password'}</h1>
        <p className="auth-card__lede">
          {user?.mustChangePassword
            ? 'Your temporary password must be changed before continuing.'
            : 'Update the password for your MacKnight account.'}
        </p>

        <label className="field">
          <span>Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>New password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={10}
          />
        </label>
        <label className="field">
          <span>Confirm new password</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={10}
          />
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </div>
  )
}
