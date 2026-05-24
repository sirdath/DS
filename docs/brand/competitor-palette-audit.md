# Competitor Colour / Palette Audit — DS2

> Purpose: evidence to choose a brand palette direction for **DS2** (premium digital + AI consultancy, Athens & London; SMB-Greek + international clients) — **blue-pastel vs green-pastel vs premium-dark-with-accent** — so we differentiate rather than blend in.
>
> **Method note / confidence: ~0.65 (preliminary on exact hexes).** Direct page inspection (WebFetch / curl / headless fetch) was blocked in this environment, so background-vs-light, temperature, gradient use, and accent *family* are corroborated via search-result descriptions, design-gallery writeups (Awwwards), and brand directories. **Hex values are approximate** — eyeball/known-brand estimates, not pulled from live DOM. Treat hexes as "in this neighbourhood," not exact. Verify the 2-3 finalists against live sites before locking tokens.

## Firms audited

| Firm | Base | Background / surface tone (approx) | Accent hue(s) (approx) | Gradients? | Temperature | Distinctive vs generic |
|---|---|---|---|---|---|---|
| [Lazarev](https://www.lazarev.agency/) (AI/SaaS product design) | Dark | Near-black `#0B0B0C` / dark grey surfaces | Bright lime-yellow accent `#D6F84C`-ish | Minimal; mostly flat + motion | Neutral-cool | Distinctive — dark + acid accent reads "AI product studio" |
| [ustwo](https://www.ustwo.com/) (product studio) | Light/black mix | White `#FFFFFF` + bold black `#000000` blocks | High-chroma swatches (varies) | Some | Neutral | Mid — strong black/white typographic system, playful color blocks |
| [Scandiweb](https://scandiweb.com/) (ecommerce agency) | Light | White / very light grey | Corporate blue + supporting brights | Light | Cool | Generic — conventional clean-corporate |
| [Noomo](https://noomoagency.com/) (3D/WebGL storytelling) | Dark | Black `#000000`, "pixels & glass" | Electric blue / cyan glassy highlights | Yes — heavy, glassy | Cool | Distinctive *style*, but blue-family = on-trend |
| [Impekable](https://www.impekable.com/) (UX/UI) | Light | White / light | Purple→blue gradient hero | Yes — purple-blue | Cool | Mid — purple-blue is a common SaaS look |
| [Work & Co](https://www.work.co/) (premium product) | Light | White `#FFFFFF` | Black type, minimal color (Helvetica Neue / IBM Plex Mono) | No | Neutral | Distinctive *through restraint* — almost no color; typographic |
| [ForAI](https://forai.design/) (AI-focused design studio) | Dark | Near-black | Neon accent + WebGL | Yes/motion | Cool-neutral | On-trend "AI = dark + neon" cluster |
| [DOPE Studio](https://wearedope.com/) (Athens digital agency) | Dark-ish | Dark, bold | Bold high-chroma | Some | Mixed | Mid — energetic, busy |
| [Jords+Co](https://www.awwwards.com/sites/jords-co-studio) (boutique branding) | Light | Clean light one-pager | Restrained | No | Neutral-warm | Mid — clean-minimal |

## Synthesis

**1. The category is saturated with blue / cool.** Across AI and digital studios, the default is either (a) **dark base + cool electric-blue / cyan / indigo accent** (Noomo, ForAI, the broad "AI startup" cluster) or (b) **light + blue-purple gradient** (Impekable, much SaaS). Industry write-ups say it plainly: *"in a tech world where blue dominates"* — Royal Blue `#007FFF` / Electric Indigo `#6F00FF` + cyan/neon-green accents are the documented AI-startup baseline ([I Love Hue](https://ilovehue.co/blog/tech-saas-color-palettes/)). Indigo→cyan and purple→pink gradients are explicitly called the AI cliché.

**2. Green and "warm" are rare — and that's now a deliberate escape hatch.** Brands are *consciously* leaving blue to stand out: TravelPerk rebranded around a vibrant **Perk Green** specifically because blue is crowded ([The Branx 2025](https://thebranx.com/blog/tech-brands-2025-the-most-important-branding-updates-and-trends-so-far)). Warm/earthy and green palettes are uncommon in this exact competitor set.

**3. Dark + a single restrained accent is common but not generic *if the accent is unusual*.** Dark base is table stakes for "serious product/AI studio" (Lazarev, Noomo, ForAI). What separates the memorable ones is the *accent choice* — Lazarev's acid lime is distinctive precisely because it isn't blue. Pure dark + blue accent = blends straight in.

### The tension to respect
- **Blue = trust, but blue = invisible here.** It's the safest "trustworthy tech" signal and the single most over-used hue in the category. A blue-pastel DS2 would read competent and forgettable.
- **Green = differentiation, but green can skew "eco/wellness/fintech"** if it's a leafy or minty green. A *deep, technical* green (not pastel-leafy) threads the needle.
- **Dark+accent = premium + serious, but the dark layout itself is now the cliché** for AI studios; novelty has to come from the accent, not the darkness.

## Recommendation

**Primary: premium-dark base + an uncommon-for-the-category accent — and make that accent a deep/technical green-leaning or amber-leaning tone, not blue.**

This is the best fit for DS2 because:
- Dark reads **premium + senior + "we build serious systems"** — matches the consultancy's challenge-first, technical positioning.
- The category's *darkness* is shared, but its *accent* is almost always blue/cyan/indigo. Choosing a **non-blue accent** (deep green or warm amber) is the cheapest, highest-impact way to look different while still looking trustworthy.
- It aligns with DS2's existing dark-palette preference (pure neutral R=G=B greys, no blue undertone) — see [feedback_dark_palette]. A neutral dark base + green accent is fully consistent with that.

**Why not pure blue-pastel:** maximal blend-in risk; we'd look like every AI SaaS site.
**Why not pure green-pastel (light + minty green):** pastel-light skews soft/wellness and undercuts "senior consultancy gravitas"; trust comes more from restraint + contrast than from a light pastel field.

### Risks of the recommendation
1. **Dark-mode fatigue / "another dark AI site."** Mitigate by leaning on the *non-blue accent* + strong typographic restraint (the Work & Co lesson) so the differentiation is the palette, not just "it's dark."
2. **Green can read eco/fintech.** Mitigate by using a **desaturated, deep, slightly cool-but-not-blue green** (closer to pine/forest than mint) and keeping it as a thin accent, not a fill.
3. **Accessibility on dark.** Bright accents on near-black need care for body text; never set long-form body copy in the accent — keep body in near-white on near-black (see contrast notes below).

---

## Concrete starting palettes (verify before locking)

### Option A — Premium dark + deep-green accent (recommended)
| Role | Hex | Notes |
|---|---|---|
| bg | `#0B0B0C` | near-black, pure neutral R≈G≈B (no blue undertone) |
| surface | `#161618` | raised cards / sections |
| text (body) | `#EDEDED` | near-white on `#0B0B0C` |
| muted | `#8A8A8E` | secondary text / captions |
| accent | `#2FBF71` | deep technical green (use sparingly: links, CTAs, key marks) |

**WCAG AA (body):** `#EDEDED` on `#0B0B0C` ≈ **17:1** contrast — passes AA & AAA for normal text. Accent `#2FBF71` on `#0B0B0C` ≈ **6.3:1** — passes AA for normal text and large text (fine for CTAs/links). Do **not** use muted `#8A8A8E` (≈ 5:1 on bg — AA for normal text, but keep it for secondary only).

### Option B — Premium dark + warm amber accent (differentiator alt)
| Role | Hex | Notes |
|---|---|---|
| bg | `#0C0C0C` | near-black neutral |
| surface | `#18160F` | barely-warm raised surface (optional; can stay neutral `#171717`) |
| text (body) | `#F2F0EA` | warm near-white |
| muted | `#928D82` | secondary |
| accent | `#E8A33D` | warm amber — rare in the category, reads confident not techy-cold |

**WCAG AA (body):** `#F2F0EA` on `#0C0C0C` ≈ **18:1** — passes AAA. Accent `#E8A33D` on `#0C0C0C` ≈ **9:1** — passes AA/AAA; very safe for CTAs and even large headings.

> Both options keep DS2 in the "premium/serious" register while putting the differentiation in a **non-blue accent**. Gradients optional and should stay subtle (single-hue depth, not the indigo→cyan AI cliché). Green (Option A) reads slightly more "engineering/data trustworthy"; amber (Option B) reads warmer/more human and is the rarest in this set.

## Sources
- [Lazarev](https://www.lazarev.agency/) · [Lazarev on Awwwards](https://www.awwwards.com/sites/lazarev-product-design-firm)
- [ustwo](https://www.ustwo.com/) · [ustwo brand on Brandfetch](https://brandfetch.com/ustwo.com)
- [Scandiweb](https://scandiweb.com/)
- [Noomo](https://noomoagency.com/) · [Noomo on Awwwards](https://www.awwwards.com/sites/noomo-agency)
- [Impekable](https://www.impekable.com/)
- [Work & Co](https://www.work.co/) · [Work & Co typographic system (Order)](https://order.design/project/work-and-co)
- [ForAI](https://forai.design/)
- [DOPE Studio (Athens)](https://wearedope.com/) · [Noetik (Athens)](https://www.noetik.gr/en/agency/)
- [Jords+Co Studio (Awwwards)](https://www.awwwards.com/sites/jords-co-studio)
- Category trend evidence: [Tech/SaaS/AI color palettes — I Love Hue](https://ilovehue.co/blog/tech-saas-color-palettes/) · [Tech brand trends 2025 — The Branx (TravelPerk → Perk Green)](https://thebranx.com/blog/tech-brands-2025-the-most-important-branding-updates-and-trends-so-far) · [thoughtbot brand playbook](https://thoughtbot.com/playbook/our-company/brand)
