'use client'

import { useRouter } from 'next/navigation'
import { type FormEvent, useEffect, useState } from 'react'
import {
  createArticle,
  deleteArticle,
  draftArticle,
  setArticleStatus,
  updateArticle,
} from '@/app/admin/articles-actions'
import type { AdminArticle, ArticleLang, ArticleStatus } from './types'

const STATUS: Record<ArticleStatus, { label: string; cls: string }> = {
  draft: { label: 'Draft', cls: '' },
  review: { label: 'In review', cls: 'ds-badge--warning' },
  published: { label: 'Published', cls: 'ds-badge--success' },
}

interface Form {
  title: string
  slug: string
  lang: ArticleLang
  description: string
  topic: string
  bodyMd: string
}

const EMPTY_FORM: Form = { title: '', slug: '', lang: 'en', description: '', topic: '', bodyMd: '' }

function toForm(a: AdminArticle): Form {
  return { title: a.title, slug: a.slug, lang: a.lang, description: a.description, topic: a.topic, bodyMd: a.bodyMd }
}

export function ArticlesClient({ articles }: { articles: AdminArticle[] }) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [keyword, setKeyword] = useState('')
  const [busy, setBusy] = useState<'create' | 'save' | 'draft' | 'status' | 'delete' | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  // New-article form
  const [newTitle, setNewTitle] = useState('')
  const [newLang, setNewLang] = useState<ArticleLang>('en')
  const [newTopic, setNewTopic] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  const selected = articles.find((a) => a.id === selectedId) ?? null

  // Seed the editor whenever a different article is picked (not on refreshes,
  // so unsaved edits survive router.refresh()).
  const [seededId, setSeededId] = useState<string | null>(null)
  useEffect(() => {
    if (selected && selected.id !== seededId) {
      setForm(toForm(selected))
      setSeededId(selected.id)
    }
  }, [selected, seededId])

  function pick(id: string) {
    setSelectedId(id)
    setKeyword('')
    setErr(null)
    setNotice(null)
  }

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function run(kind: NonNullable<typeof busy>, fn: () => Promise<void>) {
    if (busy) return
    setBusy(kind)
    setErr(null)
    setNotice(null)
    try {
      await fn()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'That did not work.')
    } finally {
      setBusy(null)
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault()
    await run('create', async () => {
      const article = await createArticle({ title: newTitle, lang: newLang, topic: newTopic })
      setSelectedId(article.id)
      setSeededId(article.id)
      setForm(toForm(article))
      setKeyword(newKeyword)
      setNewTitle('')
      setNewTopic('')
      setNewKeyword('')
      router.refresh()
    })
  }

  async function onSave() {
    if (!selected) return
    await run('save', async () => {
      await updateArticle(selected.id, form)
      setNotice('Saved.')
      router.refresh()
    })
  }

  async function onDraft() {
    if (!selected) return
    await run('draft', async () => {
      const { description, bodyMd } = await draftArticle(selected.id, keyword)
      setForm((f) => ({ ...f, description, bodyMd }))
      setNotice('Draft written — read it, edit it, then publish when it holds up.')
      router.refresh()
    })
  }

  async function onStatus(status: ArticleStatus) {
    if (!selected) return
    await run('status', async () => {
      await setArticleStatus(selected.id, status)
      router.refresh()
    })
  }

  async function onDelete() {
    if (!selected) return
    if (!window.confirm('Delete this article? If it is published it disappears from /blog.')) return
    await run('delete', async () => {
      await deleteArticle(selected.id)
      setSelectedId(null)
      setSeededId(null)
      setForm(EMPTY_FORM)
      router.refresh()
    })
  }

  return (
    <>
      <form className="ds-card art-new" onSubmit={onCreate}>
        <div className="ds-field art-new__title">
          <label className="ds-field__label" htmlFor="art-new-title">New article — working title</label>
          <input
            id="art-new-title"
            className="ds-input"
            placeholder="How much a business website costs in 2026…"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
        </div>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="art-new-lang">Language</label>
          <select id="art-new-lang" className="ds-select" value={newLang} onChange={(e) => setNewLang(e.target.value === 'el' ? 'el' : 'en')}>
            <option value="en">English</option>
            <option value="el">Ελληνικά</option>
          </select>
        </div>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="art-new-topic">Topic</label>
          <input
            id="art-new-topic"
            className="ds-input"
            placeholder="websites…"
            value={newTopic}
            onChange={(e) => setNewTopic(e.target.value)}
          />
        </div>
        <div className="ds-field">
          <label className="ds-field__label" htmlFor="art-new-kw">Target keyword</label>
          <input
            id="art-new-kw"
            className="ds-input"
            placeholder="website cost london 2026…"
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
          />
        </div>
        <button className="ds-btn ds-btn--primary art-new__btn" type="submit" disabled={busy === 'create'}>
          {busy === 'create' ? 'Creating…' : 'New article'}
        </button>
      </form>

      {err ? <p className="art-err" role="alert">{err}</p> : null}
      {notice ? <p className="art-notice" role="status">{notice}</p> : null}

      <div className="art-layout">
        <div className="art-list">
          {articles.length === 0 ? (
            <p className="ds-empty">No articles yet. Create one above — Claude drafts, you approve.</p>
          ) : (
            articles.map((a) => {
              const st = STATUS[a.status]
              return (
                <button
                  type="button"
                  key={a.id}
                  className={`art-row${a.id === selectedId ? ' is-active' : ''}`}
                  onClick={() => pick(a.id)}
                >
                  <span className="art-row__title">{a.title || 'Untitled'}</span>
                  <span className="art-row__meta">
                    <span className={`ds-badge ${st.cls}`}>{st.label}</span>
                    <span className="ds-badge ds-badge--accent">{a.lang.toUpperCase()}</span>
                    {a.topic ? <span className="art-row__topic">{a.topic}</span> : null}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {selected ? (
          <div className="ds-card art-editor">
            <div className="art-editor__top">
              <span className={`ds-badge ${STATUS[selected.status].cls}`}>{STATUS[selected.status].label}</span>
              <div className="art-editor__flow">
                {selected.status === 'draft' ? (
                  <button type="button" className="ds-btn" onClick={() => onStatus('review')} disabled={busy !== null}>
                    Send to review
                  </button>
                ) : null}
                {selected.status === 'review' ? (
                  <>
                    <button type="button" className="ds-btn ds-btn--ghost" onClick={() => onStatus('draft')} disabled={busy !== null}>
                      Back to draft
                    </button>
                    <button type="button" className="ds-btn ds-btn--primary" onClick={() => onStatus('published')} disabled={busy !== null}>
                      Publish
                    </button>
                  </>
                ) : null}
                {selected.status === 'published' ? (
                  <button type="button" className="ds-btn ds-btn--ghost" onClick={() => onStatus('draft')} disabled={busy !== null}>
                    Unpublish
                  </button>
                ) : null}
                <button type="button" className="ds-btn ds-btn--ghost" onClick={onDelete} disabled={busy !== null}>
                  {busy === 'delete' ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>

            <div className="art-grid">
              <div className="ds-field art-grid__wide">
                <label className="ds-field__label" htmlFor="art-title">Title</label>
                <input id="art-title" className="ds-input" value={form.title} onChange={(e) => set('title', e.target.value)} />
              </div>
              <div className="ds-field">
                <label className="ds-field__label" htmlFor="art-slug">Slug (/blog/…)</label>
                <input id="art-slug" className="ds-input" spellCheck={false} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
              </div>
              <div className="ds-field">
                <label className="ds-field__label" htmlFor="art-lang">Language</label>
                <select id="art-lang" className="ds-select" value={form.lang} onChange={(e) => set('lang', e.target.value === 'el' ? 'el' : 'en')}>
                  <option value="en">English</option>
                  <option value="el">Ελληνικά</option>
                </select>
              </div>
              <div className="ds-field">
                <label className="ds-field__label" htmlFor="art-topic">Topic</label>
                <input id="art-topic" className="ds-input" value={form.topic} onChange={(e) => set('topic', e.target.value)} />
              </div>
              <div className="ds-field">
                <label className="ds-field__label" htmlFor="art-kw">Target keyword</label>
                <input
                  id="art-kw"
                  className="ds-input"
                  placeholder="πόσο κοστίζει μια ιστοσελίδα…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <div className="ds-field art-grid__wide">
                <label className="ds-field__label" htmlFor="art-desc">Meta description</label>
                <input id="art-desc" className="ds-input" value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="ds-field art-grid__wide">
                <label className="ds-field__label" htmlFor="art-body">Body (markdown)</label>
                <textarea
                  id="art-body"
                  className="ds-textarea art-body"
                  value={form.bodyMd}
                  onChange={(e) => set('bodyMd', e.target.value)}
                />
              </div>
            </div>

            <div className="art-editor__actions">
              <button type="button" className="ds-btn" onClick={onDraft} disabled={busy !== null}>
                {busy === 'draft' ? 'Drafting…' : 'Draft with Claude'}
              </button>
              <button type="button" className="ds-btn ds-btn--primary" onClick={onSave} disabled={busy !== null}>
                {busy === 'save' ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        ) : (
          <div className="ds-card art-editor art-editor--empty">
            <p className="ds-empty">Pick an article on the left, or create one above.</p>
          </div>
        )}
      </div>
    </>
  )
}
