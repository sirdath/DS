import Link from 'next/link'
import { TOOLS, type ToolCard } from '../lib/tools-catalog'

const STATUS_LABEL: Record<ToolCard['status'], string> = { ready: 'Ready', preview: 'Preview', soon: 'Soon' }
const STATUS_CLASS: Record<ToolCard['status'], string> = { ready: 'is-ready', preview: 'is-preview', soon: '' }

function Card({ tool }: { tool: ToolCard }) {
  const style = { ['--card-accent' as string]: tool.accent }
  const inner = (
    <>
      <div className="ws-card__top">
        <span className="ws-card__name" translate="no">
          {tool.name}
        </span>
        <span className="ws-card__dot" aria-hidden />
      </div>
      <p className="ws-card__tagline">{tool.tagline}</p>
      <div className="ws-card__foot">
        <span className={`ws-status ${STATUS_CLASS[tool.status]}`}>{STATUS_LABEL[tool.status]}</span>
        {tool.href ? <span className="ws-card__open">Open →</span> : null}
      </div>
    </>
  )

  if (tool.href) {
    return (
      <Link href={tool.href} className="ws-card" style={style}>
        {inner}
      </Link>
    )
  }
  return (
    <div className="ws-card is-soon" style={style} aria-disabled>
      {inner}
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <>
      <div className="ws-head">
        <span className="ws-head__eyebrow">DS2 · Workspace</span>
        <h1 className="ws-head__title">Your tools</h1>
        <p className="ws-head__sub">
          Open a tool to use it. Xenia takes bookings, Fama reads your reviews, Panoptes finds a site.
        </p>
      </div>

      <div className="ws-grid">
        {TOOLS.map((tool) => (
          <Card key={tool.slug} tool={tool} />
        ))}
      </div>
    </>
  )
}
