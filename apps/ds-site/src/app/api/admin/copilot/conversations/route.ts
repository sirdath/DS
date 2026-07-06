import { assertAdmin } from '../../../../admin/lib/assert-admin'
import { getCurrentEmail } from '../../../../admin/lib/roles'
import { listConversations, saveConversation } from '../../../../admin/lib/copilot-conversations'

export const runtime = 'nodejs'

/** GET → the founders' conversation list (most recent first). */
export async function GET(): Promise<Response> {
  try {
    await assertAdmin()
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const conversations = await listConversations()
  return new Response(JSON.stringify({ conversations }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

/** PUT → upsert a conversation (client generates the id). Fire-and-forget save. */
export async function PUT(req: Request): Promise<Response> {
  try {
    await assertAdmin()
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  const body = (await req.json().catch(() => ({}))) as {
    id?: unknown
    title?: unknown
    items?: unknown
    history?: unknown
    usage?: unknown
  }
  const id = typeof body.id === 'string' ? body.id : ''
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })
  const email = (await getCurrentEmail()) ?? ''
  await saveConversation({
    id,
    title: typeof body.title === 'string' ? body.title : 'New chat',
    items: Array.isArray(body.items) ? body.items : [],
    history: Array.isArray(body.history) ? body.history : [],
    usage: body.usage && typeof body.usage === 'object' ? (body.usage as Record<string, unknown>) : {},
    createdBy: email,
  })
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
