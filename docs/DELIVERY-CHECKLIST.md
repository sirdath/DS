# DS delivery checklist

Every client site must pass this before handoff. No exceptions, this is how we earn the "no surprises" claim in [POSITIONING.md §8](brand/POSITIONING.md).

## Performance (Lighthouse, mobile + desktop)
- [ ] Performance ≥ 90
- [ ] Accessibility ≥ 90
- [ ] Best Practices ≥ 90
- [ ] SEO ≥ 90
- [ ] LCP < 2.5 s on 4G throttling
- [ ] CLS < 0.1
- [ ] Total JS < 250 KB on the critical path (excluding fonts + motion sequences)
- [ ] Images served in WebP or AVIF; no PNG/JPEG hero imagery
- [ ] Motion sequences (if used) ≤ 1.5 MB WebP

## Accessibility
- [ ] Full keyboard path: tab through the entire page without a trap
- [ ] Visible focus rings on every interactive element (no `outline: none` without replacement)
- [ ] Every image has meaningful `alt` text (or `alt=""` if decorative)
- [ ] Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text + UI states
- [ ] Motion respects `prefers-reduced-motion: reduce` (all scroll-scrubbed sequences serve a static poster)
- [ ] Form fields have associated labels (not just placeholders)
- [ ] Semantic landmarks: `<header>`, `<main>`, `<nav>`, `<footer>` in use
- [ ] Skip-to-content link at the top of every page

## SEO + metadata
- [ ] Unique `<title>` and `<meta description>` per route
- [ ] OpenGraph + Twitter card images (1200×630 min) on every shareable route
- [ ] `sitemap.xml` generated and referenced in `robots.txt`
- [ ] Canonical URL on every page
- [ ] Research report routes (`/research/*`) return `noindex` in the header

## Content + brand
- [ ] Headlines are **sentence-case** (POSITIONING.md §8)
- [ ] No fluff words in copy ("synergy", "transformation" unqualified, "guru", "hybrid innovation studio")
- [ ] Locations (if shown) match the "Athens / London" format
- [ ] Case studies follow the **Transformation Story** format (POSITIONING.md §10), never a naked before/after slider
- [ ] One CTA per major section; final CTA block above the footer

## Chatbot (if present)
- [ ] System prompt reviewed and client-approved
- [ ] RAG grounding enabled; knowledge base seeded with current client content
- [ ] Out-of-scope refusal rate ≥ 80% on the test suite
- [ ] Grounding rate ≥ 90% on in-scope test questions
- [ ] Median first-token latency < 1.5 s
- [ ] Cost dashboard live (`admin/chat-usage`)
- [ ] Feature flag / kill switch tested

## Research (any client engagement)
- [ ] `competitor-research` run, report committed at `apps/{slug}/public/research/{slug}/competitors.md`
- [ ] `website-research` run against the client's existing site (if any), report committed
- [ ] Confidence scores ≥ 0.6 (or report clearly marked "preliminary" with gaps listed)
- [ ] 2 grounding-verification claims checked against live DOM

## Code quality
- [ ] `pnpm turbo build` succeeds locally and in CI
- [ ] `pnpm lint` clean
- [ ] `pnpm check-types` clean
- [ ] Test coverage ≥ 70% for any `packages/*` code touched (TDD skill)
- [ ] No hardcoded colors/spacing/motion-durations, all via `@ds/tokens`
- [ ] No secrets in committed files (pre-push hook active)

## Deployment
- [ ] Vercel deploy preview URL attached to the PR
- [ ] Production deploy tested against the preview before promoting
- [ ] Environment variables set in Vercel project settings (not committed)
- [ ] Domain DNS verified if custom domain requested
- [ ] Analytics wired (Vercel Web Analytics minimum; client analytics if specified)

## Handoff
- [ ] `apps/{slug}/README.md` explains: how to run locally, how to deploy, where content is edited
- [ ] Walkthrough video (Loom or similar) covering the site for the client's team
- [ ] Admin credentials handover doc (if CMS / Supabase involved), sent via 1Password, never email
- [ ] Post-launch review scheduled (see POSITIONING.md §4 Phase 2, Stewardship transition)
- [ ] Stewardship engagement offered explicitly (opt-in, not implied)

## Sign-off
- [ ] Dath or Stelios reviewed the finished site end-to-end in a real browser
- [ ] `code-reviewer` subagent review complete on the final PR
- [ ] `security-reviewer` subagent review complete if the site has auth, payments, or user-submitted data
- [ ] Client sign-off recorded in `apps/{slug}/DELIVERY.md`

---

**If any item is unticked, the site is not delivered.** If the client is pressuring launch, that's the moment the *Decision Pause* rule (POSITIONING.md §4) kicks in: *"You don't need to decide now. Take time, we're happy to proceed either way."* We don't ship broken.
