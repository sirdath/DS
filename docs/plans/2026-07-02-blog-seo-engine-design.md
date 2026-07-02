# DS2 blog / SEO content engine — plan

Date: 2026-07-02 · Status: proposed (awaiting go) · Inspiration: digitalapplied.com/blog

## What Digital Applied actually does (teardown, fetched live)

- **1,579 articles**, multiple posts per day — clearly programmatic generation at scale.
- 7 topic categories + hashtag taxonomy; heavy internal cross-linking.
- Title patterns engineered for search: comparisons ("X vs Y: Which to Use When"),
  pricing ("Claude Fable 5 Pricing…"), how-to, year-anchored ("… 2026 Patterns").
- Newsletter capture on every page ("Join 15,000+ marketers…") + service CTAs — the blog
  is a lead funnel, not a diary.
- This was already the **top opportunity** our own Competitors scan flagged for DS2
  ("Articles + newsletter engine — their blog drives traffic and collects leads").

## The honest strategy call (challenge-first, on ourselves)

Copying the 1,500-article mill is the wrong move for DS2, and it creates risk because:

1. **Google explicitly targets "scaled content abuse"** (helpful-content system + the
   March-2024-onward spam policies). Established domains with brand signals can absorb
   that risk; a young, small domain publishing multi-daily AI articles is exactly the
   profile that gets demoted or deindexed. Digital Applied survives it partly because of
   domain age, volume of backlinks, and real product pages underneath.
2. **It undercuts our positioning.** DS2 sells senior judgment. A feed of templated
   AI posts reads as the opposite.

The version that fits us: **AI-drafted, founder-approved, locally-targeted** — the same
leverage (Claude writes, we scale), with a human quality gate that keeps both Google and
the brand safe. And our unfair advantage is **language + locality**: Greek-language SERPs
for our services are thin. "Πόσο κοστίζει ένα website για επιχείρηση", "AI chatbot για
ξενοδοχεία", "κατασκευή ιστοσελίδας Αθήνα" have weak competition compared to the same
queries in English. Cyprus doubly so. That is where a small site can actually rank.

## Content architecture

Two tiers, both bilingual (EL primary for GR/CY, EN for London/international), with
hreflang pairs:

**Tier 1 — Cornerstone articles (10–15 to launch, then ~2/week).** High-intent
commercial queries, written properly in the DS2 voice. Examples to target:

| Query (EL market) | Query (EN market) |
|---|---|
| πόσο κοστίζει μια ιστοσελίδα για επιχείρηση 2026 | website redesign cost london 2026 |
| AI chatbot για ξενοδοχεία / εστιατόρια | ai receptionist for clinics uk |
| κατασκευή ιστοσελίδας Αθήνα — τι να προσέξεις | web design agency vs freelancer |
| τι είναι το EAA και αφορά την επιχείρησή μου; | eaa accessibility compliance 2026 |
| Google reviews: πώς να απαντάς (με AI) | how to respond to negative reviews |
| πόσο κοστίζει ένα eshop στην Ελλάδα | shopify vs custom store for smes |

**Tier 2 — Local service pages (careful, later).** Service × location matrix (web
design / AI chatbot / site audit × Athens / Thessaloniki / Nicosia / Limassol / London)
— only with genuinely differentiated local content (pricing context, local examples),
otherwise they're doorway pages and get filtered.

Every article ends with: a challenge-first service CTA block, 2–3 related articles, and
a **newsletter capture** (the Digital Applied trick that turns readers into a list).

## Technical build (fits the existing stack)

1. **Data**: `articles` table in Supabase (slug, lang, hreflang_group, title, description,
   body_md, topic, status `draft|review|published`, published_at, created_by) + a
   `subscribers` table for the newsletter. Not MDX files — DB-backed so the admin manages
   it, and it stays a sellable "content engine" primitive like the rest of the panel.
2. **Public**: `/blog` index (topic filters) + `/blog/[slug]` in ds-site, ISR
   (`revalidate` ~1h), Article JSON-LD, OG images, RSS. Reuses the existing markdown
   renderer + i18n plumbing.
3. **Site-wide SEO gap (do regardless of the blog)**: the site currently has **no
   `sitemap.ts` and no `robots.ts`**. Add both; the blog slots its URLs in.
4. **Admin: new "Articles" tab (the engine)**: keyword/topic queue → **Draft with
   Claude** (Opus, brand voice + internal-link rules + "no invented facts" baked into
   the prompt; billed to the founder's stored key like everything else) → founder edits
   in the existing notes-style editor → **Approve & publish**. Status flow enforces the
   human gate: nothing goes live without a founder click.
5. **Measurement**: wire `/blog/*` into the existing `visits` analytics + register the
   site in Google Search Console (one-time, you). Review rankings/traffic at 90 days.

## Cadence & expectations (honest)

- Launch: 10–15 cornerstones (mix EL/EN). Then ~2 EL + 1 EN per week, founder-approved.
- SEO compounds slowly: expect little for 8–12 weeks, then long-tail Greek queries first.
  This is a 6-month bet, not a growth hack.
- Cost per article at Opus draft prices: cents. The real cost is founder review minutes —
  which is exactly the quality gate that makes it work.

## Recommendation

**Yes — build it, quality-gated.** It is the highest-leverage marketing asset we can ship
with the stack we already have, our own competitor scan says so, and the Greek-language
niche is genuinely underserved. Skip the content-mill volume; win on locality + language +
candor.

## Build phases

- **Phase 1 (~1–2 days)**: migration (articles + subscribers), public /blog + article page
  + sitemap/robots/JSON-LD/RSS, admin Articles tab with draft→review→publish + Claude
  drafting, newsletter capture form, 6 seed articles (3 EL / 3 EN) drafted for review.
- **Phase 2**: topic clusters + internal-link suggestions, OG image generation, weekly
  newsletter send (needs an email provider, e.g. Resend), Search Console feedback loop.
- **Phase 3 (only if Phase 1 ranks)**: the careful Tier-2 local matrix.
