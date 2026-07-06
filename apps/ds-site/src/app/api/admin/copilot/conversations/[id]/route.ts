import { assertAdmin } from '../../../../../admin/lib/assert-admin'
import {
  getConversation,
  deleteConversation,
  renameConversation,
} from '../../../../../admin/lib/copilot-conversations'

export const runtime = 'nodejs'

async function guard(): Promise<Response | null> {
  try {
    await assertAdmin()
    return null
  } catch {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
}

/** GET → one conversation's full state (items + history + usage) for resuming. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const denied = await guard()
  if (denied) return denied
  const { id } = await ctx.params
  const conversation = await getConversation(id)
  if (!conversation) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  return new Response(JSON.stringify({ conversation }), { headers: { 'Content-Type': 'application/json' } })
}

/** DELETE → remove a conversation. */
export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const denied = await guard()
  if (denied) return denied
  const { id } = await ctx.params
  await deleteConversation(id)
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}

/** PATCH → rename a conversation. */
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const denied = await guard()
  if (denied) return denied
  const { id } = await ctx.params
  const body = (await req.json().catch(() => ({}))) as { title?: unknown }
  const title = typeof body.title === 'string' ? body.title : ''
  await renameConversation(id, title)
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
}
