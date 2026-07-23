import { useEffect, useState } from 'react'

const STORAGE_KEY = 'macknight-user'

function loadUserName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

export function useUserName(): [string, (name: string) => void] {
  const [userName, setUserName] = useState<string>(() => loadUserName())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, userName)
    } catch {
      // Storage unavailable (e.g. private mode) — keep in-memory only.
    }
  }, [userName])

  return [userName, setUserName]
}
