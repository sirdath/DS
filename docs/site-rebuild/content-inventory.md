# DS2 Marketing Site — Content & Asset Inventory (Rebuild Source of Truth)

> Purpose: a complete, verbatim inventory of the DS2 public marketing site so it can be rebuilt
> from scratch without losing any copy or asset. Copy is quoted exactly (EN + EL side by side)
> from `apps/ds-site/src/app/i18n-dict.ts` and the section components. Do not paraphrase when
> rebuilding — these are the exact strings.
>
> Sources:
> - `apps/ds-site/src/app/i18n-dict.ts` (bilingual copy dictionary — most site text)
> - `apps/ds-site/src/app/page.tsx` (homepage section order + keys)
> - `apps/ds-site/src/app/about-story.tsx`, `services-circle.tsx`, `portal-journey.tsx`,
>   `powered-by.tsx`, `contact-panel.tsx`, `hero-video.tsx`, `_site-chrome.tsx`,
>   `mobile-menu.tsx`, `site-footer.tsx`
> - `apps/ds-site/src/app/products/lib/tools-catalog.ts` (workspace tools — separate from marketing tools)
> - `apps/ds-site/src/app/blog|portfolio|tools` page shells
> - `docs/brand/POSITIONING.md`
>
> Language convention in `i18n-dict.ts`: titles are split into a plain part + an `Em` part
> (rendered inside `<em>`). `<hl>…</hl>` inside compose-draft strings is highlighted by the
> typewriter. Greek is a "first professional draft" per the file header.

---

## 1. Brand & voice

### 1.1 What we are (POSITIONING §1–2)
- **Category:** "DS is a Digital Solutions Consultancy." (also acceptable: *digital solutions consultancy / agency*). Deliberately NOT "tech consulting" alone or "web dev agency" alone — the name describes the outcome, not the method.
- **Where:** Athens–London based. Footer/intro variants:
  - "Athens–London based digital solutions consultancy" *(default)*
  - "Operating between Athens and London" *(safe alternative)*
  - "Headquartered in Athens, with a London presence" *(most conservative)*
  - Rule: only claim London presence while there is real, ongoing activity there.
- Note: On the live site the brand is styled **"DS2"** (the site/company mark used throughout is `DS2` / "DS2, Digital Solutions Consulting").

### 1.2 Who leads (POSITIONING §3)
| Title (external) | Owns |
|---|---|
| **Head of Strategy & Consulting** | Client relationships, business problems, commercial strategy, marketing, consulting engagements |
| **Head of Engineering & Data** | Architecture, engineering quality, data / ML decisions, technical delivery, tech stack |
- Do NOT use: CEO/CTO, "Lead Developer"/"Business Lead", "Innovation Officer"/"Digital Guru".

### 1.3 Challenge-first, transparent delivery — the four beats (POSITIONING §4)
1. **Diagnose & challenge** — explicitly assess what's working, what isn't, what we'd do differently, even against the brief.
2. **Say what creates risk** — never "this is wrong"; always "this creates risk because…", "this may not scale due to…". Protective framing, not judgmental.
3. **Present alternatives with reasoning** — critique paired with a constructive alternative that explains trade-offs.
4. **Decision pause** — *"You don't need to decide now. Take time, we're happy to proceed either way."*

### 1.4 Signature sentences (memorize — do not deviate)
- *"We work best when we can be honest early, even if that means challenging the initial idea. We'll always explain our thinking and leave the decision with you."* (first-meeting opener)
- *"Projects end; responsibility doesn't."* (closing line on monthly Stewardship)
- *"We don't certify your organisation, we take responsibility for what we build."* (product assurance)

### 1.5 Tone of voice (POSITIONING §8)
- Candid but collaborative. Use "you/we". Direct, not performative.
- Truth-teller, not insult-teller.
- **Sentence-case headlines.**
- Short, rhythmic sentences. Consulting-grade clarity, not marketing fluff.
- **Avoid:** "innovation", "synergy", "transformation" (unqualified), "guru", "ninja", "hybrid innovation studio", "tech-powered consultancy collective".

### 1.6 Engagement modes (POSITIONING §6)
Exactly one of three per project: **Consulting-only** · **Build-only** · **End-to-end**. Plus optional **Stewardship** (monthly, opt-in, "continuity not dependency").

### 1.7 The three buyable service categories (as shipped on the site)
On the live site the engagement modes were folded into three **buyable service categories** (see §4): **Brand Upgrade** (standard) · **Internal Rewiring** (standard) · **Custom Solution** (bespoke). Consulting-only / build-only / end-to-end are still described inside the Services copy.

Note: "Clarity, given depth" is the DS2 v2 design-system tagline (per the `ds2-design` skill); it is not a string in the marketing copy dictionary itself.

---

## 2. Information architecture

The site is bilingual (EN + EL) via a client-side language toggle (`LangToggle`); every page renders both languages from the same components. Two chrome systems:
- **Homepage** (`page.tsx`) has its own bespoke nav + hero + sections.
- **Sub-pages** (`/about`, `/portfolio`, `/tools`, `/tools/[slug]`, `/blog`, `/blog/[slug]`) share `PageChrome` (`_site-chrome.tsx`) → solid nav + footer + contact panel.

| Route | Page | Ordered sections |
|---|---|---|
| `/` | Homepage | 1. Preloader → 2. Nav → 3. Hero (video) → 4. Services circle → 5. *Tools teaser (HIDDEN, flag off)* → 6. Powered by → 7. Featured work → 8. Portal journey / thesis → 9. Contact (Mail compose) → 10. Footer → Contact panel |
| `/about` | About / founders | 1. Mission + Vision (side by side) → 2. The gap → 3. Founders (Dimitris, Stelios) → 4. Why DS2 + CTA |
| `/portfolio` | Selected work | 1. Section head → 2. Two case cards (GlobalTeamPlans, dataportfolio) → 3. Coda + CTA. (Note: the i18n `portfolio.cases` holds **four** cases, but the page shell hard-renders only the first two.) |
| `/tools` | Tools storefront | 1. Section head → 2. Grid of 4 tool cards (Argus, Fama, Panoptes, Xenia) |
| `/tools/[slug]` | One tool | Back link → hero (icon, status, role, name, tagline, desc, interest CTA, price) → ROI (stats + body) → features + facts (audience / deliverable / pricing) |
| `/blog` | Blog index | Section head → article list (or empty state) → newsletter form |
| `/blog/[slug]` | Article | (data-driven from blog source; not in i18n) |

**Homepage `SHOW_TOOLS_TEASER` flag = `false`** (`page.tsx` line 18). The "Decision intelligence tools" landing teaser is parked ("Dimitris wants the section redesigned before it ships"). `/tools` itself stays live. When flipped true, the teaser renders `toolsTeaser` copy + the 4 tool cards with poster backgrounds.

---

## 3. Homepage sections (verbatim EN + EL)

### 3.1 Nav (homepage variant)
- Mark: `DS2Mark` SVG, links to `#top`. a11y home label — EN "DS2, home" / EL "DS2, αρχική".
- Links (right): **About**, **Tools**, **Projects** (portfolio). (Blog is NOT in the homepage nav; it IS in the sub-page chrome nav and mobile menu.)
- `LangToggle` + `ContactCTA` ("Send a message") + `MobileMenu`.
- Nav is transparent over hero, gains `.nav--solid` when scrolled past hero.

| Key | EN | EL |
|---|---|---|
| nav.about | About | Σχετικά |
| nav.tools | Tools | Εργαλεία |
| nav.portfolio | Projects | Έργα |
| nav.blog | Blog | Άρθρα |
| cta.send | Send a message | Στείλτε μήνυμα |

### 3.2 Hero (`hero-video.tsx` + `page.tsx`)
Purpose: cinematic looping DS2 hero film (portrait variant on ≤760px), with a tagline caption locked to the logo window, a top-left "what we build" tag list, and a bottom-right "Talk with us" card that opens the contact panel.

- Hero film assets: desktop `/hero/hero-loop.mp4` + poster `/hero/hero-poster.jpg`; mobile `/hero/hero-loop-mobile.mp4` + poster `/hero/hero-poster-mobile.jpg`. Does not autoplay — waits for preloader `ds2:loaded`. Honours `prefers-reduced-motion` (holds poster). Caption `is-shown` window: desktop 0.03s–1.07s, mobile 0.03s–1.0s (scaled to duration).

| Key | EN | EL |
|---|---|---|
| hero.tag1 (tagline line 1) | Digital Solutions | Ψηφιακές Λύσεις |
| hero.tag2 (tagline line 2) | consulting | συμβουλευτική |
| hero.sub | A senior team for strategy, engineering, and applied AI. We work best when we can be honest early, even if that means challenging the initial idea. | Μια έμπειρη ομάδα για στρατηγική, μηχανική και εφαρμοσμένη ΤΝ. Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα. |
| hero.what (a11y) | What we do | Τι κάνουμε |
| hero.tags (top-left list) | AI Automation · Website Development · AI Integration · Data & Predictions | Αυτοματισμοί ΤΝ · Κατασκευή Ιστοσελίδων · Ενσωμάτωση ΤΝ · Δεδομένα & Προβλέψεις |
| hero.build | Websites · Automation · AI Integration | Ιστοσελίδες · Αυτοματισμοί · Ενσωμάτωση ΤΝ |
| hero.buildLabel | What we build | Τι φτιάχνουμε |
| hero.book.title | Talk with us | Μιλήστε μαζί μας |
| hero.book.role | Founders · Athens & London | Ιδρυτές · Αθήνα & Λονδίνο |
| hero.book.cta | Book a 15-min call | Κλείστε κλήση 15' |
| hero.book.draft (prefilled msg) | Hi, I'd like to book a 15-minute intro call. | Γεια σας, θα ήθελα να κλείσω μια εισαγωγική κλήση 15 λεπτών. |

(Note: `hero.build` / `hero.buildLabel` exist in the dict but are not currently rendered by the hero.)

### 3.3 Services circle — see §4 (full detail).

### 3.4 Tools teaser (HIDDEN — `SHOW_TOOLS_TEASER = false`)
Purpose: "For larger organisations" — decision-intelligence tools teaser; renders the 4 tools as poster cards linking to `/tools/{slug}`.

| Key | EN | EL |
|---|---|---|
| toolsTeaser.eyebrow | For larger organisations | Για μεγαλύτερους οργανισμούς |
| toolsTeaser.title + titleEm | Decision intelligence, *as a service.* | Ευφυΐα αποφάσεων, *ως υπηρεσία.* |
| toolsTeaser.sub | Our services are shaped around small and medium businesses. For groups, chains and scale-ups we run the DS2 decision-intelligence tools: continuous market, reputation and location intelligence, delivered as decisions your team can act on. | Οι υπηρεσίες μας είναι φτιαγμένες για μικρομεσαίες επιχειρήσεις. Για ομίλους, αλυσίδες και scale-ups τρέχουμε τα εργαλεία ευφυΐας αποφάσεων της DS2: συνεχής πληροφόρηση για αγορά, φήμη και τοποθεσίες, παραδομένη ως αποφάσεις που η ομάδα σας μπορεί να πράξει. |
| toolsTeaser.cta | Explore the tools | Δείτε τα εργαλεία |

### 3.5 Powered by (`powered-by.tsx`)
Purpose: slow seamless marquee of the tech stack DS2 builds on ("our stack, not clients"). Monochrome simple-icons SVG masks. Pauses on hover.

- Eyebrow — EN "Powered by" / EL "Χτισμένο με".
- Stack (in order, `slug` → label, mask from `/logos/tools/{slug}.svg`):
  1. nextdotjs → Next.js
  2. react → React
  3. typescript → TypeScript
  4. tailwindcss → Tailwind CSS
  5. vercel → Vercel
  6. supabase → Supabase
  7. cloudflare → Cloudflare
  8. postgresql → PostgreSQL
  9. anthropic → Claude
  10. openai → OpenAI
  11. googlegemini → Gemini
  12. python → Python

### 3.6 Featured work (`page.tsx`)
Purpose: two recent builds as a hover/scroll-reveal list, then a "See all projects" link to `/portfolio`. Thumbnails: `/portfolio/{img}.png`.

| Key | EN | EL |
|---|---|---|
| featured.eyebrow | Featured work | Επιλεγμένες δουλειές |
| featured.title + titleEm | A look at *what we ship.* | Μια ματιά σε *αυτά που παραδίδουμε.* |
| featured.sub | A couple of recent builds, the rest live in the portfolio. | Μερικές πρόσφατες δουλειές, οι υπόλοιπες είναι στα έργα. |
| featured.visit | Visit | Επίσκεψη |
| featured.viewAll | See all projects | Δείτε όλες τις δουλειές |

Items (see §6 for full detail): **GlobalTeamPlans** (img `globalteamplans`), **dataportfolio.co.uk** (img `dataportfolio`).

### 3.7 Portal journey / thesis (`portal-journey.tsx`)
Purpose: a scroll-scrubbed film of the Athens→London journey (Greek colonnade → London). Two copy beats cross-fade with the scene. Reduced-motion → static first frame.

- Video assets: desktop `/portals/journey.mp4?v=3` (poster `/portals/journey-poster.jpg?v=3`); mobile `/portals/journey-mobile.mp4?v=2`. Pinned, scrubbed over `+=560%` scroll.

| Key | EN | EL |
|---|---|---|
| thesis.eyebrow | A working principle | Μια αρχή που μας καθοδηγεί |
| thesis.scrollCue | Scroll | Κυλήστε |
| thesis beat 1 (quote): s1Title + s1Em + s1End | "The biggest cost is *lack of knowledge*." | "Το μεγαλύτερο κόστος είναι *η έλλειψη γνώσης*." |
| thesis.s1Body | We're Athens-based, set on closing the technical-literacy gap that quietly holds local businesses back. | Έχουμε έδρα την Αθήνα, με στόχο να κλείσουμε το χάσμα τεχνικής εξοικείωσης που κρατά πίσω τις τοπικές επιχειρήσεις. |
| thesis.s2Eyebrow | Athens → London | Αθήνα → Λονδίνο |
| thesis beat 2 (title): s2Title + s2Em | Trained where the *standards are set* | Εκπαιδευμένοι εκεί που *ορίζονται τα πρότυπα* |
| thesis.s2Body | We keep active clients in London, learning the UK market's best practices first-hand, then bringing them home to every Athens build. | Διατηρούμε ενεργούς πελάτες στο Λονδίνο, μαθαίνοντας από πρώτο χέρι τις βέλτιστες πρακτικές της αγοράς του Ηνωμένου Βασιλείου και φέρνοντάς τες σε κάθε έργο στην Αθήνα. |
| thesis.by | DS2 | DS2 |

### 3.8 Contact — macOS Mail compose (`page.tsx`)
Purpose: a styled macOS Mail "New Message" window that typewriter-types a demo enquiry (in the active language), with a "Send a message" CTA opening the real contact panel. See §8 for the full contact flow.

| Key | EN | EL |
|---|---|---|
| contact.eyebrow | Contact | Επικοινωνία |
| contact title (title + titleEm + titleEnd) | Tell us what you're *actually* trying to do. | Πείτε μας τι *πραγματικά* θέλετε να πετύχετε. |
| contact.sub | We reply within one business day. | Απαντάμε μέσα σε μία εργάσιμη ημέρα. |
| contact.newMessage | New Message | Νέο μήνυμα |
| contact.from | From: | Από: |
| contact.to | To: | Προς: |
| contact.subject | Subject: | Θέμα: |
| contact.draftSubject (typed) | Our website looks like it was built in 2014. | Η ιστοσελίδα μας μοιάζει φτιαγμένη το 2014. |
| contact.draftBody[0] | Hi DS2, we run a `<hl>`family-owned restaurant group`</hl>` with four locations around the city. Our current site is a template we haven't touched in years and it shows. | Γεια σας DS2, έχουμε έναν `<hl>`οικογενειακό όμιλο εστιατορίων`</hl>` με τέσσερα σημεία στην πόλη. Η τωρινή μας ιστοσελίδα είναι ένα πρότυπο που έχουμε χρόνια να αγγίξουμε, και φαίνεται. |
| contact.draftBody[1] | We want something that actually looks `<hl>`premium`</hl>`, loads fast on a phone, with online bookings and menus we can keep updated ourselves. | Θέλουμε κάτι που να δείχνει πραγματικά `<hl>`premium`</hl>`, να φορτώνει γρήγορα στο κινητό, με διαδικτυακές κρατήσεις και μενού που θα ενημερώνουμε μόνοι μας. |
| contact.draftBody[2] | Can we book a 30-minute call next week? | Μπορούμε να κλείσουμε ένα 30λεπτο τηλεφώνημα την επόμενη εβδομάδα; |
| contact.statusDrafting | Drafting · Athens / London | Σύνταξη · Αθήνα / Λονδίνο |
| contact.statusReady | Ready to send · Athens / London | Έτοιμο για αποστολή · Αθήνα / Λονδίνο |
| contact.caption | // Founded 2026. Or just write us at | // Ιδρύθηκε το 2026. Ή γράψτε μας απευθείας στο |
| contact.tools.attach | Attach | Επισύναψη |
| contact.tools.format | Format | Μορφοποίηση |
| contact.tools.image | Image | Εικόνα |
| contact.tools.sign | Sign | Υπογραφή |
| contact.tools.stationery | Stationery | Χαρτικά |
| contact.tools.send | Send | Αποστολή |

- Compose window hard-coded values: From = `you@yourcompany.com`; To pill = `ds2consulting.contact@gmail.com`; caption mailto link = `ds2consulting.contact@gmail.com`.

---

## 4. Services — the three buyable categories (`services-circle.tsx` + i18n `services`)

Purpose: three buyable category cards. Each card has an "Expand for more info" button that grows the card into a full-detail cover panel (every offering explained + a proof/example line + a "Start a conversation" CTA). Esc or the ✕ collapses it. Nothing opens on hover.

- Card background images: `/services/atmos-{key}.webp`; expanded panel wide image: `/services/atmos-{key}-wide.webp` (keys: `brand`, `internal`, `custom`).
- The `custom` card renders its items as chips (names only); `brand`/`internal` render items as a dotted list. The expanded panel always lists each item name + detail.

### Section head
| Key | EN | EL |
|---|---|---|
| services.eyebrow | What we build | Τι φτιάχνουμε |
| services.title + titleEm | Two standard builds, *or one that's only yours.* | Δύο σταθερές λύσεις, *ή μία αποκλειστικά δική σας.* |
| services.sub | Most work lands in one of two standards. When it doesn't, we scope and build exactly what you describe. Consulting-only, build-only or end-to-end, with optional Stewardship once you launch. | Οι περισσότερες συνεργασίες είναι μία από δύο σταθερές λύσεις. Όταν δεν είναι, σχεδιάζουμε και χτίζουμε ακριβώς αυτό που περιγράφετε. Μόνο συμβουλευτική, μόνο υλοποίηση ή ολοκληρωμένα, με προαιρετική Επίβλεψη μετά την κυκλοφορία. |
| services.detailCta | Start a conversation | Ξεκινήστε μια συζήτηση |
| services.expand | Expand for more info | Δείτε περισσότερα |
| services.collapse | Minimise | Σύμπτυξη |

### Category 1 — Brand Upgrade (key `brand`, tag "Standard" / "Σταθερή")
| Field | EN | EL |
|---|---|---|
| name | Brand Upgrade | Αναβάθμιση Παρουσίας |
| tagline | Your public face, rebuilt to look credible and made to convert. | Το δημόσιο πρόσωπό σας, ξαναχτισμένο για κύρος και για αποτέλεσμα. |
| desc | The work people see first. We rebuild your public surface so it loads fast, reads as credible, and turns visitors into enquiries. Strategy, design and build, owned end to end. | Αυτό που βλέπει πρώτο ο κόσμος. Ξαναχτίζουμε τη δημόσια εικόνα σας ώστε να φορτώνει γρήγορα, να εμπνέει εμπιστοσύνη και να μετατρέπει επισκέπτες σε ενδιαφερόμενους. Στρατηγική, σχεδιασμός και υλοποίηση, από την αρχή ως το τέλος. |
| example | We built GlobalTeamPlans and dataportfolio.co.uk, focused sites made to be found and to convert. | Φτιάξαμε τα GlobalTeamPlans και dataportfolio.co.uk, στοχευμένες σελίδες που βρίσκονται και πείθουν. |

Items (name — detail):
| EN | EL |
|---|---|
| Websites — Fast, polished marketing sites that win trust and rank on Google. | Ιστοσελίδες — Γρήγορες, καλοφτιαγμένες σελίδες που κερδίζουν εμπιστοσύνη και βρίσκονται στο Google. |
| Web apps — Logged-in products and tools that feel as smooth as native software. | Διαδικτυακές εφαρμογές — Προϊόντα και εργαλεία με σύνδεση, τόσο ομαλά όσο μια εγγενής εφαρμογή. |
| Platforms — Multi-sided products where your users, data and workflows live. | Πλατφόρμες — Προϊόντα πολλαπλών πλευρών όπου ζουν οι χρήστες, τα δεδομένα και οι ροές σας. |
| SaaS products — Subscription software, from the first screen to billing and onboarding. | Προϊόντα SaaS — Λογισμικό με συνδρομή, από την πρώτη οθόνη ως τη χρέωση και την ένταξη χρηστών. |
| Web shops — Storefronts built to be found and to check out without friction. | Ηλεκτρονικά καταστήματα — Καταστήματα φτιαγμένα για να βρίσκονται και να ολοκληρώνουν αγορές χωρίς τριβή. |
| Applications — Bespoke browser software shaped around how you actually work. | Εφαρμογές — Λογισμικό περιηγητή φτιαγμένο γύρω από τον τρόπο που πραγματικά δουλεύετε. |

### Category 2 — Internal Rewiring (key `internal`, tag "Standard" / "Σταθερή")
| Field | EN | EL |
|---|---|---|
| name | Internal Rewiring | Εσωτερική Αναδιάρθρωση |
| tagline | The work behind the work, automated and made to think. | Η δουλειά πίσω από τη δουλειά, αυτοματοποιημένη και έξυπνη. |
| desc | The systems your customers never see. We connect your tools, remove the repetitive work, and put your own data to work, so the business runs with fewer hands and fewer mistakes. | Τα συστήματα που δεν βλέπουν οι πελάτες σας. Συνδέουμε τα εργαλεία σας, αφαιρούμε την επαναλαμβανόμενη δουλειά και αξιοποιούμε τα δικά σας δεδομένα, ώστε η επιχείρηση να τρέχει με λιγότερα χέρια και λιγότερα λάθη. |
| example | Invoices, reports, handovers and forecasts, all running on time without you. | Τιμολόγια, αναφορές, παραδόσεις και προβλέψεις, όλα στην ώρα τους χωρίς εσάς. |

Items (name — detail):
| EN | EL |
|---|---|
| Automation — The repeating work between your tools, handled quietly in the background. | Αυτοματισμοί — Η επαναλαμβανόμενη δουλειά ανάμεσα στα εργαλεία σας, ήσυχα στο παρασκήνιο. |
| AI agents — Assistants that answer, book and follow up, grounded in your real documents. | Πράκτορες ΤΝ — Βοηθοί που απαντούν, κλείνουν ραντεβού και κάνουν παρακολούθηση, με βάση τα έγγραφά σας. |
| AI integration — Modern AI wired into the software and workflows you already run. | Ενσωμάτωση ΤΝ — Σύγχρονη ΤΝ ενσωματωμένη στο λογισμικό και τις ροές που ήδη έχετε. |
| Data and prediction — Straight answers from your data, and forecasts of what comes next. | Δεδομένα και προβλέψεις — Ξεκάθαρες απαντήσεις από τα δεδομένα σας, και προβλέψεις για το τι έρχεται. |

### Category 3 — Custom Solution (key `custom`, tag "Bespoke" / "Κατά παραγγελία")
| Field | EN | EL |
|---|---|---|
| name | Custom Solution | Εξατομικευμένη Λύση |
| tagline | Anything you can describe, scoped and built from scratch. If it does not fit a box above, it fits here. | Ό,τι μπορείτε να περιγράψετε, σχεδιασμένο και φτιαγμένο από την αρχή. Αν δεν χωράει σε κάποιο κουτί παραπάνω, χωράει εδώ. |
| desc | When the problem is yours alone, the build should be too. We scope it with you, say where it creates risk, and build exactly what the problem needs, nothing more. | Όταν το πρόβλημα είναι μόνο δικό σας, το ίδιο πρέπει να είναι και η λύση. Το σχεδιάζουμε μαζί σας, λέμε πού δημιουργεί ρίσκο, και χτίζουμε ακριβώς αυτό που χρειάζεται, τίποτα παραπάνω. |
| example | Start with a conversation. We will tell you what we would do, and what we would not. | Ξεκινήστε με μια συζήτηση. Θα σας πούμε τι θα κάναμε, και τι δεν θα κάναμε. |

Items (name — detail):
| EN | EL |
|---|---|
| CRM systems — A sales and client hub shaped around your pipeline, not a template. | Συστήματα CRM — Ένα κέντρο πωλήσεων και πελατών φτιαγμένο γύρω από τη ροή πωλήσεών σας, όχι ένα πρότυπο. |
| Marketplaces — Two-sided platforms that match supply and demand and take a cut. | Πλατφόρμες αγορών — Πλατφόρμες δύο πλευρών που ενώνουν ζήτηση και προσφορά και κρατούν προμήθεια. |
| Internal tools — The dashboards and admin panels your team wishes they had. | Εσωτερικά εργαλεία — Οι πίνακες ελέγχου και διαχείρισης που εύχεται η ομάδα σας. |
| Data pipelines — Move, clean and join data so it is ready the moment you need it. | Ροές δεδομένων — Μεταφορά, καθαρισμός και ένωση δεδομένων, έτοιμα τη στιγμή που τα χρειάζεστε. |
| Booking systems — Calendars, availability and payments that just work. | Συστήματα κρατήσεων — Ημερολόγια, διαθεσιμότητα και πληρωμές που απλώς δουλεύουν. |
| Whatever else you need — If you can describe it, we can scope it and build it. | Ό,τι άλλο χρειάζεστε — Αν μπορείτε να το περιγράψετε, μπορούμε να το σχεδιάσουμε και να το χτίσουμε. |

> Note: the i18n dict also carries a full `engage` section (three modes: End-to-end / Consulting only / Build only, with a comparison table for Strategy & diagnostic / Build & delivery / Handover docs / Stewardship, plus tags included/n-a/add-on and a Stewardship blurb). This section is **not currently rendered** on the homepage — the comment in `page.tsx` says the engagement modes were folded into Services. It is preserved in the dict and reproduced in §11 (Reserve copy) below.

---

## 5. Founders / About (`about-story.tsx` + i18n `about`)

`/about` order: Mission + Vision (side by side) → The gap → Founders (Dimitris, then Stelios, flipped) → Why DS2 + Send-a-message CTA. All copy comes from `about.scrollbook` (6 entries) plus the mission/vision fields.

### About page head (used elsewhere, e.g. metadata — the `about.title/sub` fields)
| Key | EN | EL |
|---|---|---|
| about.eyebrow | About us | Σχετικά με εμάς |
| about title (title + titleEm + titleEnd) | Two founders from Athens, building what the city was *missing.* | Δύο ιδρυτές από την Αθήνα, χτίζουν αυτό που *έλειπε* από την πόλη. |
| about.sub | We grew up here, around technology. We kept seeing the same gap. That is why DS2 exists. | Μεγαλώσαμε εδώ, μέσα στην τεχνολογία. Βλέπαμε ξανά και ξανά το ίδιο κενό. Γι' αυτό υπάρχει η DS2. |
| about.coda | We work best when we can be honest early, even if that means challenging the initial idea. | Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα. |

### Mission (scrollbook `mission`)
| | EN | EL |
|---|---|---|
| eyebrow | Mission | Αποστολή |
| title | Make Greek businesses genuinely proficient with technology. | Να κάνουμε τις ελληνικές επιχειρήσεις πραγματικά ικανές με την τεχνολογία. |
| body | Close the gap between what they do well and the tools that could take them much further. | Να κλείσουμε το κενό ανάμεσα σε αυτό που κάνουν καλά και στα εργαλεία που θα μπορούσαν να τις πάνε πολύ πιο μακριά. |

### Vision (scrollbook `vision`)
| | EN | EL |
|---|---|---|
| eyebrow | Vision | Όραμα |
| title | A Greece that evolves drastically. | Μια Ελλάδα που εξελίσσεται δραστικά. |
| body | Where small and medium businesses compete on a global level, because technology stopped holding them back. | Όπου οι μικρομεσαίες επιχειρήσεις ανταγωνίζονται σε παγκόσμιο επίπεδο, επειδή η τεχνολογία σταμάτησε να τις κρατά πίσω. |

### The gap (scrollbook `gap`)
| | EN | EL |
|---|---|---|
| eyebrow | The gap | Το κενό |
| title | The work is serious. The tools are not. | Η δουλειά είναι σοβαρή. Τα εργαλεία όχι. |
| body | Real businesses run on systems that quietly hold them back: thin tooling, manual process, low technical literacy. Left alone, the gap compounds. | Πραγματικές επιχειρήσεις τρέχουν πάνω σε συστήματα που τις κρατούν πίσω: φτωχά εργαλεία, χειροκίνητες διαδικασίες, χαμηλό τεχνολογικό επίπεδο. Αν το αφήσεις, το κενό μεγαλώνει. |

### Founder 1 — Dimitris (scrollbook `dimitris`)
- Image: `/founders/london.png`. Logo chips: **UCL** (text), **Intelmatix** (image `/founders/logos/intelmatix.jpg`, dark bg).

| | EN | EL |
|---|---|---|
| eyebrow | Engineering & Data · London | Μηχανική & Δεδομένα · Λονδίνο |
| title (name) | Dimitris | Δημήτρης |
| body | Studied and built in London. He brings the technical core, architecture, data systems, automation and applied AI, held to the standard of a more demanding market. | Σπούδασε και δούλεψε στο Λονδίνο. Φέρνει τον τεχνικό πυρήνα, αρχιτεκτονική, συστήματα δεδομένων, αυτοματισμό και εφαρμοσμένη AI, σε ένα επίπεδο που ορίζει μια πιο απαιτητική αγορά. |

### Founder 2 — Stelios (scrollbook `stelios`)
- Image: `/founders/athens.png`. Logo chips: **Big 4** (text), **Netherlands** (text — translates via `about.cityNetherlands` → EL "Ολλανδία").

| | EN | EL |
|---|---|---|
| eyebrow | Consulting & Strategy · Athens | Συμβουλευτική & Στρατηγική · Αθήνα |
| title (name) | Stelios | Στέλιος |
| body | Studied in the Netherlands, then consulting at a Big 4 firm in Athens. He brings business structure, operating discipline and a clear read of the Greek market. | Σπούδασε στην Ολλανδία και συνέχισε στη συμβουλευτική, σε μία από τις Big 4 στην Αθήνα. Φέρνει επιχειρηματική δομή, πειθαρχία στη λειτουργία και καθαρή ανάγνωση της ελληνικής αγοράς. |

### Why DS2 (scrollbook `ds2`)
| | EN | EL |
|---|---|---|
| eyebrow | Why DS2 | Γιατί η DS2 |
| title | Two disciplines, one team. | Δύο κόσμοι, μία ομάδα. |
| body | Engineering depth and consulting discipline, with real proximity to the Greek market. That combination is what lets us deliver the mission. | Τεχνικό βάθος και συμβουλευτική πειθαρχία, με πραγματική εγγύτητα στην ελληνική αγορά. Αυτός ο συνδυασμός είναι που μας επιτρέπει να υλοποιούμε την αποστολή. |

### Founders section on homepage (i18n `founders`) — NOT currently rendered
`page.tsx` comment: "Founders / team section now lives on the About page." Preserved copy (reserve — see §11): eyebrow "Team" / "Ομάδα"; title "Two senior founders. *No layers in between.*"; f1 "Head of Strategy & Consulting." (Athens); f2 "Head of Engineering & Data." (London).

### Founder chip labels summary
- Dimitris (London): **UCL**, **Intelmatix**
- Stelios (Athens): **Big 4**, **Netherlands** (→ Ολλανδία)
- Additional `about` fields: missionK/visionK (Mission/Vision labels), cityAthens "Athens"/"Αθήνα", cityLondon "London"/"Λονδίνο", citiesCap "Athens and London, where we live and work" / "Αθήνα και Λονδίνο, εκεί που ζούμε και δουλεύουμε".
- `about.blocks` (4 blocks 01–04) exist in the dict but are NOT rendered by `about-story.tsx` (reserve — §11).

---

## 6. Featured work / portfolio

### 6.1 Homepage featured items (`featured.items`)
| Name | Tag (EN / EL) | URL | Image |
|---|---|---|---|
| GlobalTeamPlans | Website · SEO · Ads / Ιστοσελίδα · SEO · Google Ads | https://globalteamplans.com | `/portfolio/globalteamplans.png` |
| dataportfolio.co.uk | SaaS · Product / SaaS · Προϊόν | https://dataportfolio.co.uk | `/portfolio/dataportfolio.png` |

Blurbs — GlobalTeamPlans: EN "A focused marketing site, built to be found." / EL "Μια στοχευμένη ιστοσελίδα μάρκετινγκ, φτιαγμένη για να τη βρίσκουν." · dataportfolio: EN "From idea to a working portfolio-builder SaaS." / EL "Από ιδέα σε λειτουργικό SaaS δημιουργίας portfolio."

### 6.2 Portfolio page (`/portfolio`)
Head:
| Key | EN | EL |
|---|---|---|
| portfolio.eyebrow | Selected work | Επιλεγμένες δουλειές |
| portfolio.title + titleEm | A few engagements, *told straight.* | Μερικές συνεργασίες, *ειλικρινά.* |
| portfolio.sub | Early work, named where the client is happy to be. We say what we did, and what we did not. | Πρώτες δουλειές, με όνομα όπου ο πελάτης χαίρεται να εμφανίζεται. Λέμε τι κάναμε, και τι δεν κάναμε. |
| portfolio.coda | If you want a second senior opinion before you commit, that is exactly where we are useful. | Αν θέλετε μια δεύτερη έμπειρη γνώμη πριν δεσμευτείτε, εκεί ακριβώς είμαστε χρήσιμοι. |

The page shell renders only cases[0] and cases[1] (with images `/portfolio/globalteamplans.png` and `/portfolio/dataportfolio.png` and external links). All FOUR cases exist in the dict:

**Case 0 — GlobalTeamPlans** (tag Websites; meta "Website · SEO · Google Ads")
- title EN: "A focused marketing site, built to be found." / EL: "Μια στοχευμένη ιστοσελίδα μάρκετινγκ, φτιαγμένη για να τη βρίσκουν."
- text EN: "We designed and built the site end to end, then made sure it would actually get traffic: technical and on-page SEO, plus a Google Ads account set up and launched so it started reaching people from day one."
- text EL: "Σχεδιάσαμε και χτίσαμε την ιστοσελίδα από την αρχή ως το τέλος, και μετά φροντίσαμε να φέρνει πραγματικά επισκεψιμότητα: τεχνικό και on-page SEO, μαζί με λογαριασμό Google Ads στημένο και ενεργό ώστε να φτάνει σε κόσμο από την πρώτη μέρα."
- list EN: Website design and build · Technical and on-page SEO · Google Ads setup and launch
- list EL: Σχεδιασμός και κατασκευή ιστοσελίδας · Τεχνικό και on-page SEO · Στήσιμο και εκκίνηση Google Ads

**Case 1 — dataportfolio** (tag Websites; meta "SaaS · Product build")
- title EN: "A SaaS for building portfolios." / EL: "Ένα SaaS για τη δημιουργία portfolio."
- text EN: "The client wanted to launch a product that lets people build portfolios. We took it from idea to a working SaaS: the application itself and the site around it."
- text EL: "Ο πελάτης ήθελε να λανσάρει ένα προϊόν που επιτρέπει στον κόσμο να φτιάχνει portfolio. Το πήγαμε από ιδέα σε λειτουργικό SaaS: την ίδια την εφαρμογή και την ιστοσελίδα γύρω της."
- list EN: Product and UX build · Full SaaS application · Marketing site around the product
- list EL: Κατασκευή προϊόντος και UX · Πλήρης εφαρμογή SaaS · Ιστοσελίδα μάρκετινγκ γύρω από το προϊόν

**Case 2 — UK medical exam-prep platform** (tag Websites; meta "Medical exam prep · UK · Consulting") — in dict, NOT rendered by the current shell
- title EN: "A leading UK platform helping doctors prepare for their exams." / EL: "Μια κορυφαία πλατφόρμα στο ΗΒ που βοηθά γιατρούς να προετοιμαστούν για τις εξετάσεις τους."
- text EN: "We ran the technical consulting end to end on the decisions that mattered. Which stack to build on, which roles to hire and in what order, and we helped them find the people. Alongside the advice we produced a high quality design prototype of their site, to give them real leverage on build quotes and a stronger direction for the UI."
- text EL: "Αναλάβαμε την τεχνική συμβουλευτική από την αρχή ως το τέλος στις αποφάσεις που μετρούσαν. Με ποιες τεχνολογίες να χτίσουν, ποιους ρόλους να προσλάβουν και με ποια σειρά, και τους βοηθήσαμε να βρουν τους ανθρώπους. Μαζί με τις συμβουλές, φτιάξαμε ένα υψηλής ποιότητας πρωτότυπο σχεδιασμού της ιστοσελίδας τους, για να έχουν πραγματική διαπραγματευτική ισχύ στις προσφορές κατασκευής και πιο καθαρή κατεύθυνση για το UI."
- list EN: Stack and architecture guidance · Hiring plan and sourcing support · High-quality design prototype for pricing leverage and UI direction
- list EL: Καθοδήγηση για τεχνολογίες και αρχιτεκτονική · Σχέδιο προσλήψεων και υποστήριξη εύρεσης · Πρωτότυπο σχεδιασμού υψηλής ποιότητας για διαπραγμάτευση τιμών και κατεύθυνση UI

**Case 3 — Geospatial node network** (tag "Data solutions" / "Λύσεις δεδομένων"; meta "Geospatial · Data science") — in dict, NOT rendered
- title EN: "A geospatial node network from two million points of interest." / EL: "Ένα γεωχωρικό δίκτυο κόμβων από δύο εκατομμύρια σημεία ενδιαφέροντος."
- text EN: "A data and AI company handed us a dataset of around two million points of interest. We turned it into a geospatial network of nodes they could use directly inside one of their production products."
- text EL: "Μια εταιρεία δεδομένων και ΤΝ μας έδωσε ένα σύνολο δεδομένων με περίπου δύο εκατομμύρια σημεία ενδιαφέροντος. Το μετατρέψαμε σε ένα γεωχωρικό δίκτυο κόμβων που μπορούσαν να χρησιμοποιήσουν απευθείας μέσα σε ένα από τα προϊόντα τους σε παραγωγή."
- list EN: Ingested and cleaned roughly 2M POIs · Built a connected geospatial node network · Delivered for use inside their live product
- list EL: Εισαγωγή και καθαρισμός ~2M σημείων (POIs) · Κατασκευή συνδεδεμένου γεωχωρικού δικτύου κόμβων · Παράδοση για χρήση μέσα στο ζωντανό προϊόν τους

---

## 7. Tools catalogue

There are TWO tool lists in the codebase — keep them distinct:

### 7.1 Marketing tools — `i18n-dict.ts` `tools.items` (4) — powers `/tools`, `/tools/[slug]`, and the (hidden) homepage teaser
Storefront head:
| Key | EN | EL |
|---|---|---|
| tools.eyebrow | DS2 tools | Εργαλεία DS2 |
| tools.title + titleEm | Tools we run *for you.* | Εργαλεία που τρέχουμε *για εσάς.* |
| tools.sub | Productized services: you subscribe, we run the machinery, and the results land in your inbox and your portal. No dashboards to learn, no software to manage. | Υπηρεσίες-προϊόντα: εγγράφεστε, εμείς λειτουργούμε τον μηχανισμό, και τα αποτελέσματα φτάνουν στο email και στο portal σας. Χωρίς dashboards για μάθημα, χωρίς λογισμικό για διαχείριση. |
| tools.statusEarly | Early access | Πρώιμη πρόσβαση |
| tools.statusSoon | Coming soon | Έρχεται σύντομα |
| tools.view | See the tool | Δείτε το εργαλείο |
| tools.interestCta | I'm interested | Με ενδιαφέρει |
| tools.interestDraft | Hi DS2, I'm interested in {tool}. | Γεια σας DS2, με ενδιαφέρει το {tool}. |
| tools.audienceLabel | Who it's for | Για ποιους είναι |
| tools.deliverableLabel | What you receive | Τι λαμβάνετε |
| tools.pricingLabel | Pricing | Τιμολόγηση |
| tools.featuresLabel | What it does | Τι κάνει |
| tools.roiLabel | What it's worth | Τι αξίζει |
| tools.backAll | All tools | Όλα τα εργαλεία |
| tools.videoSoon | Short demo film coming here. | Σύντομο φιλμ επίδειξης έρχεται εδώ. |

Poster assets: `/tools/posters/{slug}.webp` (all 4 present). Videos: none yet (`HAS_VIDEO` empty → placeholder with icon + "videoSoon").

#### Tool 1 — Argus (slug `competitor-watch`, status `early`)
| Field | EN | EL |
|---|---|---|
| role | Competitor intelligence | Παρακολούθηση ανταγωνισμού |
| benefit | Know every competitor move before your Monday meeting. | Μάθετε κάθε κίνηση του ανταγωνισμού πριν από τη συνάντηση της Δευτέρας. |
| tagline | The hundred-eyed watchman. We watch your competitors so you don't have to. | Ο εκατόφθαλμος φύλακας. Παρακολουθούμε τους ανταγωνιστές σας, για να μη χρειάζεται εσείς. |
| desc | Define the competitive set your board already asks about. Every week our agents read their websites, prices, offers, reviews and search visibility, and your team gets a digest with only what changed and why it matters. | Ορίζετε το ανταγωνιστικό σύνολο για το οποίο ήδη ρωτά η διοίκηση. Κάθε εβδομάδα οι πράκτορές μας διαβάζουν τις ιστοσελίδες, τις τιμές, τις προσφορές, τις κριτικές και την ορατότητά τους στην αναζήτηση, και η ομάδα σας λαμβάνει μια ενημέρωση μόνο με ό,τι άλλαξε και γιατί μετράει. |
| roiBody | Strategy teams pay agencies €2,000+ for a one-off competitor report that is stale within a month, or burn analyst days rebuilding the same picture by hand. This is the same intelligence, continuous, at a fraction of either. | Οι ομάδες στρατηγικής πληρώνουν σε agencies €2.000+ για μια εφάπαξ ανάλυση ανταγωνισμού που παλιώνει μέσα σε έναν μήνα, ή καίνε μέρες αναλυτών ξαναχτίζοντας την ίδια εικόνα στο χέρι. Αυτή είναι η ίδια πληροφόρηση, συνεχής, σε κλάσμα του κόστους. |
| audience | Strategy, commercial and marketing teams at groups, chains and scale-ups that answer for market position. | Ομάδες στρατηγικής, εμπορικής διεύθυνσης και marketing σε ομίλους, αλυσίδες και scale-ups που λογοδοτούν για τη θέση τους στην αγορά. |
| deliverable | A Monday email digest, with the full archive in your DS2 portal. | Ένα email κάθε Δευτέρα, με πλήρες αρχείο στο DS2 portal σας. |
| priceNote | From €490/month | Από €490/μήνα |

Stats (value — label): EN `10+ h` — of analyst time returned, every week · `€2,000+` — the going rate for one static agency report · `52×` — briefings a year, not one stale deck. EL `10+ ώρες` / `€2.000+` / `52×` (labels translated accordingly).

Features (name — detail), EN: Weekly digest — A short Monday brief, written for an owner, not an analyst. Only the changes that matter. · Price & offer tracking — New packages, discounts and menu or price changes, caught the week they happen. · Review monitoring — What customers praise and complain about across your rivals, summarised. · Search visibility — Who ranks where for the searches that bring you customers, tracked over time. (EL: Εβδομαδιαία ενημέρωση · Τιμές & προσφορές · Παρακολούθηση κριτικών · Ορατότητα στην αναζήτηση — details as in dict.)

#### Tool 2 — Fama (slug `review-intelligence`, status `early`)
| Field | EN | EL |
|---|---|---|
| role | Review intelligence | Ανάλυση κριτικών |
| benefit | Turn what guests say into your next direct booking. | Μετατρέψτε όσα λένε οι επισκέπτες στην επόμενη απευθείας κράτησή σας. |
| tagline | What the world says about you. Every review, every platform, one clear picture. | Ό,τι λέει ο κόσμος για εσάς. Κάθε κριτική, κάθε πλατφόρμα, μία καθαρή εικόνα. |
| desc | We pull every location's reviews from Google, Booking and TripAdvisor into one feed, read them in Greek and English, and tell you what is actually driving your ratings, with reply drafts ready for your team to approve. | Συγκεντρώνουμε τις κριτικές κάθε μονάδας από Google, Booking και TripAdvisor σε μία ροή, τις διαβάζουμε στα ελληνικά και στα αγγλικά, και σας λέμε τι πραγματικά καθορίζει τις βαθμολογίες σας, με προσχέδια απαντήσεων έτοιμα για έγκριση από την ομάδα σας. |
| roiBody | Nine in ten guests read reviews before they book, and at portfolio scale nobody is actually reading them all. One recovered rating point moves direct bookings more than any campaign of the same cost. | Εννέα στους δέκα επισκέπτες διαβάζουν κριτικές πριν κάνουν κράτηση, και σε κλίμακα χαρτοφυλακίου κανείς δεν τις διαβάζει πραγματικά όλες. Ένας ανακτημένος βαθμός κινεί τις απευθείας κρατήσεις περισσότερο από οποιαδήποτε καμπάνια ίδιου κόστους. |
| audience | Hotel groups, restaurant chains and clinic networks managing reputation across many properties. | Ξενοδοχειακοί όμιλοι, αλυσίδες εστίασης και δίκτυα κλινικών που διαχειρίζονται φήμη σε πολλές μονάδες. |
| deliverable | A weekly review brief plus a monthly trend report in your portal. | Εβδομαδιαίο brief κριτικών και μηνιαία αναφορά τάσεων στο portal σας. |
| priceNote | From €390/month | Από €390/μήνα |

Stats EN: `9 / 10` — guests read reviews before booking · `15+ h` — of weekly reading and drafting, across locations · `1 feed` — for every property and platform. (EL: `9 / 10` / `15+ ώρες` / `1 ροή`.)

Features EN: All platforms together · Real sentiment, in Greek too · Reply drafts · Monthly trend report (details in dict; EL: Όλες οι πλατφόρμες μαζί · Πραγματική ανάλυση, και στα ελληνικά · Προσχέδια απαντήσεων · Μηνιαία αναφορά τάσεων).

#### Tool 3 — Panoptes (slug `site-selection`, status `soon`)
| Field | EN | EL |
|---|---|---|
| role | Site selection | Επιλογή τοποθεσίας |
| benefit | Sign the right lease, not just the available one. | Υπογράψτε τη σωστή μίσθωση, όχι απλώς τη διαθέσιμη. |
| tagline | The all-seeing. Open your next location where the data points. | Ο πανόπτης. Ανοίξτε το επόμενο σημείο εκεί που δείχνουν τα δεδομένα. |
| desc | A geospatial study for choosing where to open next: foot-traffic proxies, competitor density, demographics and accessibility, scored street by street. Built on the same methods we used to turn two million points of interest into a production network. | Γεωχωρική μελέτη για το πού να ανοίξετε το επόμενο σημείο: ενδείξεις κίνησης, πυκνότητα ανταγωνισμού, δημογραφικά και προσβασιμότητα, βαθμολογημένα δρόμο προς δρόμο. Πάνω στις ίδιες μεθόδους με τις οποίες μετατρέψαμε δύο εκατομμύρια σημεία ενδιαφέροντος σε δίκτυο παραγωγής. |
| roiBody | A flagship lease is a ten-year, seven-figure commitment decided in weeks. The big firms charge €25,000+ for the study that de-risks it. We deliver the same defensible answer in weeks, at a fraction, with the reasoning shown. | Μια ναυαρχίδα είναι δεκαετής δέσμευση επταψήφιου κόστους που κρίνεται σε λίγες εβδομάδες. Οι μεγάλες εταιρείες χρεώνουν €25.000+ για τη μελέτη που μειώνει το ρίσκο. Παραδίδουμε εξίσου τεκμηριωμένη απάντηση σε εβδομάδες, σε κλάσμα της τιμής, με το σκεπτικό ορατό. |
| audience | Retail chains, franchise networks, F&B groups and investors weighing their next opening in Greece. | Αλυσίδες λιανικής, δίκτυα franchise, όμιλοι εστίασης και επενδυτές που ζυγίζουν το επόμενο άνοιγμα στην Ελλάδα. |
| deliverable | A per-study report with maps, scores and a ranked recommendation. | Αναφορά ανά μελέτη με χάρτες, βαθμολογίες και τεκμηριωμένη κατάταξη. |
| priceNote | Per study, on a call | Ανά μελέτη, σε μια κλήση |

Stats EN: `€25k+` — what a big-firm location study costs · `10 yrs` — of lease riding on one decision · `weeks` — to a defensible answer, not months. (EL: `€25k+` / `10 έτη` / `εβδομάδες`.)

Features EN: Candidate scoring · Competitor density maps · Demand signals · A defensible recommendation (details in dict; EL: Βαθμολόγηση τοποθεσιών · Χάρτες ανταγωνισμού · Ενδείξεις ζήτησης · Τεκμηριωμένη πρόταση).

#### Tool 4 — Xenia (slug `ai-receptionist`, status `soon`)
| Field | EN | EL |
|---|---|---|
| role | AI receptionist | Ψηφιακή υποδοχή |
| benefit | Every enquiry answered, every booking captured. At 3 a.m. too. | Κάθε μήνυμα απαντημένο, κάθε κράτηση κερδισμένη. Και στις 3 τα ξημερώματα. |
| tagline | Hospitality, the ancient kind. Answers in Greek, books appointments, never sleeps. | Φιλοξενία, με την αρχαία έννοια. Απαντά στα ελληνικά, κλείνει ραντεβού, δεν κοιμάται ποτέ. |
| desc | An assistant trained on your services, prices and calendars that answers customers on your website and socials, in Greek and English, and turns conversations into bookings, around the clock and across every location. | Ένας βοηθός εκπαιδευμένος στις υπηρεσίες, τις τιμές και τα ημερολόγιά σας, που απαντά στους πελάτες στην ιστοσελίδα και τα κανάλιά σας, στα ελληνικά και στα αγγλικά, και μετατρέπει τις συζητήσεις σε κρατήσεις, όλο το εικοσιτετράωρο και σε κάθε μονάδα. |
| roiBody | Roughly a third of enquiries arrive outside opening hours, and at multi-location scale missed messages are a quiet, permanent revenue leak. Round-the-clock front-desk coverage costs salaries; this costs a fraction of one. | Περίπου το ένα τρίτο των μηνυμάτων έρχεται εκτός ωραρίου, και σε κλίμακα πολλών μονάδων τα αναπάντητα μηνύματα είναι μια αθόρυβη, μόνιμη διαρροή εσόδων. Η εικοσιτετράωρη κάλυψη υποδοχής κοστίζει μισθούς· αυτό κοστίζει κλάσμα ενός. |
| audience | Clinic networks, gym and salon groups, and restaurant chains where bookings arrive faster than staff can answer. | Δίκτυα κλινικών, όμιλοι γυμναστηρίων και κομμωτηρίων, και αλυσίδες εστίασης όπου οι κρατήσεις έρχονται πιο γρήγορα απ' όσο προλαβαίνει το προσωπικό. |
| deliverable | A managed assistant on your site and channels, with a monthly conversation report. | Διαχειριζόμενος βοηθός στην ιστοσελίδα και τα κανάλιά σας, με μηνιαία αναφορά συζητήσεων. |
| priceNote | Pricing on a call | Τιμολόγηση σε μια κλήση |

Stats EN: `24/7` — every enquiry answered, in two languages · `~1/3` — of enquiries arrive after hours · `<1/10` — the cost of staffed coverage. (EL: `24/7` / `~1/3` / `<1/10`.)

Features EN: Speaks your business · Takes bookings · Greek and English · Knows when to hand over (details in dict; EL: Μιλά τη γλώσσα της επιχείρησής σας · Κλείνει ραντεβού · Ελληνικά και αγγλικά · Ξέρει πότε να παραδώσει).

### 7.2 Workspace tools — `products/lib/tools-catalog.ts` (6) — the logged-in workspace launcher (NOT the marketing storefront)
This is the internal client-portal launcher list, distinct from the marketing storefront. Included for completeness; slugs match `portal_subscriptions.tool_slug`.

| slug | name | tagline | href | status | accent |
|---|---|---|---|---|---|
| ai-receptionist | Xenia | AI receptionist, books appointments and answers enquiries, by chat or phone, in Greek & English. | /products/xenia | ready | #8dcbff |
| collections | Plutus | Collections, predicts which invoices pay late, ranks who to chase, drafts the reminder (you approve). | /products/plutus | ready | #8dcbff |
| review-intelligence | Fama | Review intelligence, sentiment, themes, reply drafts and the few things to fix next. | /products/fama | ready | #8dcbff |
| site-selection | Panoptes | Site selection, demand, competition and access scored across a city, on a map. | /products/panoptes | ready | #8dcbff |
| site-audit | Aegis | Site audit, speed, accessibility (EU Accessibility Act) and SEO, with the fixes that matter. | /products/aegis | ready | #8dcbff |
| competitor-watch | Argus | Competitor watch, weekly intelligence on the moves your market is making. | /products/argus | preview | #8dcbff |

---

## 8. Contact — flow + copy (`contact-panel.tsx` + i18n `panel`)

Mechanism: message-first panel. The visitor writes (or taps a starter chip) FIRST; only on Send does step 2 ("where should we reply?") slide in asking name + email (+ optional company, country). On submit it POSTs to `/api/contact/` with `{name, email, message, company, country, sessionId, first, threadId, threadSig, website(honeypot)}`. The panel comment states "The Telegram payload (/api/contact) is unchanged" — messages are delivered to DS2 via **Telegram**. There is a hidden honeypot input named `website`. Thread continues after first send (locked thread with follow-up box). ⌘/Ctrl+Enter submits from the textarea. Maximized state shows `/logos/ds2-black.png`.

The homepage/footer/about/portfolio/tools all open this same panel via the shared `ContactCTA` ("Send a message"). The hero "Book a call" and each tool's "I'm interested" prefill the draft.

| Key | EN | EL |
|---|---|---|
| panel.title | Message DS2 | Μήνυμα στη DS2 |
| panel.introUnlocked | No forms, no login. Tell us what you're trying to do and it lands straight with the two of us. | Χωρίς φόρμες, χωρίς σύνδεση. Πείτε μας τι θέλετε να κάνετε και φτάνει κατευθείαν στους δυο μας. |
| panel.introLockedPrefix | Talking to | Μιλάτε με |
| panel.introLockedSuffix | . We read every message. | . Διαβάζουμε κάθε μήνυμα. |
| panel.phName | Your name (optional) | Το όνομά σας (προαιρετικό) |
| panel.phCompany | Company (optional) | Εταιρεία (προαιρετικό) |
| panel.phCountry | Where you're based (optional) | Πού εδρεύετε (προαιρετικό) |
| panel.phEmail | Email (so we can reply) | Email (για να απαντήσουμε) |
| panel.ackBase | Message received | Το μήνυμα παραλήφθηκε |
| panel.ackWithEmail | · we'll reply by email within the day | · θα απαντήσουμε με email εντός της ημέρας |
| panel.ackNoEmail | · we'll reply within the day | · θα απαντήσουμε εντός της ημέρας |
| panel.composeLocked | Add another message… | Προσθέστε άλλο μήνυμα… |
| panel.composeUnlocked | What are you trying to build? | Τι θέλετε να φτιάξετε; |
| panel.send | Send | Αποστολή |
| panel.sending | Sending… | Αποστολή… |
| panel.footSent | Sent · Athens / London | Στάλθηκε · Αθήνα / Λονδίνο |
| panel.footIdle | Athens / London · usually same-day | Αθήνα / Λονδίνο · συνήθως αυθημερόν |
| panel.errName | Add your name first. | Προσθέστε πρώτα το όνομά σας. |
| panel.errEmail | Add your email so we can reply. | Προσθέστε το email σας για να απαντήσουμε. |
| panel.errEmailInvalid | That email doesn't look right. | Αυτό το email δεν φαίνεται σωστό. |
| panel.errMsg | Write a message first. | Γράψτε πρώτα ένα μήνυμα. |
| panel.errGeneric | Something went wrong. Try again. | Κάτι πήγε στραβά. Δοκιμάστε ξανά. |
| panel.errNetwork | Couldn't reach us. Check your connection and retry. | Δεν μπορέσαμε να επικοινωνήσουμε. Ελέγξτε τη σύνδεσή σας και ξαναδοκιμάστε. |
| panel.close / minimise / maximise / restore | Close / Minimise / Maximise / Restore | Κλείσιμο / Ελαχιστοποίηση / Μεγιστοποίηση / Επαναφορά |
| panel.reopen | Reopen your message to DS2 | Ξανανοίξτε το μήνυμά σας στη DS2 |
| panel.detailsTitle | Where should we reply? | Πού να απαντήσουμε; |
| panel.detailsHint | Your message is ready. We just need a way to get back to you. | Το μήνυμά σας είναι έτοιμο. Χρειαζόμαστε μόνο έναν τρόπο να σας απαντήσουμε. |
| panel.back | Edit message | Επεξεργασία μηνύματος |
| panel.promise | We reply the same day. | Απαντάμε την ίδια μέρα. |
| panel.tab | Message DS2 | Μήνυμα στη DS2 |

Starter chips (label — draft):
| EN | EL |
|---|---|
| I need a website — "Hi DS2, we need a website that " | Θέλω ιστοσελίδα — "Γεια σας DS2, χρειαζόμαστε μια ιστοσελίδα που " |
| Automate something — "Hi DS2, we want to automate " | Αυτοματοποίηση — "Γεια σας DS2, θέλουμε να αυτοματοποιήσουμε " |
| Not sure, let's talk — "Hi DS2, not sure exactly what we need yet. Our situation: " | Δεν είμαι σίγουρος, ας τα πούμε — "Γεια σας DS2, δεν ξέρουμε ακόμη τι ακριβώς χρειαζόμαστε. Η κατάστασή μας: " |

Contact email throughout: **ds2consulting.contact@gmail.com**.

---

## 9. Nav + footer

### Nav
- **Homepage nav** links: About · Tools · Projects. (+ LangToggle, Send-a-message CTA, mobile menu.)
- **Sub-page nav** (`PageChrome`) links: About · Tools · Projects · **Blog**.
- **Mobile menu** (`mobile-menu.tsx`) links: Home · About · Tools · Projects · Blog. Eyebrow = footer.navLabel ("Navigation"/"Πλοήγηση"); cue = footer.headline; place = footer.locations. a11y: openMenu/closeMenu.

### Footer (`site-footer.tsx` + i18n `footer`)
Left: headline + Send-a-message CTA. Middle: Navigation column (Home, Services `/#services`, About, Tools, Projects). Right: Get-in-touch (email mailto, "Based in" + locations). Bottom: spinning DS2 mark + copyright.

| Key | EN | EL |
|---|---|---|
| footer.copyright | © 2026 DS2, Digital Solutions Consulting · Athens · London | © 2026 DS2, Ψηφιακές Λύσεις Συμβουλευτική · Αθήνα · Λονδίνο |
| footer.services | Services | Υπηρεσίες |
| footer.portfolio | Projects | Έργα |
| footer.about | About | Σχετικά |
| footer.home | Home | Αρχική |
| footer.tools | Tools | Εργαλεία |
| footer.headline | Digital solutions, built and owned end to end. | Ψηφιακές λύσεις, χτισμένες και υποστηριγμένες ως το τέλος. |
| footer.navLabel | Navigation | Πλοήγηση |
| footer.reachLabel | Get in touch | Επικοινωνία |
| footer.email | ds2consulting.contact@gmail.com | ds2consulting.contact@gmail.com |
| footer.basedLabel | Based in | Έδρα |
| footer.locations | Athens · London | Αθήνα · Λονδίνο |

### a11y labels (i18n `a11y`)
home (DS2, home / DS2, αρχική) · openMenu (Open menu / Άνοιγμα μενού) · closeMenu (Close menu / Κλείσιμο μενού) · language (Language / Γλώσσα) · loading (DS2 loading / DS2, φόρτωση) · logo (DS2 logo / Λογότυπο DS2) · background (Background / Υπόβαθρο).

### Blog page shell (`/blog`) — static copy (English hard-coded, NOT in i18n)
- Metadata title: "Blog · DS2, Digital Solutions Consulting". Description: "Practical, honest articles on websites, applied AI and running a business online, from a senior team in Athens and London."
- Eyebrow: "DS2 · Blog". Title: "Notes that hold up *in practice*".
- Sub: "What things really cost, what creates risk, and what we would do differently, for websites, applied AI and running a business online. In Greek and English."
- Empty state: "Nothing published yet, the first articles are on their way."
- Article rows are data-driven (`loadPublishedArticles()` from `blog-source.ts`), showing date, topic tag, EN/EL lang tag, title link, description.
- Newsletter form (`newsletter-form.tsx`, bilingual COPY, posts to `/api/blog/subscribe`):
  - EN: title "Get the next article by email" · sub "Practical notes on websites, AI and running a business online. No fluff, unsubscribe any time." · placeholder "you@company.com…" · button "Subscribe" · done "You are on the list. Thanks, we keep it short and useful." · error "That did not go through. Check the email and try again." · label "Email address".
  - EL: "Το επόμενο άρθρο στο email σας" · "Πρακτικές σημειώσεις για websites, AI και online επιχειρήσεις. Χωρίς φλυαρία, διαγραφή όποτε θέλετε." · placeholder same · "Εγγραφή" · "Είστε στη λίστα. Ευχαριστούμε, την κρατάμε σύντομη και χρήσιμη." · "Κάτι πήγε στραβά. Ελέγξτε το email και δοκιμάστε ξανά." · "Διεύθυνση email".

---

## 10. Asset manifest (files under `apps/ds-site/public/`)

All paths confirmed to exist via `ls`. Marketing-relevant assets:

### Hero (`/hero/`)
- `/hero/hero-loop.mp4` (desktop film)
- `/hero/hero-loop-mobile.mp4` (portrait film)
- `/hero/hero-poster.jpg` (desktop poster)
- `/hero/hero-poster-mobile.jpg` (portrait poster)

### Portal journey (`/portals/`) — referenced: `journey.mp4`, `journey-mobile.mp4`, `journey-poster.jpg`
Full directory (many are source/experimental portal frames; the two videos + poster are the live ones):
- `journey.mp4`, `journey-mobile.mp4`, `journey-poster.jpg` (LIVE, used by `portal-journey.tsx`)
- `greece-portal-transparent.webp`, `london-portal-simple-transparent.webp`
- `portal-columns-floor-double-chroma.png`, `portal-columns-floor-double-transparent.png`, `portal-columns-floor-double-transparent.webp`
- `portal-columns-floor-single-chroma.png`, `portal-columns-floor-single-transparent.png`, `portal-columns-floor-single-transparent.webp`
- `portal-columns-road-perspective-chroma.png`, `portal-columns-road-perspective-close-transparent.png`, `portal-columns-road-perspective-transparent.png`, `portal-columns-road-perspective-transparent.webp`
- `portal-corridor-concept-chroma.png`, `portal-corridor-concept-transparent.png`
- `portal-gate-road-chroma.png`, `portal-gate-road-transparent.png`
- `portal-road-chroma.png`, `portal-road-premium-chroma.png`, `portal-road-premium-transparent.png`, `portal-road-premium-transparent.webp`, `portal-road-transparent.png`

### Portfolio / featured (`/portfolio/`)
- `/portfolio/globalteamplans.png`
- `/portfolio/dataportfolio.png`

### Services atmospheres (`/services/`) — card bg + expanded wide bg per category
- `/services/atmos-brand.webp`, `/services/atmos-brand-wide.webp`
- `/services/atmos-internal.webp`, `/services/atmos-internal-wide.webp`
- `/services/atmos-custom.webp`, `/services/atmos-custom-wide.webp`

### Founder photos (`/founders/`)
- `/founders/london.png` (Dimitris)
- `/founders/athens.png` (Stelios)
- `/founders/dimitris.svg`, `/founders/stelios.svg` (present, not referenced by about-story.tsx)

### Founder logo chips (`/founders/logos/`)
- `/founders/logos/intelmatix.jpg` (Dimitris — Intelmatix chip)
- `/founders/logos/pwc.png` (present; note the "Big 4" chip is text-only, so pwc.png is not currently wired in)
- (UCL, Big 4, Netherlands render as text chips — no image files)

### Tool posters (`/tools/posters/`)
- `/tools/posters/competitor-watch.webp` (Argus)
- `/tools/posters/review-intelligence.webp` (Fama)
- `/tools/posters/site-selection.webp` (Panoptes)
- `/tools/posters/ai-receptionist.webp` (Xenia)
- Tool demo videos: `/tools/videos/{slug}.mp4` — referenced by code but NONE present yet.

### Powered-by stack logos (`/logos/tools/`) — 12 monochrome SVG masks
`anthropic.svg`, `cloudflare.svg`, `googlegemini.svg`, `nextdotjs.svg`, `openai.svg`, `postgresql.svg`, `python.svg`, `react.svg`, `supabase.svg`, `tailwindcss.svg`, `typescript.svg`, `vercel.svg`.

### Brand logos (`/logos/` and `/brand/`)
- Used by code: `/logos/ds2-black.png` (contact panel brand + maximized header).
- Other logo files present (`/logos/`): `black_DS2_logo.png`, `ds2-a.png`, `ds2-black.png`, `ds2-d.png`, `ds2-logo.png`, `ds2-white.png`, `logo-black.png`, `logo-outline.png`, `logo-white.png`.
- `/brand/`: `ds2-mark.png`, `ds2-wordmark-white.png`.
- The nav / footer / hero DS2 mark is an inline SVG component (`ds2-mark.tsx`, `DS2Mark`), not a file asset.

---

## 11. Reserve copy (in the dict but NOT rendered by current shells)

Preserved for completeness — rebuild may re-activate these.

### `engage` (three modes + comparison) — folded into Services on the live homepage
- eyebrow: "How we engage" / "Πώς συνεργαζόμαστε"
- title + titleEm: "Three modes. *You pick one.*" / "Τρεις τρόποι. *Διαλέγετε εσείς.*"
- sub: "No bundles, no upsell. Each mode is its own contract, scoped to what you actually need." / "Χωρίς πακέτα, χωρίς upsell. Κάθε τρόπος είναι ξεχωριστή συμφωνία, προσαρμοσμένη σε αυτό που πραγματικά χρειάζεστε."
- MODE 01 End-to-end. — best: "early ideas, ambiguous problems, full accountability under one roof." — desc: "Strategy, design, build and handoff under one roof. Where challenge-first pays back the most."
- MODE 02 Consulting only. — best: "teams who already build, but want a second pair of senior eyes." — desc: "We pressure-test the plan, the architecture and the team, without writing a line of code."
- MODE 03 Build only. — best: "when the spec is clear and you need senior hands to ship it." — desc: "You bring the spec. We ship it with senior engineers and weekly visibility, in code we'd maintain ourselves."
- rows: Strategy & diagnostic / Build & delivery / Handover docs / Stewardship (EL: Στρατηγική & διάγνωση / Υλοποίηση & παράδοση / Τεκμηρίωση παράδοσης / Επίβλεψη)
- tags: included / n/a / add-on (EL: περιλαμβάνεται / n/a / προαιρετικό)
- stewardshipTag "Optional"; stewardshipLead "Stewardship."; stewardshipRest: "A monthly retainer after delivery. We keep eyes on what we built. Patching, monitoring, and the occasional honest call when something's drifting."
- ctaText: "Not sure which one fits? Tell us what you're trying to do and we'll point you straight."

### `founders` (homepage team block) — now on About page
- eyebrow "Team"; title "Two senior founders. *No layers in between.*"; sub "When you talk to DS2, you talk to one of these two. You're never handed off to junior staff, however big the project gets."; role "Founder".
- f1Title "Head of Strategy & Consulting." / f1Desc "Client relationships, commercial strategy, advisory. The person who asks the uncomfortable questions early, so they're not asked late by someone with less context." / f1Loc "Athens".
- f2Title "Head of Engineering & Data." / f2Desc "Architecture, data and ML, technical delivery. The person who decides whether what we're proposing will still be standing in three years, and says so before we ship it." / f2Loc "London".

### `about.blocks` (4 numbered story blocks) — not rendered by about-story.tsx
- 01 · Where we come from — "We are both from Athens, and we have been close to technology since we were young. Building things, breaking them, understanding how they work. That exposure shaped how we think long before it became a job."
- 02 · What we kept seeing — "Athens moves slower on technology than it should, and that gap compounds. Left alone it becomes a real disadvantage for the businesses here, not in some distant future but in the next few years."
- 03 · Why DS2 — "So we decided to help, concretely. There are many small and medium businesses doing serious work with tools that hold them back. We want to help them get better day by day, product by product. Raise the technical literacy. Remove the bottlenecks. Help in as many ways as we usefully can."
- 04 · The standard we hold — "Our work is premium and we keep the quality high, on purpose. A lot of that comes from working in London, inside a more advanced and more organised working culture. We took what works there and brought it home, without the bloat."
- (Greek equivalents in dict.)

---

*End of inventory. Source files were read only, not modified.*
