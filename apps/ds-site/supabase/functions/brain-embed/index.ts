// Supabase Edge Function: brain-embed
// Generates gte-small (384-dim) embeddings IN-STACK — no external API, no key,
// nothing leaves Supabase. Called by the DS2 app for query embedding (recall)
// and content embedding (remember/dedup). JWT-verified; the app calls it with
// the service-role key. Body: { text: string } or { texts: string[] }.
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const model = new (globalThis as any).Supabase.ai.Session('gte-small')

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}))
    const texts: string[] = Array.isArray(body?.texts)
      ? body.texts
      : typeof body?.text === 'string'
        ? [body.text]
        : []
    if (texts.length === 0) {
      return new Response(JSON.stringify({ error: 'text or texts[] required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      })
    }
    const embeddings: number[][] = []
    for (const t of texts) {
      const e = await model.run(String(t).slice(0, 8000), { mean_pool: true, normalize: true })
      embeddings.push(e as number[])
    }
    return new Response(JSON.stringify({ embeddings }), {
      headers: { 'content-type': 'application/json', connection: 'keep-alive' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
})
