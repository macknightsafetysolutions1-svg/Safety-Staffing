import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { api, useAuth, type AuthUser } from '../auth/AuthContext'

type CreateForm = {
  name: string
  email: string
  role: 'admin' | 'sales'
  password: string
}

const INITIAL_CREATE: CreateForm = {
  name: '',
  email: '',
  role: 'sales',
  password: '',
}

export default function AdminPage() {
  const { user, loading, logout } = useAuth()
  const [users, setUsers] = useState<AuthUser[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [createForm, setCreateForm] = useState<CreateForm>(INITIAL_CREATE)
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    const data = await api<{ users: AuthUser[] }>('/api/admin/users')
    setUsers(data.users)
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'admin') return
    void loadUsers().catch((err: Error) => setError(err.message))
  }, [user, loadUsers])

  if (!loading && !user) return <Navigate to="/login" replace />
  if (!loading && user?.mustChangePassword) return <Navigate to="/change-password" replace />
  if (!loading && user && user.role !== 'admin') return <Navigate to="/" replace />

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    try {
      await api('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      setCreateForm(INITIAL_CREATE)
      setNotice(`Created ${createForm.email}. They must change the temporary password on first login.`)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create user.')
    }
  }

  async function patchUser(id: string, body: Record<string, unknown>, success: string) {
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      await api(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      })
      setNotice(success)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.')
    } finally {
      setBusyId(null)
    }
  }

  async function createResetLink(id: string, email: string) {
    setBusyId(id)
    setError('')
    setNotice('')
    try {
      const data = await api<{ resetUrl: string; delivered: boolean }>(
        `/api/admin/users/${id}/reset-link`,
        { method: 'POST' },
      )
      setNotice(
        data.delivered
          ? `Reset email sent to ${email}.`
          : `Reset link for ${email}: ${data.resetUrl}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create reset link.')
    } finally {
      setBusyId(null)
    }
  }

  async function adminSetPassword(id: string, email: string) {
    const password = window.prompt(`Temporary password for ${email} (min 10 chars):`)
    if (!password) return
    await patchUser(
      id,
      { password, mustChangePassword: true },
      `Password updated for ${email}. They must change it on next login.`,
    )
  }

  return (
    <div className="page page--app">
      <header className="app-bar">
        <div className="app-bar__inner">
          <Link className="app-bar__brand" to="/admin">
            <span className="nav__mark" aria-hidden="true" />
            <span>
              <strong>MacKnight Safety Solutions</strong>
              <span className="app-bar__product">Admin</span>
            </span>
          </Link>
          <div className="app-bar__actions">
            <Link className="nav__link" to="/">
              Prospecting
            </Link>
            <button type="button" className="btn btn--ghost btn--small" onClick={() => void logout()}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="app-intro">
          <p className="eyebrow">Administrator</p>
          <h1>Team access</h1>
          <p className="app-intro__lede">
            Signed in as <strong>{user?.email}</strong>. Create sales users, reset
            passwords, and control who can open the prospecting tool.
          </p>
        </section>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="form-success" role="status">
            {notice}
          </p>
        ) : null}

        <section className="admin-panel">
          <h2>Add team member</h2>
          <form className="admin-create" onSubmit={handleCreate}>
            <label className="field">
              <span>Name</span>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Role</span>
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    role: e.target.value === 'admin' ? 'admin' : 'sales',
                  }))
                }
              >
                <option value="sales">Sales</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="field">
              <span>Temporary password</span>
              <input
                type="text"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                minLength={10}
                required
              />
            </label>
            <div className="admin-create__submit">
              <button className="btn btn--primary" type="submit">
                Create user
              </button>
            </div>
          </form>
        </section>

        <section className="admin-panel">
          <h2>Users</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.name}
                      {row.mustChangePassword ? (
                        <span className="admin-pill">Must change password</span>
                      ) : null}
                    </td>
                    <td>{row.email}</td>
                    <td>{row.role}</td>
                    <td>{row.active ? 'Active' : 'Disabled'}</td>
                    <td className="admin-actions">
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === row.id}
                        onClick={() => void createResetLink(row.id, row.email)}
                      >
                        Reset link
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--small"
                        disabled={busyId === row.id}
                        onClick={() => void adminSetPassword(row.id, row.email)}
                      >
                        Set password
                      </button>
                      {row.role === 'sales' ? (
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void patchUser(row.id, { role: 'admin' }, `${row.email} is now admin.`)
                          }
                        >
                          Make admin
                        </button>
                      ) : row.email !== 'smonroe@macknightsafety.com' ? (
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void patchUser(row.id, { role: 'sales' }, `${row.email} is now sales.`)
                          }
                        >
                          Make sales
                        </button>
                      ) : null}
                      {row.email !== 'smonroe@macknightsafety.com' ? (
                        <button
                          type="button"
                          className="btn btn--ghost btn--small"
                          disabled={busyId === row.id}
                          onClick={() =>
                            void patchUser(
                              row.id,
                              { active: !row.active },
                              `${row.email} ${row.active ? 'disabled' : 'enabled'}.`,
                            )
                          }
                        >
                          {row.active ? 'Disable' : 'Enable'}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}
