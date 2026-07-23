import { useCallback, useEffect, useState } from 'react'
import type { RankedProspect } from './geo'

export type ProspectNote = {
  id: string
  text: string
  createdAt: string
}

export type ContactedProspect = {
  id: string
  company: string
  siteName: string
  city: string
  state: string
  industry: string
  phase: string
  needProbability: number
  decisionMaker: { name: string; title: string; email?: string; phone?: string } | null
  contactedAt: string
  notes: ProspectNote[]
}

export type ContactedStore = {
  contacted: ContactedProspect[]
  isContacted: (id: string) => boolean
  markContacted: (prospect: RankedProspect) => void
  removeContacted: (id: string) => void
  addNote: (id: string, text: string) => void
  deleteNote: (id: string, noteId: string) => void
}

const STORAGE_KEY = 'macknight-contacted'

function loadContacted(): ContactedProspect[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as ContactedProspect[]) : []
  } catch {
    return []
  }
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function useContacted(): ContactedStore {
  const [contacted, setContacted] = useState<ContactedProspect[]>(() => loadContacted())

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacted))
    } catch {
      // Storage unavailable (e.g. private mode) — keep in-memory only.
    }
  }, [contacted])

  const isContacted = useCallback(
    (id: string) => contacted.some((c) => c.id === id),
    [contacted],
  )

  const markContacted = useCallback((prospect: RankedProspect) => {
    setContacted((prev) => {
      if (prev.some((c) => c.id === prospect.id)) return prev
      const dm = prospect.primaryDecisionMaker
      const entry: ContactedProspect = {
        id: prospect.id,
        company: prospect.company,
        siteName: prospect.siteName,
        city: prospect.city,
        state: prospect.state,
        industry: prospect.industry,
        phase: prospect.phase,
        needProbability: prospect.needProbability,
        decisionMaker: dm
          ? { name: dm.name, title: dm.title, email: dm.email, phone: dm.phone }
          : null,
        contactedAt: new Date().toISOString(),
        notes: [],
      }
      return [entry, ...prev]
    })
  }, [])

  const removeContacted = useCallback((id: string) => {
    setContacted((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addNote = useCallback((id: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setContacted((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              notes: [
                { id: makeId(), text: trimmed, createdAt: new Date().toISOString() },
                ...c.notes,
              ],
            }
          : c,
      ),
    )
  }, [])

  const deleteNote = useCallback((id: string, noteId: string) => {
    setContacted((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c,
      ),
    )
  }, [])

  return { contacted, isContacted, markContacted, removeContacted, addNote, deleteNote }
}
