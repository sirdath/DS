'use server'

/**
 * Articles tab actions (blog / SEO engine). CRUD goes through the RLS admin
 * client; draftArticle is the engine: Claude (Opus, on the logged-in founder's
 * own credential — same per-founder billing as the Competitors scan) writes a
 * first draft in the DS2 voice for a target keyword, and the article moves to
 * 'review' so nothing ships without a founder's read and a Publish click.
 */

import type Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { toAdminArticle } from './(app)/articles/lib/articles-source'
import type { AdminArticle, ArticleLang, ArticleStatus } from './(app)/articles/types'
import { assertAdmin } from './lib/assert-admin'
import { getFounderCredential, makeAnthropicClient } from './lib/founder-credential'
import { getSupabaseServerClient } from './lib/supabase-server'

const DRAFT_MODEL = 'claude-opus-4-8'
const TITLE_MAX = 200
const TOPIC_MAX = 80
const DESCRIPTION_MAX = 400
const BODY_MAX = 200_000
const KEYWORD_MAX = 200

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

/** Revalidate the admin tab + every public surface an article can appear on. */
function refresh(slug?: string) {
  revalidatePath('/admin/articles')
  revalidatePath('/blog')
  if (slug) revalidatePath(`/blog/${slug}`)
  revalidatePath('/blog/rss.xml')
  revalidatePath('/sitemap.xml')
}

/** Simple latin slug: lowercase, ascii letters/digits/hyphens. Greek titles
 *  produce little or nothing here — the founder edits the slug by hand. */
function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function normLang(v: unknown): ArticleLang {
  return v === 'el' ? 'el' : 'en'
}

export async function createArticle(input: {
  title: string
  lang: ArticleLang
  topic: string
}): Promise<AdminArticle> {
  const supabase = await db()
  const title = input.title.trim().slice(0, TITLE_MAX)
  if (!title) throw new Error('Give the article a working title first.')
  const topic = input.topic.trim().slice(0, TOPIC_MAX)
  const lang = normLang(input.lang)
  const base = slugify(title) || `article-${Date.now().toString(36)}`

  // Two attempts: the clean slug, then a suffixed one if it's already taken.
  for (const slug of [base, `${base}-${Math.random().toString(36).slice(2, 6)}`]) {
    const { data, error } = await supabase
      .from('articles')
      .insert({ title, lang, topic, slug, status: 'draft' })
      .select('*')
      .single()
    if (!error && data) {
      refresh()
      return toAdminArticle(data as Record<string, unknown>)
    }
    if (error && error.code !== '23505') throw new Error(error.message)
  }
  throw new Error('Could not find a free slug for that title — edit the title and retry.')
}

export async function updateArticle(
  id: string,
  input: {
    title: string
    slug: string
    lang: ArticleLang
    description: string
    topic: string
    bodyMd: string
  },
): Promise<void> {
  const supabase = await db()
  if (!id) throw new Error('Missing article id.')
  const title = input.title.trim().slice(0, TITLE_MAX)
  if (!title) throw new Error('The title cannot be empty.')
  const slug = input.slug.trim()
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error('Slug must be lowercase latin letters, digits and hyphens (e.g. "website-cost-2026").')
  }
  const { error } = await supabase
    .from('articles')
    .update({
      title,
      slug,
      lang: normLang(input.lang),
      description: input.description.trim().slice(0, DESCRIPTION_MAX),
      topic: input.topic.trim().slice(0, TOPIC_MAX),
      body_md: input.bodyMd.slice(0, BODY_MAX),
    })
    .eq('id', id)
  if (error) {
    throw new Error(error.code === '23505' ? 'That slug is already used by another article.' : error.message)
  }
  refresh(slug)
}

export async function setArticleStatus(id: string, status: ArticleStatus): Promise<void> {
  const supabase = await db()
  if (!id) throw new Error('Missing article id.')
  if (status !== 'draft' && status !== 'review' && status !== 'published') {
    throw new Error('Unknown status.')
  }
  const { data: row } = await supabase.from('articles').select('slug, published_at').eq('id', id).maybeSingle()
  if (!row) throw new Error('Article not found.')
  const patch: Record<string, unknown> = { status }
  if (status === 'published' && !row.published_at) patch.published_at = new Date().toISOString()
  const { error } = await supabase.from('articles').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
  refresh(typeof row.slug === 'string' ? row.slug : undefined)
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = await db()
  if (!id) throw new Error('Missing article id.')
  const { data: row } = await supabase.from('articles').select('slug').eq('id', id).maybeSingle()
  const { error } = await supabase.from('articles').delete().eq('id', id)
  if (error) throw new Error(error.message)
  refresh(typeof row?.slug === 'string' ? row.slug : undefined)
}

const VOICE_SYSTEM = [
  'You write articles for the blog of DS2, a two-founder digital solutions consultancy in Athens and London: strategy, web engineering and applied AI for small and mid-sized businesses.',
  '',
  'Voice rules (non-negotiable):',
  '- Sentence-case headings. "You/we" language — candid, collaborative, a truth-teller, never performative.',
  '- Short, rhythmic sentences. Consulting-grade clarity, zero marketing fluff.',
  '- Challenge-first, protective framing: "this creates risk because…", never "this is wrong". Where a common approach is a bad idea, say so and give the constructive alternative with its trade-offs.',
  '- Avoid: "innovation", "synergy", unqualified "transformation", "guru", "ninja", and fluffy compound nouns.',
  '- Never invent client stories, testimonials, named examples or statistics. Use numbers and ranges only where they are honestly defensible (typical market prices, common timelines) and say clearly when something varies.',
].join('\n')

function draftPrompt(a: { title: string; topic: string; lang: ArticleLang }, keyword: string): string {
  const language =
    a.lang === 'el'
      ? 'Greek — write the entire article in natural, native Greek for the Greek/Cypriot market (not translated English).'
      : 'English (UK) — for the London/international market.'
  return [
    'Write a genuinely helpful blog article.',
    '',
    `Target search keyword: "${keyword}"`,
    `Working title: "${a.title}" (keep it, or sharpen it slightly — sentence case).`,
    a.topic ? `Topic: ${a.topic}` : '',
    `Language: ${language}`,
    '',
    'Requirements:',
    '- 900–1400 words of markdown. Use ## and ### headings and lists where they genuinely help.',
    '- Practical and specific: concrete steps, honest cost/time ranges, what creates risk and what we would do differently.',
    '- Answer the search intent behind the keyword completely — the reader should leave knowing what to do next even if they never contact us.',
    '- End with one short, honest paragraph noting that DS2 builds exactly these things and that we work best when clients let us be honest early — no hard sell.',
    '',
    'Output format, exactly:',
    'DESCRIPTION: <one meta description for search results, max 155 characters, in the article language>',
    '---',
    '<the article body in markdown — do not repeat the title as a heading>',
  ]
    .filter(Boolean)
    .join('\n')
}

/** AI first draft: fills body_md + meta description and moves the article to
 *  'review'. Returns the draft so the editor can show it without a reload. */
export async function draftArticle(id: string, keyword: string): Promise<{ description: string; bodyMd: string }> {
  const supabase = await db()
  if (!id) throw new Error('Missing article id.')
  const kw = keyword.trim().slice(0, KEYWORD_MAX)
  if (!kw) throw new Error('Set the target keyword first — the draft is written to answer it.')

  const { data: row } = await supabase.from('articles').select('title, topic, lang').eq('id', id).maybeSingle()
  if (!row) throw new Error('Article not found.')

  const credential = await getFounderCredential()
  if (!credential) {
    throw new Error('No Anthropic credential for your account — add yours in the "Your Anthropic key" card on the Competitors tab.')
  }
  const client = makeAnthropicClient(credential)

  // Adaptive thinking shares the token budget with the article itself; Greek
  // also tokenises heavier than English, hence the roomy cap.
  const params = {
    model: DRAFT_MODEL,
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    system: VOICE_SYSTEM,
    messages: [
      {
        role: 'user',
        content: draftPrompt(
          { title: String(row.title ?? ''), topic: String(row.topic ?? ''), lang: normLang(row.lang) },
          kw,
        ),
      },
    ],
  } as unknown as Anthropic.MessageCreateParamsNonStreaming

  let text = ''
  try {
    const res = await client.messages.create(params)
    text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()
  } catch (err) {
    throw new Error(err instanceof Error ? `Draft failed: ${err.message}` : 'Draft failed.')
  }
  if (!text) throw new Error('The model returned an empty draft — try again.')

  const descMatch = text.match(/^DESCRIPTION:\s*(.+)$/m)
  const description = (descMatch?.[1] ?? '').trim().slice(0, DESCRIPTION_MAX)
  const sepIndex = text.search(/\n-{3,}\n/)
  const bodyMd = (sepIndex !== -1 ? text.slice(sepIndex).replace(/^\n-{3,}\n/, '') : text.replace(/^DESCRIPTION:.*$/m, ''))
    .trim()
    .slice(0, BODY_MAX)
  if (!bodyMd) throw new Error('The draft came back without a body — try again.')

  const { error } = await supabase
    .from('articles')
    .update({ body_md: bodyMd, description, status: 'review' })
    .eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
  return { description, bodyMd }
}
