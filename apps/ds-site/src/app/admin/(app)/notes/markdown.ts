/**
 * A compact, dependency-free markdown → HTML renderer for the notes preview.
 * Security: the input is escaped FIRST, then markdown transforms add only a fixed
 * set of tags — so a note body can never inject raw HTML/script (defence-in-depth
 * even though both authors are trusted admins). Inline code spans are tokenised out
 * before bold/italic/link run, so `` `**x**` `` stays literal inside <code>. Covers
 * headings, bold/italic, inline + fenced code, links, blockquotes, rules,
 * ordered/unordered lists, and `- [ ]` / `- [x]` checklists.
 */

// Placeholder sentinel for extracted code spans — a control char that can never
// legitimately appear in a note, so it never collides with real text.
const SENT = ''
const CODE_RE = new RegExp(SENT + '(\\d+)' + SENT, 'g')

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inline(s: string): string {
  // 1) pull code spans out first (content already escaped) so emphasis/link
  //    transforms can't corrupt code samples.
  const codes: string[] = []
  let out = escapeHtml(s).replace(/`([^`]+)`/g, (_m, c) => {
    codes.push(c)
    return SENT + (codes.length - 1) + SENT
  })
  // 2) links (http/https/mailto only), bold, italic
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, (_m, t, u) => `<a href="${u}" target="_blank" rel="noopener noreferrer">${t}</a>`)
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
  // 3) re-insert the (already-escaped) code spans
  out = out.replace(CODE_RE, (_m, i) => `<code>${codes[Number(i)] ?? ''}</code>`)
  return out
}

function checklistItem(raw: string): string | null {
  const m = raw.match(/^\[([ xX])\]\s+(.*)$/)
  if (!m) return null
  const done = m[1] !== ' '
  const text = m[2] ?? ''
  // The box is a real focusable button (role=checkbox) so the toggle has a
  // keyboard path; the note-app delegates the actual toggle on click/Enter/Space.
  const box = `<button type="button" class="wn-box ${done ? 'is-done' : ''}" role="checkbox" aria-checked="${done}" aria-label="${escapeHtml(text)}">${done ? '✓' : ''}</button>`
  return `<li class="${done ? 'is-done' : ''}">${box}<span>${inline(text)}</span></li>`
}

export function renderMarkdown(text: string): string {
  const lines = (text ?? '').replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []
  let i = 0
  const n = lines.length

  while (i < n) {
    const line = lines[i] ?? ''

    if (line.trimStart().startsWith('```')) {
      i++
      const buf: string[] = []
      while (i < n && !(lines[i] ?? '').trimStart().startsWith('```')) buf.push(lines[i] ?? ''), i++
      i++
      out.push(`<pre class="wn-pre">${escapeHtml(buf.join('\n'))}</pre>`)
      continue
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      const lvl = (h[1] ?? '#').length
      out.push(`<h${lvl}>${inline((h[2] ?? '').trim())}</h${lvl}>`)
      i++
      continue
    }

    if (/^\s*([-*_])\1\1+\s*$/.test(line)) {
      out.push('<hr>')
      i++
      continue
    }

    if (line.startsWith('>')) {
      const buf: string[] = []
      while (i < n && (lines[i] ?? '').startsWith('>')) buf.push((lines[i] ?? '').slice(1).trimStart()), i++
      out.push(`<blockquote>${inline(buf.join(' '))}</blockquote>`)
      continue
    }

    if (/^\s*[-*]\s+\[[ xX]\]\s+/.test(line)) {
      const items: string[] = []
      while (i < n && /^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i] ?? '')) {
        const item = checklistItem((lines[i] ?? '').replace(/^\s*[-*]\s+/, ''))
        if (item) items.push(item)
        i++
      }
      out.push(`<ul class="wn-check">${items.join('')}</ul>`)
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < n && /^\s*[-*+]\s+/.test(lines[i] ?? '') && !/^\s*[-*]\s+\[[ xX]\]\s+/.test(lines[i] ?? '')) {
        items.push(`<li>${inline((lines[i] ?? '').replace(/^\s*[-*+]\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < n && /^\s*\d+\.\s+/.test(lines[i] ?? '')) {
        items.push(`<li>${inline((lines[i] ?? '').replace(/^\s*\d+\.\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    const buf: string[] = [line]
    i++
    while (i < n && (lines[i] ?? '').trim() && !/^(#{1,4}\s|\s*[-*+]\s|\s*\d+\.\s|>|```)/.test(lines[i] ?? '')) {
      buf.push(lines[i] ?? '')
      i++
    }
    out.push(`<p>${inline(buf.join(' '))}</p>`)
  }

  return out.join('\n')
}

/** First ~160 chars of the body as plain text for list snippets (keeps hyphens). */
export function noteSnippet(body: string): string {
  const plain = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .split('\n')
    .map((l) => l.replace(/^\s*(#{1,4}|>|[-*+]|\d+\.)\s+/, '').replace(/^\[[ xX]\]\s+/, ''))
    .join(' ')
    .replace(/[*_`~]/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > 160 ? plain.slice(0, 160).trimEnd() + '…' : plain
}
