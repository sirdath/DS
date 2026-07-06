'use client'

import { useCallback, useEffect, useState, type MouseEvent } from 'react'
import { CopilotApp } from './copilot-app'

interface ConvSummary {
  id: string
  title: string
  createdBy: string
  updatedAt: string
}

/**
 * The full copilot page: a history sidebar (past chats, shared across the
 * founders) + the copilot. `appKey` is the mount key and only changes on New
 * chat / selecting a thread — NOT when the running app reports its own new id,
 * so a live conversation is never remounted out from under you.
 */
export function CopilotWorkspace({ credentialSet, initialId }: { credentialSet: boolean; initialId?: string }) {
  const [list, setList] = useState<ConvSummary[]>([])
  const [appKey, setAppKey] = useState<string>(initialId ?? 'new')
  const [loadId, setLoadId] = useState<string | undefined>(initialId)
  const [activeId, setActiveId] = useState<string | null>(initialId ?? null)

  const loadList = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/copilot/conversations')
      if (!res.ok) return
      const data = (await res.json()) as { conversations?: ConvSummary[] }
      setList(data.conversations ?? [])
    } catch {
      /* offline — no history */
    }
  }, [])
  useEffect(() => {
    void loadList()
  }, [loadList])

  function selectConv(id: string) {
    setAppKey(id)
    setLoadId(id)
    setActiveId(id)
    window.history.replaceState(null, '', `/admin/copilot?c=${id}`)
  }
  function newChat() {
    setAppKey(`new-${Date.now()}`)
    setLoadId(undefined)
    setActiveId(null)
    window.history.replaceState(null, '', '/admin/copilot')
  }
  // Fired by the running app when it mints/loads its id — update URL + list only.
  const onConvId = useCallback(
    (id: string) => {
      setActiveId(id)
      window.history.replaceState(null, '', `/admin/copilot?c=${id}`)
      window.setTimeout(() => void loadList(), 700)
    },
    [loadList],
  )

  async function del(id: string, e: MouseEvent) {
    e.stopPropagation()
    try {
      await fetch(`/api/admin/copilot/conversations/${id}`, { method: 'DELETE' })
    } catch {
      /* ignore */
    }
    if (activeId === id) newChat()
    void loadList()
  }

  return (
    <div className="cop-ws">
      <aside className="cop-ws__side">
        <button type="button" className="cop-ws__new" onClick={newChat}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New chat
        </button>
        <div className="cop-ws__list">
          {list.length === 0 ? (
            <p className="cop-ws__empty">No past chats yet.</p>
          ) : (
            list.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`cop-ws__item${activeId === c.id ? ' is-active' : ''}`}
                onClick={() => selectConv(c.id)}
              >
                <span className="cop-ws__title">{c.title || 'New chat'}</span>
                <span className="cop-ws__del" role="button" aria-label="Delete chat" onClick={(e) => void del(c.id, e)}>
                  ✕
                </span>
              </button>
            ))
          )}
        </div>
      </aside>
      <div className="cop-ws__main">
        <CopilotApp key={appKey} credentialSet={credentialSet} conversationId={loadId} onConversationId={onConvId} />
      </div>
    </div>
  )
}
