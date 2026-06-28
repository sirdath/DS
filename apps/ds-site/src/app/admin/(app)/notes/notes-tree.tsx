'use client'

import { useState } from 'react'
import { createFolder, deleteFolder, moveFolder, renameFolder } from '../../notes-actions'
import type { Note, NoteFolder } from './types'

export interface TreeNode extends NoteFolder {
  children: TreeNode[]
}

export function buildTree(folders: NoteFolder[]): TreeNode[] {
  const byId = new Map<string, TreeNode>(folders.map((f) => [f.id, { ...f, children: [] }]))
  const roots: TreeNode[] = []
  for (const f of byId.values()) {
    const parent = f.parentId ? byId.get(f.parentId) : null
    if (parent) parent.children.push(f)
    else roots.push(f)
  }
  const sort = (ns: TreeNode[]) => {
    ns.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
    ns.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

/** Flatten the tree to indented options for a "Move to…" picker. */
export function flatFolderOptions(nodes: TreeNode[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = []
  for (const n of nodes) {
    out.push({ id: n.id, label: `${', '.repeat(depth)}${n.name}` })
    if (n.children.length) out.push(...flatFolderOptions(n.children, depth + 1))
  }
  return out
}

/** A folder + every folder beneath it — the set that can never be a move target. */
function descendantIds(node: TreeNode): Set<string> {
  const ids = new Set<string>([node.id])
  const walk = (n: TreeNode) => n.children.forEach((c) => { ids.add(c.id); walk(c) })
  walk(node)
  return ids
}

const ICON = {
  folder: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>,
  caret: <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M9 6l6 6-6 6z" /></svg>,
  dots: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>,
}

interface NotesTreeProps {
  tree: TreeNode[]
  notes: Note[]
  activeId: string
  isDemo: boolean
  onSelectFolder: (sel: string) => void
  onChanged: () => void
}

export function NotesTree({ tree, notes, activeId, isDemo, onSelectFolder, onChanged }: NotesTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(tree.map((f) => f.id)))
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const allOptions = flatFolderOptions(tree)

  if (!tree.length) return null

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function onNewSubfolder(f: TreeNode) {
    setMenuFor(null)
    const name = window.prompt(`New subfolder inside "${f.name}"`)?.trim()
    if (!name) return
    await createFolder(name, f.id).catch(() => undefined)
    setExpanded((prev) => new Set(prev).add(f.id))
    onChanged()
  }

  async function onRename(f: TreeNode) {
    setMenuFor(null)
    const name = window.prompt('Rename folder', f.name)?.trim()
    if (!name) return
    await renameFolder(f.id, name).catch(() => undefined)
    onChanged()
  }

  async function onMove(f: TreeNode, parentId: string | null) {
    setMenuFor(null)
    try {
      await moveFolder(f.id, parentId)
      onChanged()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Move failed')
    }
  }

  async function onDelete(f: TreeNode) {
    setMenuFor(null)
    if (!window.confirm(`Delete folder "${f.name}"? Notes inside are kept (moved to All notes).`)) return
    await deleteFolder(f.id).catch(() => undefined)
    if (activeId === f.id) onSelectFolder('all')
    onChanged()
  }

  function renderTree(nodes: TreeNode[], depth: number) {
    return nodes.map((f) => {
      const direct = notes.filter((n) => n.folderId === f.id).length
      const isOpen = expanded.has(f.id)
      const blocked = descendantIds(f)
      const moveOptions = allOptions.filter((o) => !blocked.has(o.id))
      return (
        <div key={f.id} className="wn-folder">
          <div
            role="treeitem"
            aria-selected={activeId === f.id}
            aria-expanded={f.children.length ? isOpen : undefined}
            tabIndex={0}
            className={`wn-row ${depth > 0 ? 'wn-row--child' : ''} ${activeId === f.id ? 'is-active' : ''}`}
            onClick={() => onSelectFolder(f.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelectFolder(f.id)
              } else if (e.key === 'ArrowRight' && f.children.length && !isOpen) {
                e.preventDefault()
                toggleExpand(f.id)
              } else if (e.key === 'ArrowLeft' && f.children.length && isOpen) {
                e.preventDefault()
                toggleExpand(f.id)
              }
            }}
          >
            {f.children.length ? (
              <button
                type="button"
                className={`wn-caret-btn ${isOpen ? 'is-open' : ''}`}
                aria-label={isOpen ? 'Collapse folder' : 'Expand folder'}
                onClick={(e) => { e.stopPropagation(); toggleExpand(f.id) }}
              >
                {ICON.caret}
              </button>
            ) : (
              <span className="wn-spacer" />
            )}
            <span className="wn-row__ic">{ICON.folder}</span>
            <span className="wn-row__name">{f.name}</span>
            <span className="wn-row__count">{direct || ''}</span>
            {!isDemo ? (
              <button
                type="button"
                className="wn-kebab"
                aria-label={`Folder actions for ${f.name}`}
                aria-haspopup="menu"
                aria-expanded={menuFor === f.id}
                onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === f.id ? null : f.id) }}
              >
                {ICON.dots}
              </button>
            ) : null}
          </div>

          {menuFor === f.id ? (
            <>
              <button type="button" className="wn-menu-scrim" aria-label="Close menu" onClick={() => setMenuFor(null)} />
              <div className="wn-folder-menu" role="menu">
                <button type="button" role="menuitem" onClick={() => void onNewSubfolder(f)}>＋ Subfolder</button>
                <button type="button" role="menuitem" onClick={() => void onRename(f)}>Rename</button>
                <label className="wn-folder-menu__move">
                  <span>Move to</span>
                  <select
                    aria-label={`Move ${f.name} to`}
                    value={f.parentId ?? ''}
                    onChange={(e) => void onMove(f, e.target.value || null)}
                  >
                    <option value="">Top level</option>
                    {moveOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </label>
                <button type="button" role="menuitem" className="is-danger" onClick={() => void onDelete(f)}>Delete</button>
              </div>
            </>
          ) : null}

          {isOpen && f.children.length ? renderTree(f.children, depth + 1) : null}
        </div>
      )
    })
  }

  return (
    <>
      <div className="wn-tree__label">Folders</div>
      <div role="tree" aria-label="Folders">
        {renderTree(tree, 0)}
      </div>
    </>
  )
}
