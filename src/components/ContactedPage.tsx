import { useState, type FormEvent } from 'react'
import type { ContactedProspect, ContactedStore } from '../lib/contacted'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function ContactedCard({ item, store }: { item: ContactedProspect; store: ContactedStore }) {
  const [note, setNote] = useState('')
  const dm = item.decisionMaker

  function submitNote(event: FormEvent) {
    event.preventDefault()
    if (!note.trim()) return
    store.addNote(item.id, note)
    setNote('')
  }

  return (
    <article className="contacted-card">
      <header className="contacted-card__head">
        <div>
          <p className="contacted-card__company">{item.company}</p>
          <h2 className="contacted-card__site">{item.siteName}</h2>
          <p className="contacted-card__meta">
            {item.city}, {item.state}
            <span aria-hidden="true"> · </span>
            {item.industry}
            <span aria-hidden="true"> · </span>
            {item.phase}
            <span aria-hidden="true"> · </span>
            {item.needProbability}% need
          </p>
        </div>
        <div className="contacted-card__stamp">
          <span className="contacted-card__stamp-label">Contacted</span>
          <time dateTime={item.contactedAt}>{formatDateTime(item.contactedAt)}</time>
        </div>
      </header>

      {dm ? (
        <p className="contacted-card__dm">
          <strong>{dm.name}</strong> — {dm.title}
          {dm.email ? (
            <>
              {' · '}
              <a href={`mailto:${dm.email}`}>{dm.email}</a>
            </>
          ) : null}
          {dm.phone ? (
            <>
              {' · '}
              <a href={`tel:${dm.phone.replace(/\D/g, '')}`}>{dm.phone}</a>
            </>
          ) : null}
        </p>
      ) : null}

      <div className="notes">
        <p className="notes__label">Notes</p>
        <form className="note-form" onSubmit={submitNote}>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note — call summary, next step, follow-up date…"
          />
          <button type="submit" className="btn btn--primary" disabled={!note.trim()}>
            Add note
          </button>
        </form>

        {item.notes.length === 0 ? (
          <p className="muted notes__empty">No notes yet.</p>
        ) : (
          <ul className="note-list">
            {item.notes.map((n) => (
              <li key={n.id} className="note">
                <div className="note__head">
                  <time className="note__date" dateTime={n.createdAt}>
                    {formatDateTime(n.createdAt)}
                  </time>
                  <button
                    type="button"
                    className="note__delete"
                    onClick={() => store.deleteNote(item.id, n.id)}
                    aria-label="Delete note"
                  >
                    Delete
                  </button>
                </div>
                <p className="note__text">{n.text}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="contacted-card__footer">
        <button
          type="button"
          className="link-btn"
          onClick={() => store.removeContacted(item.id)}
        >
          Remove from contacted
        </button>
      </div>
    </article>
  )
}

export default function ContactedPage({ store }: { store: ContactedStore }) {
  const { contacted } = store

  return (
    <div className="contacted">
      <div className="tool-head">
        <h1>Contacted prospects</h1>
        <p className="muted">
          {contacted.length === 0
            ? 'Prospects you mark as contacted will appear here.'
            : `${contacted.length} prospect${contacted.length === 1 ? '' : 's'} contacted. Add dated notes to track outreach.`}
        </p>
      </div>

      {contacted.length === 0 ? (
        <div className="contacted-empty">
          <p>Nothing here yet.</p>
          <a className="btn btn--primary" href="#/search">
            Go to search
          </a>
        </div>
      ) : (
        <div className="contacted-list">
          {contacted.map((item) => (
            <ContactedCard key={item.id} item={item} store={store} />
          ))}
        </div>
      )}
    </div>
  )
}
