'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createFolder,
  createNote,
  deleteNote,
  moveNote,
  setNoteProjects,
  togglePin,
  updateNote,
} from '../../notes-actions'
import { noteSnippet, renderMarkdown } from './markdown'
import { NotesTree, buildTree, flatFolderOptions } from './notes-tree'
import type { Note, NotesData } from './types'
import './notes.css'

type FolderSel = 'all' | 'pinned' | string
type Mode = 'edit' | 'preview'

function relativeTime(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return ''
  const diff = Date.now() - t
  const m = Math.round(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.round(h / 24)
  if (d === 1) return 'yesterday'
  if (d < 7) return `${d}d`
  return new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/** Toggle the idx-th `- [ ]` / `- [x]` checklist line in a markdown body. */
function toggleChecklist(body: string, idx: number): string {
  const re = /^(\s*[-*]\s+\[)([ xX])(\]\s+)/
  let seen = -1
  return body
    .split('\n')
    .map((line) => {
      if (!re.test(line)) return line
      seen += 1
      if (seen !== idx) return line
      return line.replace(re, (_m, a, mark, c) => `${a}${mark === ' ' ? 'x' : ' '}${c}`)
    })
    .join('\n')
}

const ICON = {
  search: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>,
  all: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 19.5V6a2 2 0 0 1 2-2h6l2 3h6" /></svg>,
  pin: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 12V4l7 3 7-3v8" /><path d="M12 7v14" /></svg>,
  pinFill: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 12V4l7 3 7-3v8z" /></svg>,
  folder: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  caret: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 6l6 6-6 6z" /></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14" /></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>,
}

export function NotesApp({ data }: { data: NotesData }) {
  const router = useRouter()
  const { isDemo } = data
  const tree = useMemo(() => buildTree(data.folders), [data.folders])
  const folderOptions = useMemo(() => flatFolderOptions(tree), [tree])
  const folderById = useMemo(() => new Map(data.folders.map((f) => [f.id, f])), [data.folders])
  const projectById = useMemo(() => new Map(data.projects.map((p) => [p.id, p])), [data.projects])

  const [folderSel, setFolderSel] = useState<FolderSel>('all')
  const [noteId, setNoteId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<Mode>('preview')
  const [draft, setDraft] = useState({ title: '', body: '' })
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [tagOpen, setTagOpen] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previewRef = useRef<HTMLDivElement | null>(null)
  const pendingRef = useRef<{ id: string; title: string; body: string } | null>(null)
  const mountedRef = useRef(true)

  const selected: Note | null = useMemo(() => data.notes.find((n) => n.id === noteId) ?? null, [data.notes, noteId])
  const previewHtml = useMemo(() => renderMarkdown(draft.body) || '<p style="color:var(--dim)">Nothing written yet.</p>', [draft.body])

  // Seed the editor from the selected note, keyed on its IDENTITY only. A background
  // router.refresh() returns a fresh note object with the SAME id — that must never
  // clobber an in-progress draft, so we re-seed only when the id actually changes
  // (i.e. switching notes). Committing the previous note's pending edits happens in
  // selectNote(), BEFORE the id changes — so there is no stale-read race here. This is
  // the fix for the title-bleed bug (edits appearing to vanish / cross between notes).
  useEffect(() => {
    setStatus('idle')
    setDraft(selected ? { title: selected.title, body: selected.body } : { title: '', body: '' })
  }, [selected?.id])

  // Flush on unmount / tab-hide so edits inside the debounce window are never lost.
  useEffect(() => {
    mountedRef.current = true
    const onLeave = () => {
      const p = pendingRef.current
      if (p && !isDemo) void updateNote(p.id, { title: p.title, body: p.body })
    }
    window.addEventListener('pagehide', onLeave)
    return () => {
      mountedRef.current = false
      window.removeEventListener('pagehide', onLeave)
      if (saveTimer.current) clearTimeout(saveTimer.current)
      onLeave()
    }
  }, [isDemo])

  const notes = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = data.notes
    if (folderSel === 'pinned') list = list.filter((n) => n.pinned)
    else if (folderSel !== 'all') list = list.filter((n) => n.folderId === folderSel)
    if (q) list = list.filter((n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q))
    return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
  }, [data.notes, folderSel, query])

  // Always show something in the editor: if nothing is open, open the first note.
  useEffect(() => {
    if (!noteId && notes.length) setNoteId(notes[0]?.id ?? null)
  }, [notes, noteId])

  const flushSave = useCallback(
    async (id: string, patch: { title: string; body: string }) => {
      if (isDemo) return
      pendingRef.current = null
      setStatus('saving')
      try {
        await updateNote(id, patch)
        if (mountedRef.current) setStatus('saved')
        router.refresh()
      } catch {
        if (mountedRef.current) setStatus('idle')
      }
    },
    [isDemo, router],
  )

  // Switch the open note, committing the CURRENT note's pending edits first so nothing
  // is lost and no stale draft bleeds into the next note. All user-initiated switches
  // go through here (card click, new note).
  const selectNote = useCallback(
    (nextId: string | null) => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
      const p = pendingRef.current
      if (p && p.id !== nextId && !isDemo) void flushSave(p.id, { title: p.title, body: p.body })
      setNoteId(nextId)
    },
    [isDemo, flushSave],
  )

  const onEdit = useCallback(
    (patch: Partial<{ title: string; body: string }>) => {
      if (!noteId || isDemo) return
      const next = { ...draft, ...patch }
      setDraft(next)
      pendingRef.current = { id: noteId, ...next }
      setStatus('saving')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => {
        const p = pendingRef.current
        if (p) void flushSave(p.id, { title: p.title, body: p.body })
      }, 650)
    },
    [draft, noteId, isDemo, flushSave],
  )

  const folderTitle =
    folderSel === 'all' ? 'All notes' : folderSel === 'pinned' ? 'Pinned' : (folderById.get(folderSel)?.name ?? 'Notes')

  function folderPathParts(id: string | null): string[] {
    const out: string[] = []
    let cur = id ? folderById.get(id) : undefined
    let guard = 0
    while (cur && guard++ < 20) {
      out.unshift(cur.name)
      cur = cur.parentId ? folderById.get(cur.parentId) : undefined
    }
    return out
  }

  async function onNewNote() {
    if (isDemo) return
    const target = folderSel === 'all' || folderSel === 'pinned' ? null : folderSel
    const id = await createNote(target).catch(() => '')
    if (!id) return
    selectNote(id)
    setMode('edit')
    router.refresh()
  }

  async function onNewFolder() {
    if (isDemo) return
    const name = window.prompt('Folder name')?.trim()
    if (!name) return
    const parent = folderSel === 'all' || folderSel === 'pinned' ? null : folderSel
    await createFolder(name, parent).catch(() => undefined)
    router.refresh()
  }

  return (
    <div className="wn-root">
      <div className="wn-app">
        {/* Sidebar */}
        <aside className="wn-side">
          <div className="wn-brand"><span className="wn-brand__dot" /><span className="wn-brand__name">DS2 · Notes</span></div>
          <label className="wn-search">
            {ICON.search}
            <input type="search" placeholder="Search notes…" aria-label="Search notes" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="wn-actions">
            <button type="button" className="wn-btn wn-btn--primary" onClick={onNewNote} disabled={isDemo}>＋ Note</button>
            <button type="button" className="wn-btn" onClick={onNewFolder} disabled={isDemo}>＋ Folder</button>
          </div>
          <nav className="wn-tree" aria-label="Notes navigation">
            <button type="button" className={`wn-row ${folderSel === 'all' ? 'is-active' : ''}`} onClick={() => setFolderSel('all')}>
              <span className="wn-spacer" /><span className="wn-row__ic">{ICON.all}</span>All notes<span className="wn-row__count">{data.notes.length}</span>
            </button>
            <button type="button" className={`wn-row ${folderSel === 'pinned' ? 'is-active' : ''}`} onClick={() => setFolderSel('pinned')}>
              <span className="wn-spacer" /><span className="wn-row__ic">{ICON.pin}</span>Pinned<span className="wn-row__count">{data.notes.filter((n) => n.pinned).length || ''}</span>
            </button>
            <NotesTree
              tree={tree}
              notes={data.notes}
              activeId={folderSel}
              isDemo={isDemo}
              onSelectFolder={setFolderSel}
              onChanged={() => router.refresh()}
            />
          </nav>
        </aside>

        {/* Note list */}
        <section className="wn-list">
          <div className="wn-list__head"><span className="wn-list__title">{folderTitle}</span><span className="wn-list__sub">{notes.length} NOTE{notes.length === 1 ? '' : 'S'}</span></div>
          <div className="wn-cards">
            {notes.length === 0 ? (
              <p className="wn-list-empty">No notes here yet.{!isDemo ? ' Press ＋ Note to start.' : ''}</p>
            ) : (
              notes.map((n) => (
                <button type="button" key={n.id} className={`wn-card ${n.id === noteId ? 'is-active' : ''}`} onClick={() => { selectNote(n.id); setMode('preview') }}>
                  <div className="wn-card__top">
                    {n.pinned ? <span className="wn-card__pin">{ICON.pinFill}</span> : null}
                    <span className="wn-card__title">{n.title || 'Untitled'}</span>
                  </div>
                  {noteSnippet(n.body) ? <p className="wn-card__snip">{noteSnippet(n.body)}</p> : null}
                  <div className="wn-card__meta">
                    {n.projectIds.map((pid) => {
                      const p = projectById.get(pid)
                      if (!p) return null
                      return <span key={pid} className={`wn-chip ${p.status === 'lead' ? 'wn-chip--lead' : ''}`} aria-label={p.status === 'lead' ? `${p.name}, lead` : undefined}>{p.name}</span>
                    })}
                    <span className="wn-card__time">{relativeTime(n.updatedAt)}{n.updatedByName ? ` · ${n.updatedByName}` : ''}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Editor */}
        <section className="wn-editor">
          {!selected ? (
            <div className="wn-empty">
              <p className="wn-empty__title">Nothing open</p>
              <p className="wn-empty__sub">Pick a note from the list{!isDemo ? ', or press ＋ Note to write a new one' : ''}.</p>
            </div>
          ) : (
            <>
              <div className="wn-bar">
                <span className="wn-crumb">
                  {(() => {
                    const parts = folderPathParts(selected.folderId)
                    if (!parts.length) return <b>All notes</b>
                    return parts.map((seg, i) =>
                      i === parts.length - 1 ? <b key={i}>{seg}</b> : <span key={i}>{seg}&nbsp;/&nbsp;</span>,
                    )
                  })()}
                </span>
                <span className={`wn-saved ${status === 'saving' ? 'is-saving' : ''}`} role="status" aria-live="polite">
                  {status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : ''}
                </span>
                <div className="wn-seg" role="tablist" aria-label="View mode">
                  <button type="button" role="tab" id="wn-tab-edit" aria-selected={mode === 'edit'} aria-controls="wn-panel" className={mode === 'edit' ? 'is-on' : ''} onClick={() => setMode('edit')}>Edit</button>
                  <button type="button" role="tab" id="wn-tab-preview" aria-selected={mode === 'preview'} aria-controls="wn-panel" className={mode === 'preview' ? 'is-on' : ''} onClick={() => setMode('preview')}>Preview</button>
                </div>
                {!isDemo ? (
                  <label className="wn-move">
                    <span className="wn-move__label">Folder</span>
                    <select
                      className="wn-move__select"
                      aria-label="Move note to folder"
                      value={selected.folderId ?? ''}
                      onChange={(e) => { const dest = e.target.value || null; void moveNote(selected.id, dest).then(() => router.refresh()) }}
                    >
                      <option value="">No folder</option>
                      {folderOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <button type="button" className={`wn-iconbtn ${selected.pinned ? 'is-on' : ''}`} aria-label={selected.pinned ? 'Unpin note' : 'Pin note'} disabled={isDemo} onClick={() => void togglePin(selected.id, !selected.pinned).then(() => router.refresh())}>{ICON.pin}</button>
                <button type="button" className="wn-iconbtn wn-iconbtn--danger" aria-label="Delete note" disabled={isDemo} onClick={() => { if (window.confirm('Delete this note?')) void deleteNote(selected.id).then(() => { setNoteId(null); router.refresh() }) }}>{ICON.trash}</button>
              </div>

              <header className="wn-hero"><div className="wn-hero__in">
                {selected.projectIds.length ? (
                  <div className="wn-hero__id">
                    {selected.projectIds.map((pid) => {
                      const p = projectById.get(pid)
                      if (!p) return null
                      return <span key={pid} className={`wn-chip ${p.status === 'lead' ? 'wn-chip--lead' : ''}`} aria-label={p.status === 'lead' ? `${p.name}, lead` : undefined}>{p.name}</span>
                    })}
                  </div>
                ) : null}
                <input className="wn-title-input" value={draft.title} placeholder="Untitled" aria-label="Note title" readOnly={isDemo} onChange={(e) => onEdit({ title: e.target.value })} />
                <p className="wn-byline">Edited <b>{relativeTime(selected.updatedAt)}</b>{selected.updatedByName ? <> by <b>{selected.updatedByName}</b></> : null}</p>
              </div></header>

              <div className="wn-body" role="tabpanel" id="wn-panel" aria-labelledby={mode === 'edit' ? 'wn-tab-edit' : 'wn-tab-preview'}>
                {mode === 'edit' ? (
                  <textarea className="wn-textarea" value={draft.body} placeholder="Write in markdown — # heading, - bullet, - [ ] task, **bold**, `code`…" aria-label="Note body" readOnly={isDemo} onChange={(e) => onEdit({ body: e.target.value })} />
                ) : (
                  <div
                    className="wn-md"
                    ref={previewRef}
                    onClick={(e) => {
                      const li = (e.target as HTMLElement).closest('.wn-check li')
                      if (!li || !previewRef.current || isDemo || !noteId) return
                      const items = Array.from(previewRef.current.querySelectorAll('.wn-check li'))
                      const idx = items.indexOf(li)
                      if (idx >= 0) onEdit({ body: toggleChecklist(draft.body, idx) })
                    }}
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                )}

                <div className="wn-tags">
                  <span className="wn-tags__label">Projects</span>
                  {selected.projectIds.map((pid) => {
                    const p = projectById.get(pid)
                    if (!p) return null
                    return <span key={pid} className={`wn-chip ${p.status === 'lead' ? 'wn-chip--lead' : ''}`}>{p.name}</span>
                  })}
                  {!isDemo ? <button type="button" className="wn-tag-add" onClick={() => setTagOpen((v) => !v)}>＋ tag</button> : null}
                </div>
                {tagOpen && !isDemo ? (
                  <div className="wn-tag-pop">
                    {data.projects.length === 0 ? <span className="wn-tag-opt">No projects yet.</span> : null}
                    {data.projects.map((p) => {
                      const on = selected.projectIds.includes(p.id)
                      return (
                        <button
                          type="button"
                          key={p.id}
                          className={`wn-tag-opt ${on ? 'is-on' : ''}`}
                          onClick={() => {
                            const next = on ? selected.projectIds.filter((x) => x !== p.id) : [...selected.projectIds, p.id]
                            void setNoteProjects(selected.id, next).then(() => router.refresh())
                          }}
                        >
                          <span className="wn-tag-opt__mark">{on ? '✓' : ''}</span>
                          {p.name}
                          {p.status === 'lead' ? <span className="wn-chip wn-chip--lead" style={{ marginLeft: 'auto' }}>lead</span> : null}
                        </button>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
