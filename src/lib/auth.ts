import { useCallback, useEffect, useState } from 'react'
import { USERS } from '../data/users'

export type SessionUser = {
  username: string
  name: string
  title: string
}

export type AuthStore = {
  user: SessionUser | null
  login: (username: string, password: string) => { ok: boolean; error?: string }
  logout: () => void
}

const STORAGE_KEY = 'macknight-session'

function loadSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed &&
      typeof parsed === 'object' &&
      'username' in parsed &&
      'name' in parsed
    ) {
      return parsed as SessionUser
    }
    return null
  } catch {
    return null
  }
}

export function useAuth(): AuthStore {
  const [user, setUser] = useState<SessionUser | null>(() => loadSession())

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage unavailable (e.g. private mode) — keep in-memory only.
    }
  }, [user])

  const login = useCallback((username: string, password: string) => {
    const uname = username.trim().toLowerCase()
    const match = USERS.find((u) => u.username.toLowerCase() === uname && u.password === password)
    if (!match) {
      return { ok: false, error: 'Invalid username or password.' }
    }
    setUser({ username: match.username, name: match.name, title: match.title })
    return { ok: true }
  }, [])

  const logout = useCallback(() => setUser(null), [])

  return { user, login, logout }
}
