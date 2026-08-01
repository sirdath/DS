/**
 * DS2 site copy, EN + EL.
 * Greek is a first professional draft, review/refine before treating as final.
 * Inline markup conventions:
 *   - titles split into plain + `Em` (rendered inside <em>)
 *   - <hl>…</hl> in compose-draft strings is parsed by the typewriter
 */

export type Lang = "en" | "el";

type SvcOffering = { name: string; detail: string };
type PanelChip = { label: string; draft: string };
type ToolFeature = { name: string; detail: string };
type ToolStat = { value: string; label: string };
type ToolDef = {
  slug: string;
  status: "early" | "soon";
  name: string;
  role: string;
  benefit: string;
  tagline: string;
  desc: string;
  roiBody: string;
  stats: ToolStat[];
  features: ToolFeature[];
  audience: string;
  deliverable: string;
  priceNote: string;
};
type SvcCat = { key: "brand" | "internal" | "custom"; tag: string; name: string; tagline: string; desc: string; example: string; items: SvcOffering[] };
type EngageMode = { num: string; title: string; best: string; bestLabel: string; desc: string };
type AboutBlock = { k: string; p: string };
type ScrollPage = { id: string; eyebrow: string; title: string; body: string };
type FeatItem = { tag: string; name: string; blurb: string; url: string; img: string };
type Two<T> = [T, T];
type CaseItem = { tag: string; meta: string; title: string; text: string; list: string[] };
type Seven<T> = [T, T, T, T, T, T, T];
type Eight<T> = [T, T, T, T, T, T, T, T];
type Nine<T> = [T, T, T, T, T, T, T, T, T];
type Six<T> = [T, T, T, T, T, T];
type Four<T> = [T, T, T, T];
type Three<T> = [T, T, T];

export interface Dict {
  nav: { portfolio: string; about: string; tools: string; blog: string; services: string };
  cta: { send: string };
  poweredBy: string;
  a11y: { home: string; openMenu: string; closeMenu: string; language: string; loading: string; logo: string; background: string };
  hero: {
    tag1: string;
    tag2: string;
    heroTitle: string;
    heroTitleEm: string;
    sub: string;
    what: string;
    tags: string[];
    build: string[];
    buildLabel: string;
    book: { title: string; role: string; cta: string; draft: string };
  };
  services: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    detailCta: string;
    expand: string;
    collapse: string;
    cats: Three<SvcCat>;
  };
  featured: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    visit: string;
    viewAll: string;
    items: Two<FeatItem>;
  };
  thesis: {
    eyebrow: string;
    scrollCue: string;
    s1Title: string; s1Em: string; s1End: string; s1Body: string;
    s2Eyebrow: string; s2Title: string; s2Em: string; s2Body: string;
    by: string;
  };
  engage: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    modes: Three<EngageMode>;
    rows: { strategy: string; build: string; handover: string; stewardship: string };
    tags: { included: string; none: string; addon: string };
    stewardshipTag: string;
    stewardshipLead: string;
    stewardshipRest: string;
    ctaText: string;
  };
  founders: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    role: string;
    f1Title: string;
    f1Desc: string;
    f1Loc: string;
    f2Title: string;
    f2Desc: string;
    f2Loc: string;
  };
  how: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    beats: Four<{ n: string; title: string; body: string }>;
    sig1: string;
    sig2: string;
    sig3: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    titleEm: string;
    titleEnd: string;
    sub: string;
    newMessage: string;
    from: string;
    to: string;
    subject: string;
    draftSubject: string;
    draftBody: string[];
    statusDrafting: string;
    statusReady: string;
    caption: string;
    tools: { attach: string; format: string; image: string; sign: string; stationery: string; send: string };
  };
  footer: {
    copyright: string;
    services: string;
    portfolio: string;
    about: string;
    home: string;
    tools: string;
    headline: string;
    navLabel: string;
    reachLabel: string;
    email: string;
    basedLabel: string;
    locations: string;
  };
  about: {
    eyebrow: string;
    title: string;
    titleEm: string;
    titleEnd: string;
    sub: string;
    blocks: Four<AboutBlock>;
    scrollbook: Six<ScrollPage>;
    missionK: string;
    mission: string;
    visionK: string;
    vision: string;
    cityAthens: string;
    cityLondon: string;
    citiesCap: string;
    cityNetherlands: string;
    coda: string;
  };
  portfolio: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    cases: Four<CaseItem>;
    coda: string;
  };
  toolsTeaser: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    cta: string;
  };
  tools: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    statusEarly: string;
    statusSoon: string;
    view: string;
    interestCta: string;
    interestDraft: string;
    audienceLabel: string;
    deliverableLabel: string;
    pricingLabel: string;
    featuresLabel: string;
    roiLabel: string;
    backAll: string;
    videoSoon: string;
    items: Nine<ToolDef>;
  };
  panel: {
    title: string;
    introUnlocked: string;
    introLockedPrefix: string;
    introLockedSuffix: string;
    phName: string;
    phCompany: string;
    phCountry: string;
    phEmail: string;
    ackBase: string;
    ackWithEmail: string;
    ackNoEmail: string;
    composeLocked: string;
    composeUnlocked: string;
    send: string;
    sending: string;
    footSent: string;
    footIdle: string;
    errName: string;
    errEmail: string;
    errEmailInvalid: string;
    errMsg: string;
    errGeneric: string;
    errNetwork: string;
    close: string; minimise: string; maximise: string; restore: string; reopen: string;
    chips: Three<PanelChip>;
    detailsTitle: string;
    detailsHint: string;
    back: string;
    promise: string;
    tab: string;
  };
}

const en: Dict = {
  nav: { portfolio: "Projects", about: "About", tools: "Tools", blog: "Blog", services: "Services" },
  cta: { send: "Book a call" },
  poweredBy: "Powered by",
  a11y: { home: "DS2, home", openMenu: "Open menu", closeMenu: "Close menu", language: "Language", loading: "DS2 loading", logo: "DS2 logo", background: "Background" },
  hero: {
    tag1: "Digital Solutions",
    tag2: "consulting",
    heroTitle: "Digital solutions, built and ",
    heroTitleEm: "owned end to end.",
    sub: "A senior team for strategy, engineering, and applied AI. We work best when we can be honest early, even if that means challenging the initial idea.",
    what: "What we do",
    tags: ["Websites & Online Shops", "Automation & AI", "Data & Forecasts", "Custom Builds"],
    build: ["Websites", "Automation", "AI Integration"],
    buildLabel: "What we build",
    book: { title: "Talk with us", role: "Founders · Athens & London", cta: "Book a 15-min call", draft: "Hi, I'd like to book a 15-minute intro call." },
  },
  services: {
    eyebrow: "What we build",
    title: "Two standard builds,",
    titleEm: "or one that's only yours.",
    sub: "Most projects fit one of two standards. If yours doesn't, we build exactly what you describe, from scratch. Advice only, build only, or everything together — with optional care after launch.",
    detailCta: "Start a conversation",
    expand: "Expand for more info",
    collapse: "Minimise",
    cats: [
      {
        key: "brand",
        tag: "Standard",
        name: "Brand Upgrade",
        tagline: "Your public face — a site that looks credible and brings you customers.",
        desc: "The work people see first. We rebuild your website or shop so it loads fast, looks trustworthy, and turns visitors into paying customers. Built end to end — and we take responsibility for it.",
        example: "We built globalteamplans.com and dataportfolio.co.uk. For clothing shops and sports venues we already have ready-made designs, so you launch faster and cheaper.",
        items: [
          { name: "Websites", detail: "Fast, good-looking sites that show up on Google and win trust." },
          { name: "Online shops", detail: "Sell online with a smooth checkout. A ready clothing-shop design can get you live fast." },
          { name: "Booking systems", detail: "Calendar, availability and payments for clubs, studios and clinics — with a ready design for sports venues." },
          { name: "Web apps & platforms", detail: "Logged-in products and tools that feel as smooth as a native app." },
          { name: "SaaS products", detail: "Subscription software, from the first screen to billing and onboarding." },
          { name: "Mobile apps", detail: "iOS and Android apps, designed and built by us." },
        ],
      },
      {
        key: "internal",
        tag: "Standard",
        name: "Internal Rewiring",
        tagline: "The work behind the work — automated, so you win back hours every week.",
        desc: "The systems your customers never see. We connect your tools, remove the repetitive work, and make your own data useful — fewer manual hours, fewer mistakes, and straight answers when you need them.",
        example: "Think invoices, bookings, reports and follow-ups that handle themselves — and a front desk that never misses an enquiry.",
        items: [
          { name: "Automation", detail: "The repeating work between your tools, handled quietly in the background." },
          { name: "AI receptionist", detail: "Answers customers and books appointments 24/7, in Greek and English. In development — ask us." },
          { name: "Website chatbot", detail: "Answers questions on your site from your real info — prices, hours, services. In development." },
          { name: "AI agents by the hour", detail: "Hand tasks to AI agents — research, data entry, follow-ups — priced per hour of use. Early access." },
          { name: "Data & forecasts", detail: "Straight answers from your numbers, and a view of what next month looks like." },
          { name: "Interactive newsletters", detail: "Animated newsletters your customers actually read — we can handle the sending too. In development." },
          { name: "Loyalty & in-store tools", detail: "Digital loyalty cards in Apple and Google Wallet, tap-to-review stands, digital menus. In the works." },
        ],
      },
      {
        key: "custom",
        tag: "Bespoke",
        name: "Custom Solution",
        tagline: "Anything you can describe, built from scratch. If it doesn't fit a box above, it fits here.",
        desc: "When the problem is yours alone, the build should be too. We scope it with you, tell you honestly where it creates risk, and build exactly what the problem needs — nothing more.",
        example: "Start with a conversation. We'll tell you what we would do — and what we wouldn't.",
        items: [
          { name: "CRM systems", detail: "A sales and client hub shaped around how you work, not a template." },
          { name: "Marketplaces", detail: "Two-sided platforms that connect buyers and sellers." },
          { name: "Internal tools & dashboards", detail: "The admin panels your team wishes they had." },
          { name: "Data pipelines", detail: "Your data moved, cleaned and joined — ready the moment you need it." },
          { name: "Marketing & competitor dashboards", detail: "Your market, competitors and campaign results in one clear picture." },
          { name: "Whatever you can describe", detail: "If you can describe it, we can scope it and build it." },
        ],
      },
    ],
  },
  featured: {
    eyebrow: "Our work",
    title: "A look at ",
    titleEm: "what we've built.",
    sub: "Real builds you can click through — the rest live in our projects.",
    visit: "Visit",
    viewAll: "See all projects",
    items: [
      { tag: "Website · SEO · Ads", name: "GlobalTeamPlans", blurb: "A focused marketing site, built to be found.", url: "https://globalteamplans.com", img: "globalteamplans" },
      { tag: "SaaS · Product", name: "dataportfolio.co.uk", blurb: "From idea to a working portfolio-builder SaaS.", url: "https://dataportfolio.co.uk", img: "dataportfolio" },
    ],
  },
  thesis: {
    eyebrow: "A working principle",
    scrollCue: "Scroll",
    s1Title: "The biggest cost is ",
    s1Em: "lack of knowledge",
    s1End: ".",
    s1Body: "We're Athens-based, set on closing the technical-literacy gap that quietly holds local businesses back.",
    s2Eyebrow: "Athens → London",
    s2Title: "Trained where the ",
    s2Em: "standards are set",
    s2Body: "We keep active clients in London, learning the UK market's best practices first-hand, then bringing them home to every Athens build.",
    by: "DS2",
  },
  engage: {
    eyebrow: "How we engage",
    title: "Three modes.",
    titleEm: "You pick one.",
    sub: "No bundles, no upsell. Each mode is its own contract, scoped to what you actually need.",
    modes: [
      {
        num: "MODE 01",
        title: "End-to-end.",
        bestLabel: "Best for:",
        best: " early ideas, ambiguous problems, full accountability under one roof.",
        desc: "Strategy, design, build and handoff under one roof. Where challenge-first pays back the most.",
      },
      {
        num: "MODE 02",
        title: "Consulting only.",
        bestLabel: "Best for:",
        best: " teams who already build, but want a second pair of senior eyes.",
        desc: "We pressure-test the plan, the architecture and the team, without writing a line of code.",
      },
      {
        num: "MODE 03",
        title: "Build only.",
        bestLabel: "Best for:",
        best: " when the spec is clear and you need senior hands to ship it.",
        desc: "You bring the spec. We ship it with senior engineers and weekly visibility, in code we'd maintain ourselves.",
      },
    ],
    rows: {
      strategy: "Strategy & diagnostic",
      build: "Build & delivery",
      handover: "Handover docs",
      stewardship: "Stewardship",
    },
    tags: { included: "included", none: "n/a", addon: "add-on" },
    stewardshipTag: "Optional",
    stewardshipLead: "Stewardship.",
    stewardshipRest: " A monthly retainer after delivery. We keep eyes on what we built. Patching, monitoring, and the occasional honest call when something's drifting.",
    ctaText: "Not sure which one fits? Tell us what you're trying to do and we'll point you straight.",
  },
  founders: {
    eyebrow: "Team",
    title: "Two senior founders.",
    titleEm: "No layers in between.",
    sub: "When you talk to DS2, you talk to one of these two. You're never handed off to junior staff, however big the project gets.",
    role: "Founder",
    f1Title: "Head of Strategy & Consulting.",
    f1Desc: "Client relationships, commercial strategy, advisory. The person who asks the uncomfortable questions early, so they're not asked late by someone with less context.",
    f1Loc: "Athens",
    f2Title: "Head of Engineering & Data.",
    f2Desc: "Architecture, data and ML, technical delivery. The person who decides whether what we're proposing will still be standing in three years, and says so before we ship it.",
    f2Loc: "London",
  },
  how: {
    eyebrow: "How we work",
    title: "Challenge-first,",
    titleEm: "transparent delivery.",
    sub: "The same four beats run through every engagement. It's how we protect the work, and you, before a single line is written.",
    beats: [
      { n: "01", title: "Diagnose and challenge", body: "We assess what's working, what isn't, and what we'd do differently, even against the brief you arrived with." },
      { n: "02", title: "Say what creates risk", body: "Never “this is wrong.” Always “this creates risk because…” Protective framing, not judgment." },
      { n: "03", title: "Alternatives with reasoning", body: "Every critique comes with a constructive alternative and its trade-offs, so you can choose with the full picture." },
      { n: "04", title: "Decision pause", body: "“You don't need to decide now. Take the time, we're happy to proceed either way.”" },
    ],
    sig1: "We work best when we can be honest early, even if that means challenging the initial idea.",
    sig2: "Projects end; responsibility doesn't.",
    sig3: "We don't certify your organisation, we take responsibility for what we build.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Tell us what you're ",
    titleEm: "actually",
    titleEnd: " trying to do.",
    sub: "We reply within one business day.",
    newMessage: "New Message",
    from: "From:",
    to: "To:",
    subject: "Subject:",
    draftSubject: "Our website looks like it was built in 2014.",
    draftBody: [
      "Hi DS2, we run a <hl>family-owned restaurant group</hl> with four locations around the city. Our current site is a template we haven't touched in years and it shows.",
      "We want something that actually looks <hl>premium</hl>, loads fast on a phone, with online bookings and menus we can keep updated ourselves.",
      "Can we book a 30-minute call next week?",
    ],
    statusDrafting: "Drafting · Athens / London",
    statusReady: "Ready to send · Athens / London",
    caption: "// Founded 2026. Or just write us at ",
    tools: { attach: "Attach", format: "Format", image: "Image", sign: "Sign", stationery: "Stationery", send: "Send" },
  },
  footer: {
    copyright: "© 2026 DS2, Digital Solutions Consulting · Athens · London",
    services: "Services",
    portfolio: "Projects",
    about: "About",
    home: "Home",
    tools: "Tools",
    headline: "Digital solutions, built and owned end to end.",
    navLabel: "Navigation",
    reachLabel: "Get in touch",
    email: "ds2consulting.contact@gmail.com",
    basedLabel: "Based in",
    locations: "Athens · London",
  },
  about: {
    eyebrow: "About us",
    title: "Two founders from Athens, building what the city was ",
    titleEm: "missing.",
    titleEnd: "",
    sub: "We grew up here, around technology. We kept seeing the same gap. That is why DS2 exists.",
    blocks: [
      {
        k: "01 · Where we come from",
        p: "We are both from Athens, and we have been close to technology since we were young. Building things, breaking them, understanding how they work. That exposure shaped how we think long before it became a job.",
      },
      {
        k: "02 · What we kept seeing",
        p: "Athens moves slower on technology than it should, and that gap compounds. Left alone it becomes a real disadvantage for the businesses here, not in some distant future but in the next few years.",
      },
      {
        k: "03 · Why DS2",
        p: "So we decided to help, concretely. There are many small and medium businesses doing serious work with tools that hold them back. We want to help them get better day by day, product by product. Raise the technical literacy. Remove the bottlenecks. Help in as many ways as we usefully can.",
      },
      {
        k: "04 · The standard we hold",
        p: "Our work is premium and we keep the quality high, on purpose. A lot of that comes from working in London, inside a more advanced and more organised working culture. We took what works there and brought it home, without the bloat.",
      },
    ],
    scrollbook: [
      {
        id: "mission",
        eyebrow: "Mission",
        title: "Make Greek businesses genuinely proficient with technology.",
        body: "Close the gap between what they do well and the tools that could take them much further.",
      },
      {
        id: "vision",
        eyebrow: "Vision",
        title: "A Greece that evolves drastically.",
        body: "Where small and medium businesses compete on a global level, because technology stopped holding them back.",
      },
      {
        id: "gap",
        eyebrow: "The gap",
        title: "The work is serious. The tools are not.",
        body: "Real businesses run on systems that quietly hold them back: thin tooling, manual process, low technical literacy. Left alone, the gap compounds.",
      },
      {
        id: "dimitris",
        eyebrow: "Engineering & Data · London",
        title: "Dimitris",
        body: "Studied and built in London. He brings the technical core, architecture, data systems, automation and applied AI, held to the standard of a more demanding market.",
      },
      {
        id: "stelios",
        eyebrow: "Consulting & Strategy · Athens",
        title: "Stelios",
        body: "Studied in the Netherlands, then consulting at a Big 4 firm in Athens. He brings business structure, operating discipline and a clear read of the Greek market.",
      },
      {
        id: "ds2",
        eyebrow: "Why DS2",
        title: "Two disciplines, one team.",
        body: "Engineering depth and consulting discipline, with real proximity to the Greek market. That combination is what lets us deliver the mission.",
      },
    ],
    missionK: "Mission",
    mission: "To make Greek businesses genuinely proficient with technology, closing the gap between what they do and the tools that could take them much further.",
    visionK: "Vision",
    vision: "A Greece that evolves drastically: where small and medium businesses compete on a global level, because technology stopped holding them back.",
    cityAthens: "Athens",
    cityLondon: "London",
    citiesCap: "Athens and London, where we live and work",
    cityNetherlands: "Netherlands",
    coda: "We work best when we can be honest early, even if that means challenging the initial idea.",
  },
  portfolio: {
    eyebrow: "Selected work",
    title: "A few engagements, ",
    titleEm: "told straight.",
    sub: "Early work, named where the client is happy to be. We say what we did, and what we did not.",
    cases: [
      {
        tag: "Websites",
        meta: "Website · SEO · Google Ads",
        title: "A focused marketing site, built to be found.",
        text: "We designed and built the site end to end, then made sure it would actually get traffic: technical and on-page SEO, plus a Google Ads account set up and launched so it started reaching people from day one.",
        list: ["Website design and build", "Technical and on-page SEO", "Google Ads setup and launch"],
      },
      {
        tag: "Websites",
        meta: "SaaS · Product build",
        title: "A SaaS for building portfolios.",
        text: "The client wanted to launch a product that lets people build portfolios. We took it from idea to a working SaaS: the application itself and the site around it.",
        list: ["Product and UX build", "Full SaaS application", "Marketing site around the product"],
      },
      {
        tag: "Websites",
        meta: "Medical exam prep · UK · Consulting",
        title: "A leading UK platform helping doctors prepare for their exams.",
        text: "We ran the technical consulting end to end on the decisions that mattered. Which stack to build on, which roles to hire and in what order, and we helped them find the people. Alongside the advice we produced a high quality design prototype of their site, to give them real leverage on build quotes and a stronger direction for the UI.",
        list: ["Stack and architecture guidance", "Hiring plan and sourcing support", "High-quality design prototype for pricing leverage and UI direction"],
      },
      {
        tag: "Data solutions",
        meta: "Geospatial · Data science",
        title: "A geospatial node network from two million points of interest.",
        text: "A data and AI company handed us a dataset of around two million points of interest. We turned it into a geospatial network of nodes they could use directly inside one of their production products.",
        list: ["Ingested and cleaned roughly 2M POIs", "Built a connected geospatial node network", "Delivered for use inside their live product"],
      },
    ],
    coda: "If you want a second senior opinion before you commit, that is exactly where we are useful.",
  },
  toolsTeaser: {
    eyebrow: "For larger organisations",
    title: "Decision intelligence, ",
    titleEm: "as a service.",
    sub: "Our services are shaped around small and medium businesses. For groups, chains and scale-ups we run the DS2 decision-intelligence tools: continuous market, reputation and location intelligence, delivered as decisions your team can act on.",
    cta: "Explore the tools",
  },
  tools: {
    eyebrow: "DS2 tools",
    title: "Tools we run ",
    titleEm: "for you.",
    sub: "Productized services: you subscribe, we run the machinery, and the results land in your inbox and your portal. No dashboards to learn, no software to manage.",
    statusEarly: "Early access",
    statusSoon: "Coming soon",
    view: "See the tool",
    interestCta: "I'm interested",
    interestDraft: "Hi DS2, I'm interested in {tool}. ",
    audienceLabel: "Who it's for",
    deliverableLabel: "What you receive",
    pricingLabel: "Pricing",
    featuresLabel: "What it does",
    roiLabel: "What it's worth",
    backAll: "All tools",
    videoSoon: "Short demo film coming here.",
    items: [
      {
        slug: "competitor-watch",
        status: "early",
        name: "Competitor intelligence",
        role: "Argus",
        benefit: "Know every competitor move before your Monday meeting.",
        tagline: "The hundred-eyed watchman. We watch your competitors so you don't have to.",
        desc: "Define the competitive set your board already asks about. Every week our agents read their websites, prices, offers, reviews and search visibility, and your team gets a digest with only what changed and why it matters.",
        roiBody: "Strategy teams pay agencies €2,000+ for a one-off competitor report that is stale within a month, or burn analyst days rebuilding the same picture by hand. This is the same intelligence, continuous, at a fraction of either.",
        stats: [
          { value: "10+ h", label: "of analyst time returned, every week" },
          { value: "€2,000+", label: "the going rate for one static agency report" },
          { value: "52×", label: "briefings a year, not one stale deck" },
        ],
        features: [
          { name: "Weekly digest", detail: "A short Monday brief, written for an owner, not an analyst. Only the changes that matter." },
          { name: "Price & offer tracking", detail: "New packages, discounts and menu or price changes, caught the week they happen." },
          { name: "Review monitoring", detail: "What customers praise and complain about across your rivals, summarised." },
          { name: "Search visibility", detail: "Who ranks where for the searches that bring you customers, tracked over time." },
        ],
        audience: "Strategy, commercial and marketing teams at groups, chains and scale-ups that answer for market position.",
        deliverable: "A Monday email digest, with the full archive in your DS2 portal.",
        priceNote: "From €490/month",
      },
      {
        slug: "review-intelligence",
        status: "early",
        name: "Review intelligence",
        role: "Fama",
        benefit: "Turn what guests say into your next direct booking.",
        tagline: "What the world says about you. Every review, every platform, one clear picture.",
        desc: "We pull every location's reviews from Google, Booking and TripAdvisor into one feed, read them in Greek and English, and tell you what is actually driving your ratings, with reply drafts ready for your team to approve.",
        roiBody: "Nine in ten guests read reviews before they book, and at portfolio scale nobody is actually reading them all. One recovered rating point moves direct bookings more than any campaign of the same cost.",
        stats: [
          { value: "9 / 10", label: "guests read reviews before booking" },
          { value: "15+ h", label: "of weekly reading and drafting, across locations" },
          { value: "1 feed", label: "for every property and platform" },
        ],
        features: [
          { name: "All platforms together", detail: "Google, Booking and TripAdvisor in one feed, deduplicated and translated." },
          { name: "Real sentiment, in Greek too", detail: "What guests praise and what costs you stars, across both languages." },
          { name: "Reply drafts", detail: "Considered responses drafted for every review, in your voice, ready to approve." },
          { name: "Monthly trend report", detail: "Rating trajectory and the three things to fix next, ranked by impact." },
        ],
        audience: "Hotel groups, restaurant chains and clinic networks managing reputation across many properties.",
        deliverable: "A weekly review brief plus a monthly trend report in your portal.",
        priceNote: "From €390/month",
      },
      {
        slug: "site-selection",
        status: "soon",
        name: "Site selection",
        role: "Panoptes",
        benefit: "Sign the right lease, not just the available one.",
        tagline: "The all-seeing. Open your next location where the data points.",
        desc: "A geospatial study for choosing where to open next: foot-traffic proxies, competitor density, demographics and accessibility, scored street by street. Built on the same methods we used to turn two million points of interest into a production network.",
        roiBody: "A flagship lease is a ten-year, seven-figure commitment decided in weeks. The big firms charge €25,000+ for the study that de-risks it. We deliver the same defensible answer in weeks, at a fraction, with the reasoning shown.",
        stats: [
          { value: "€25k+", label: "what a big-firm location study costs" },
          { value: "10 yrs", label: "of lease riding on one decision" },
          { value: "weeks", label: "to a defensible answer, not months" },
        ],
        features: [
          { name: "Candidate scoring", detail: "Every candidate location scored on demand, competition and access." },
          { name: "Competitor density maps", detail: "Where rivals cluster, where they are absent, and what that means." },
          { name: "Demand signals", detail: "Demographics and points of interest as proxies for real footfall." },
          { name: "A defensible recommendation", detail: "A ranked shortlist with the reasoning shown, not a black box." },
        ],
        audience: "Retail chains, franchise networks, F&B groups and investors weighing their next opening in Greece.",
        deliverable: "A per-study report with maps, scores and a ranked recommendation.",
        priceNote: "Per study, on a call",
      },
      {
        slug: "ai-receptionist",
        status: "soon",
        name: "AI receptionist",
        role: "Xenia",
        benefit: "Every enquiry answered, every booking captured. At 3 a.m. too.",
        tagline: "Hospitality, the ancient kind. Answers in Greek, books appointments, never sleeps.",
        desc: "An assistant trained on your services, prices and calendars that answers customers on your website and socials, in Greek and English, and turns conversations into bookings, around the clock and across every location.",
        roiBody: "Roughly a third of enquiries arrive outside opening hours, and at multi-location scale missed messages are a quiet, permanent revenue leak. Round-the-clock front-desk coverage costs salaries; this costs a fraction of one.",
        stats: [
          { value: "24/7", label: "every enquiry answered, in two languages" },
          { value: "~1/3", label: "of enquiries arrive after hours" },
          { value: "<1/10", label: "the cost of staffed coverage" },
        ],
        features: [
          { name: "Speaks your business", detail: "Grounded in your real services, prices and policies. It does not invent." },
          { name: "Takes bookings", detail: "Checks availability and books appointments straight into your calendar." },
          { name: "Greek and English", detail: "Native-quality answers in both, switching automatically." },
          { name: "Knows when to hand over", detail: "Complex cases are passed to you with the full conversation attached." },
        ],
        audience: "Clinic networks, gym and salon groups, and restaurant chains where bookings arrive faster than staff can answer.",
        deliverable: "A managed assistant on your site and channels, with a monthly conversation report.",
        priceNote: "Pricing on a call",
      },
      {
        slug: "collections",
        status: "early",
        name: "Collections",
        role: "Plutus",
        benefit: "Get paid weeks sooner, without chasing every invoice by hand.",
        tagline: "The god of wealth. Plutus predicts who pays late and drafts the chase, you just approve.",
        desc: "Plutus reads your receivables, predicts which invoices will pay late, ranks who to chase first, and drafts the reminder in Greek or English. Every send waits for your approval, so the tone stays yours.",
        roiBody: "Late payment is the quiet killer of small-business cash flow, and chasing it by hand is nobody's job and everybody's stress. Plutus turns a stack of overdue invoices into a short, ranked list and a ready-to-send reminder.",
        stats: [
          { value: "€12k+", label: "cash to collect, surfaced on day one" },
          { value: "59.6→", label: "days sales outstanding, driven down" },
          { value: "You approve", label: "every reminder before it sends" },
        ],
        features: [
          { name: "Late-payment prediction", detail: "Ranks which invoices will slip before they do, so you chase the right ones first." },
          { name: "Draft reminders", detail: "A ready-to-send message in Greek or English, in your tone. You approve every send." },
          { name: "Ageing at a glance", detail: "Current, 1-30, 31-60, 61-90 and 90+, with the euro value in each bucket." },
          { name: "Any accounting export", detail: "Drop a CSV from any system; we map the columns and parse Greek or English number formats." },
        ],
        audience: "Owners and finance teams at small and medium businesses carrying more overdue invoices than time to chase them.",
        deliverable: "A ranked chase list and draft reminders in your DS2 portal, refreshed from your latest export.",
        priceNote: "From €290/month",
      },
      {
        slug: "site-audit",
        status: "early",
        name: "Site audit",
        role: "Aegis",
        benefit: "Know exactly what is slowing your site, and what it is costing you.",
        tagline: "The shield. Aegis checks speed, accessibility and SEO, and tells you what to fix first.",
        desc: "Aegis audits your site for speed, accessibility (EU Accessibility Act) and SEO, then explains each issue in plain words, what it costs you, and the fixes that matter, ranked.",
        roiBody: "Most audits hand you a 200-line report no one reads. Aegis gives you four scores, the handful of issues that actually lose you customers or breach the EU Accessibility Act, and the order to fix them in.",
        stats: [
          { value: "4 scores", label: "performance, accessibility, SEO, best practices" },
          { value: "€100k", label: "the EU Accessibility Act fine you de-risk" },
          { value: "53%", label: "of mobile visitors lost to a slow load" },
        ],
        features: [
          { name: "Core Web Vitals", detail: "LCP, CLS and blocking time, graded the way Google sees them." },
          { name: "Accessibility Act check", detail: "The failures that are now a legal liability in the EU, flagged before they cost you." },
          { name: "What it is costing you", detail: "Each issue translated into lost bookings or risk, not jargon." },
          { name: "Fix these first", detail: "A ranked shortlist, so effort goes where it moves the needle." },
        ],
        audience: "Any business whose website is its shopfront, and anyone who must comply with the EU Accessibility Act.",
        deliverable: "A scored audit with a ranked fix list in your DS2 portal. We can do the fixes too.",
        priceNote: "From €190 one-off",
      },
      {
        slug: "ai-memory",
        status: "early",
        name: "AI memory",
        role: "NeuroVault",
        benefit: "Give any AI agent a durable, private memory, so it stops forgetting.",
        tagline: "The vault of memory. A local-first knowledge layer any AI agent can recall from.",
        desc: "NeuroVault builds a durable memory base on your own machine, then brings back the right context when an agent needs it. Automatic for Claude Code, available to any MCP-compatible agent. Free and open source.",
        roiBody: "Every AI tool we run stays sharp because it remembers. NeuroVault is the memory layer under them, and we open-sourced it: no account, no telemetry, no hosted-memory bill.",
        stats: [
          { value: "97.45%", label: "recall accuracy, measured locally" },
          { value: "Local-first", label: "your memory stays on your machine" },
          { value: "Open source", label: "MIT-licensed, no hosted bill" },
        ],
        features: [
          { name: "Durable memory", detail: "A knowledge base that persists across sessions, so context is never lost." },
          { name: "Any agent", detail: "Automatic for Claude Code, available to any MCP-compatible agent." },
          { name: "Local-first and private", detail: "Runs on your machine. No account, no telemetry, nothing leaves." },
          { name: "Fast recall", detail: "Vector, keyword and graph, fused, so the right note comes back first." },
        ],
        audience: "Teams and builders running AI agents that need to remember context across sessions and tools.",
        deliverable: "A free, open-source memory layer you can download, plus our help wiring it into your stack.",
        priceNote: "Free, open source",
      },
      {
        slug: "newsletters",
        status: "early",
        name: "Interactive newsletters",
        role: "Iris",
        benefit: "Turn a mailing list into a channel people actually open and act on.",
        tagline: "The messenger of the gods. Newsletters your customers open, tap and reply to.",
        desc: "We design and run a recurring newsletter that does more than tell: readers vote, book, claim an offer and reply in one tap, in Greek and English, and you see exactly what landed.",
        roiBody: "Email is the one channel you own outright, with no algorithm between you and your customers. One good issue brings back more repeat business than a month of paid reach, at a fraction of the cost.",
        stats: [
          { value: "1st-party", label: "an audience you own, not rented from an ad platform" },
          { value: "GR / EN", label: "every issue, in both languages" },
          { value: "Every tap", label: "polls, bookings and clicks, tracked per issue" },
        ],
        features: [
          { name: "Interactive by design", detail: "Polls, one-tap bookings, offers and replies inside the email, not just a link out." },
          { name: "Bilingual", detail: "Greek and English in every issue, written for your audience, not machine-translated." },
          { name: "We write and send it", detail: "A recurring issue planned, written and sent for you, on a schedule you approve." },
          { name: "You see what landed", detail: "Opens, clicks and responses per issue, so each one is sharper than the last." },
        ],
        audience: "Local businesses with a customer list, clinics, gyms, shops and hospitality, that want repeat visits without paying for reach every time.",
        deliverable: "A recurring bilingual newsletter, designed, written and sent, with a per-issue performance report.",
        priceNote: "From €190/month",
      },
      {
        slug: "data-extraction",
        status: "early",
        name: "Data extraction",
        role: "Scrath",
        benefit: "Turn any website into a clean, verified spreadsheet, even the ones you can't export.",
        tagline: "The scarab that turns raw pages into ordered data. A screenshot-native scraper that reads a page the way a person does.",
        desc: "Scrath reads a page from its pixels the way a person does, then grounds every value in the page's own source, so what you get back is a clean table with a citation and a confidence for each cell. It works behind logins, through pagination and infinite scroll, and can even read images of text when there is no clean markup.",
        roiBody: "The data you need is usually sitting on a page nobody can export. Scrath turns that into a table you can trust, with a source for every number, so the hours of copy-paste and the quiet transcription errors both disappear.",
        stats: [
          { value: "Any site", label: "logins, pagination and infinite scroll, handled" },
          { value: "Sourced", label: "every value cites the element it came from" },
          { value: "Verified", label: "a confidence score on every field" },
        ],
        features: [
          { name: "Reads like a person", detail: "Works from the rendered screenshot, so it copes with pages that break selector-based scrapers." },
          { name: "Grounded, not guessed", detail: "Vision finds the value; the page's own source supplies the exact text. No invented data." },
          { name: "Behind logins and scroll", detail: "Saved sessions, pagination and virtualized infinite-scroll lists, all covered." },
          { name: "Clean output, with proof", detail: "CSV, JSON or NDJSON, each field carrying its source and a confidence you can audit." },
        ],
        audience: "Teams that need data trapped on websites, listings, catalogues, directories, competitor pages, turned into a clean, verifiable table.",
        deliverable: "A structured dataset with a source and confidence per field, delivered as a one-off pull or a scheduled feed.",
        priceNote: "Project or feed",
      },
    ],
  },
  panel: {
    title: "Message DS2",
    introUnlocked: "No forms, no login. Tell us what you’re trying to do and it lands straight with the two of us.",
    introLockedPrefix: "Talking to ",
    introLockedSuffix: ". We read every message.",
    phName: "Your name (optional)",
    phCompany: "Company (optional)",
    phCountry: "Where you're based (optional)",
    phEmail: "Email (so we can reply)",
    ackBase: "Message received",
    ackWithEmail: " · we’ll reply by email within the day",
    ackNoEmail: " · we’ll reply within the day",
    composeLocked: "Add another message…",
    composeUnlocked: "What are you trying to build?",
    send: "Send",
    sending: "Sending…",
    footSent: "Sent · Athens / London",
    footIdle: "Athens / London · usually same-day",
    errName: "Add your name first.",
    errEmail: "Add your email so we can reply.",
    errEmailInvalid: "That email doesn't look right.",
    errMsg: "Write a message first.",
    errGeneric: "Something went wrong. Try again.",
    errNetwork: "Couldn't reach us. Check your connection and retry.",
    close: "Close", minimise: "Minimise", maximise: "Maximise", restore: "Restore", reopen: "Reopen your message to DS2",
    chips: [
      { label: "I need a website", draft: "Hi DS2, we need a website that " },
      { label: "Automate something", draft: "Hi DS2, we want to automate " },
      { label: "Not sure, let's talk", draft: "Hi DS2, not sure exactly what we need yet. Our situation: " },
    ],
    detailsTitle: "Where should we reply?",
    detailsHint: "Your message is ready. We just need a way to get back to you.",
    back: "Edit message",
    promise: "We reply the same day.",
    tab: "Message DS2",
  },
};

const el: Dict = {
  nav: { portfolio: "Έργα", about: "Σχετικά", tools: "Εργαλεία", blog: "Άρθρα", services: "Υπηρεσίες" },
  cta: { send: "Κλείστε ραντεβού" },
  poweredBy: "Χτισμένο με",
  a11y: { home: "DS2, αρχική", openMenu: "Άνοιγμα μενού", closeMenu: "Κλείσιμο μενού", language: "Γλώσσα", loading: "DS2, φόρτωση", logo: "Λογότυπο DS2", background: "Υπόβαθρο" },
  hero: {
    tag1: "Ψηφιακές Λύσεις",
    tag2: "συμβουλευτική",
    heroTitle: "Ψηφιακές λύσεις, χτισμένες και ",
    heroTitleEm: "δικές μας ως το τέλος.",
    sub: "Μια έμπειρη ομάδα για στρατηγική, μηχανική και εφαρμοσμένη ΤΝ. Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα.",
    what: "Τι κάνουμε",
    tags: ["Ιστοσελίδες & E-shops", "Αυτοματισμοί & ΤΝ", "Δεδομένα & Προβλέψεις", "Λύσεις κατά παραγγελία"],
    build: ["Ιστοσελίδες", "Αυτοματισμοί", "Ενσωμάτωση ΤΝ"],
    buildLabel: "Τι φτιάχνουμε",
    book: { title: "Μιλήστε μαζί μας", role: "Ιδρυτές · Αθήνα & Λονδίνο", cta: "Κλείστε ραντεβού 15'", draft: "Γεια σας, θα ήθελα να κλείσω μια εισαγωγική κλήση 15 λεπτών." },
  },
  services: {
    eyebrow: "Τι φτιάχνουμε",
    title: "Δύο έτοιμες λύσεις,",
    titleEm: "ή μία αποκλειστικά δική σας.",
    sub: "Τα περισσότερα έργα ταιριάζουν σε μία από δύο έτοιμες λύσεις. Αν το δικό σας δεν ταιριάζει, χτίζουμε ακριβώς αυτό που περιγράφετε, από το μηδέν. Μόνο συμβουλευτική, μόνο κατασκευή ή όλα μαζί — με προαιρετική φροντίδα μετά το λανσάρισμα.",
    detailCta: "Ξεκινήστε μια συζήτηση",
    expand: "Δείτε περισσότερα",
    collapse: "Σύμπτυξη",
    cats: [
      {
        key: "brand",
        tag: "Έτοιμη",
        name: "Αναβάθμιση Παρουσίας",
        tagline: "Το δημόσιο πρόσωπό σας — μια σελίδα που εμπνέει εμπιστοσύνη και φέρνει πελάτες.",
        desc: "Αυτό που βλέπει πρώτος ο κόσμος. Ξαναχτίζουμε την ιστοσελίδα ή το κατάστημά σας ώστε να φορτώνει γρήγορα, να δείχνει αξιόπιστο και να μετατρέπει επισκέπτες σε πελάτες. Από την αρχή ως το τέλος — και με δική μας ευθύνη.",
        example: "Φτιάξαμε τα globalteamplans.com και dataportfolio.co.uk. Για καταστήματα ρούχων και αθλητικούς χώρους έχουμε ήδη έτοιμα σχέδια — βγαίνετε online πιο γρήγορα και πιο οικονομικά.",
        items: [
          { name: "Ιστοσελίδες", detail: "Γρήγορες, όμορφες σελίδες που βγαίνουν στο Google και κερδίζουν εμπιστοσύνη." },
          { name: "Ηλεκτρονικά καταστήματα", detail: "Πουλήστε online με εύκολη ολοκλήρωση αγοράς. Υπάρχει έτοιμο σχέδιο για καταστήματα ρούχων." },
          { name: "Συστήματα κρατήσεων", detail: "Ημερολόγιο, διαθεσιμότητα και πληρωμές για συλλόγους, στούντιο και ιατρεία — με έτοιμο σχέδιο για αθλητικούς χώρους." },
          { name: "Διαδικτυακές εφαρμογές & πλατφόρμες", detail: "Προϊόντα με σύνδεση χρηστών, τόσο ομαλά όσο μια κανονική εφαρμογή." },
          { name: "Προϊόντα SaaS", detail: "Λογισμικό με συνδρομή, από την πρώτη οθόνη ως τη χρέωση." },
          { name: "Εφαρμογές κινητού", detail: "Εφαρμογές iOS και Android, σχεδιασμένες και φτιαγμένες από εμάς." },
        ],
      },
      {
        key: "internal",
        tag: "Έτοιμη",
        name: "Εσωτερική Αυτοματοποίηση",
        tagline: "Η δουλειά πίσω από τη δουλειά — αυτοματοποιημένη, για να κερδίζετε ώρες κάθε εβδομάδα.",
        desc: "Τα συστήματα που δεν βλέπουν οι πελάτες σας. Συνδέουμε τα εργαλεία σας, αφαιρούμε την επαναλαμβανόμενη δουλειά και κάνουμε τα δεδομένα σας χρήσιμα — λιγότερες χειροκίνητες ώρες, λιγότερα λάθη, καθαρές απαντήσεις όταν τις χρειάζεστε.",
        example: "Σκεφτείτε τιμολόγια, κρατήσεις, αναφορές και υπενθυμίσεις που γίνονται μόνες τους — και μια υποδοχή που δεν χάνει ποτέ πελάτη.",
        items: [
          { name: "Αυτοματισμοί", detail: "Η επαναλαμβανόμενη δουλειά ανάμεσα στα εργαλεία σας, γίνεται αυτόματα στο παρασκήνιο." },
          { name: "Ψηφιακή υποδοχή με ΤΝ", detail: "Απαντά σε πελάτες και κλείνει ραντεβού 24/7, στα ελληνικά και στα αγγλικά. Σε ανάπτυξη — ρωτήστε μας." },
          { name: "Chatbot ιστοσελίδας", detail: "Απαντά σε ερωτήσεις στη σελίδα σας με τα πραγματικά σας στοιχεία — τιμές, ωράρια, υπηρεσίες. Σε ανάπτυξη." },
          { name: "Πράκτορες ΤΝ με την ώρα", detail: "Αναθέστε εργασίες σε πράκτορες ΤΝ — έρευνα, καταχωρίσεις, υπενθυμίσεις — με χρέωση ανά ώρα χρήσης. Πρώιμη πρόσβαση." },
          { name: "Δεδομένα & προβλέψεις", detail: "Καθαρές απαντήσεις από τα νούμερά σας, και μια εικόνα για το πώς έρχεται ο επόμενος μήνας." },
          { name: "Διαδραστικά newsletters", detail: "Κινούμενα, εντυπωσιακά newsletters που ο κόσμος πραγματικά διαβάζει — αναλαμβάνουμε και την αποστολή. Σε ανάπτυξη." },
          { name: "Κάρτες πιστότητας & εργαλεία καταστήματος", detail: "Ψηφιακές κάρτες στο Apple και Google Wallet, σταντ για κριτικές Google με ένα άγγιγμα, ψηφιακά μενού. Σε εξέλιξη." },
        ],
      },
      {
        key: "custom",
        tag: "Κατά παραγγελία",
        name: "Εξατομικευμένη Λύση",
        tagline: "Ό,τι μπορείτε να περιγράψετε, φτιαγμένο από το μηδέν. Αν δεν ταιριάζει σε καμία από τις παραπάνω κατηγορίες, ταιριάζει εδώ.",
        desc: "Όταν το πρόβλημα είναι μόνο δικό σας, το ίδιο πρέπει να είναι και η λύση. Το σχεδιάζουμε μαζί σας, σας λέμε ειλικρινά πού δημιουργείται ρίσκο, και χτίζουμε ακριβώς αυτό που χρειάζεται — τίποτα παραπάνω.",
        example: "Ξεκινήστε με μια συζήτηση. Θα σας πούμε τι θα κάναμε — και τι δεν θα κάναμε.",
        items: [
          { name: "Συστήματα CRM", detail: "Ένα κέντρο πωλήσεων και πελατών φτιαγμένο γύρω από το πώς δουλεύετε, όχι ένα πρότυπο." },
          { name: "Πλατφόρμες αγορών", detail: "Πλατφόρμες δύο πλευρών που ενώνουν αγοραστές και πωλητές." },
          { name: "Εσωτερικά εργαλεία & dashboards", detail: "Οι πίνακες διαχείρισης που εύχεται η ομάδα σας." },
          { name: "Ροές δεδομένων", detail: "Τα δεδομένα σας μεταφερμένα, καθαρισμένα και ενωμένα — έτοιμα τη στιγμή που τα χρειάζεστε." },
          { name: "Dashboards αγοράς & ανταγωνισμού", detail: "Η αγορά, ο ανταγωνισμός και τα αποτελέσματα των καμπανιών σας σε μία καθαρή εικόνα." },
          { name: "Ό,τι μπορείτε να περιγράψετε", detail: "Αν μπορείτε να το περιγράψετε, μπορούμε να το σχεδιάσουμε και να το χτίσουμε." },
        ],
      },
    ],
  },
  featured: {
    eyebrow: "Η δουλειά μας",
    title: "Μια ματιά σε ",
    titleEm: "αυτά που έχουμε φτιάξει.",
    sub: "Πραγματικές δουλειές που μπορείτε να δείτε — οι υπόλοιπες είναι στα έργα.",
    visit: "Επίσκεψη",
    viewAll: "Δείτε όλες τις δουλειές",
    items: [
      { tag: "Ιστοσελίδα · SEO · Google Ads", name: "GlobalTeamPlans", blurb: "Μια στοχευμένη ιστοσελίδα μάρκετινγκ, φτιαγμένη για να τη βρίσκουν.", url: "https://globalteamplans.com", img: "globalteamplans" },
      { tag: "SaaS · Προϊόν", name: "dataportfolio.co.uk", blurb: "Από ιδέα σε λειτουργικό SaaS δημιουργίας portfolio.", url: "https://dataportfolio.co.uk", img: "dataportfolio" },
    ],
  },
  thesis: {
    eyebrow: "Μια αρχή που μας καθοδηγεί",
    scrollCue: "Κυλήστε",
    s1Title: "Το μεγαλύτερο κόστος είναι ",
    s1Em: "η έλλειψη γνώσης",
    s1End: ".",
    s1Body: "Έχουμε έδρα την Αθήνα, με στόχο να κλείσουμε το χάσμα τεχνικής εξοικείωσης που κρατά πίσω τις τοπικές επιχειρήσεις.",
    s2Eyebrow: "Αθήνα → Λονδίνο",
    s2Title: "Εκπαιδευμένοι εκεί που ",
    s2Em: "ορίζονται τα πρότυπα",
    s2Body: "Διατηρούμε ενεργούς πελάτες στο Λονδίνο, μαθαίνοντας από πρώτο χέρι τις βέλτιστες πρακτικές της αγοράς του Ηνωμένου Βασιλείου και φέρνοντάς τες σε κάθε έργο στην Αθήνα.",
    by: "DS2",
  },
  engage: {
    eyebrow: "Πώς συνεργαζόμαστε",
    title: "Τρεις τρόποι.",
    titleEm: "Διαλέγετε εσείς.",
    sub: "Χωρίς πακέτα, χωρίς upsell. Κάθε τρόπος είναι ξεχωριστή συμφωνία, προσαρμοσμένη σε αυτό που πραγματικά χρειάζεστε.",
    modes: [
      {
        num: "ΤΡΟΠΟΣ 01",
        title: "Από την αρχή ως το τέλος.",
        bestLabel: "Ιδανικό για:",
        best: " πρώιμες ιδέες, ασαφή προβλήματα, πλήρη ευθύνη κάτω από μία στέγη.",
        desc: "Στρατηγική, σχεδιασμός, υλοποίηση και παράδοση κάτω από μία στέγη. Εδώ η προσέγγιση «πρώτα η αμφισβήτηση» αποδίδει περισσότερο.",
      },
      {
        num: "ΤΡΟΠΟΣ 02",
        title: "Μόνο συμβουλευτική.",
        bestLabel: "Ιδανικό για:",
        best: " ομάδες που ήδη χτίζουν, αλλά θέλουν ένα δεύτερο έμπειρο ζευγάρι μάτια.",
        desc: "Δοκιμάζουμε στην πράξη το σχέδιο, την αρχιτεκτονική και την ομάδα, χωρίς να γράψουμε γραμμή κώδικα.",
      },
      {
        num: "ΤΡΟΠΟΣ 03",
        title: "Μόνο υλοποίηση.",
        bestLabel: "Ιδανικό για:",
        best: " όταν η προδιαγραφή είναι ξεκάθαρη και χρειάζεστε έμπειρα χέρια να την υλοποιήσουν.",
        desc: "Φέρνετε την προδιαγραφή. Την υλοποιούμε με έμπειρους μηχανικούς και εβδομαδιαία ενημέρωση, σε κώδικα που θα συντηρούσαμε κι εμείς οι ίδιοι.",
      },
    ],
    rows: {
      strategy: "Στρατηγική & διάγνωση",
      build: "Υλοποίηση & παράδοση",
      handover: "Τεκμηρίωση παράδοσης",
      stewardship: "Επίβλεψη",
    },
    tags: { included: "περιλαμβάνεται", none: "n/a", addon: "προαιρετικό" },
    stewardshipTag: "Προαιρετικό",
    stewardshipLead: "Επίβλεψη.",
    stewardshipRest: " Μηνιαία συνεργασία μετά την παράδοση. Κρατάμε το μάτι μας σε ό,τι φτιάξαμε. Διορθώσεις, παρακολούθηση και η περιστασιακή ειλικρινής κουβέντα όταν κάτι αρχίζει να ξεφεύγει.",
    ctaText: "Δεν είστε σίγουροι ποιος ταιριάζει; Πείτε μας τι θέλετε να πετύχετε και θα σας κατευθύνουμε.",
  },
  founders: {
    eyebrow: "Ομάδα",
    title: "Δύο έμπειροι ιδρυτές.",
    titleEm: "Κανένα ενδιάμεσο επίπεδο.",
    sub: "Όταν μιλάτε με τη DS2, μιλάτε με έναν από τους δύο. Δεν σας περνάμε ποτέ σε άπειρο προσωπικό, όσο μεγάλο κι αν γίνει το έργο.",
    role: "Ιδρυτής",
    f1Title: "Επικεφαλής Στρατηγικής & Συμβουλευτικής.",
    f1Desc: "Σχέσεις με πελάτες, εμπορική στρατηγική, συμβουλευτική. Αυτός που κάνει τις δύσκολες ερωτήσεις νωρίς, ώστε να μην τεθούν αργά από κάποιον με λιγότερη εικόνα.",
    f1Loc: "Αθήνα",
    f2Title: "Επικεφαλής Μηχανικής & Δεδομένων.",
    f2Desc: "Αρχιτεκτονική, δεδομένα και ML, τεχνική παράδοση. Αυτός που κρίνει αν αυτό που προτείνουμε θα στέκεται ακόμη σε τρία χρόνια, και το λέει πριν το παραδώσουμε.",
    f2Loc: "Λονδίνο",
  },
  how: {
    eyebrow: "Πώς δουλεύουμε",
    title: "Πρώτα η πρόκληση,",
    titleEm: "διαφανής παράδοση.",
    sub: "Οι ίδιοι τέσσερις ρυθμοί διατρέχουν κάθε συνεργασία. Έτσι προστατεύουμε τη δουλειά, κι εσάς, πριν γραφτεί μία γραμμή.",
    beats: [
      { n: "01", title: "Διάγνωση και πρόκληση", body: "Αξιολογούμε τι δουλεύει, τι όχι, και τι θα κάναμε διαφορετικά, ακόμη κι ενάντια στο brief που φέρατε." },
      { n: "02", title: "Λέμε πού δημιουργείται ρίσκο", body: "Ποτέ «αυτό είναι λάθος». Πάντα «αυτό δημιουργεί ρίσκο επειδή…». Προστατευτικά, όχι επικριτικά." },
      { n: "03", title: "Εναλλακτικές με σκεπτικό", body: "Κάθε κριτική συνοδεύεται από μια εποικοδομητική εναλλακτική και τους συμβιβασμούς της, ώστε να επιλέξετε με πλήρη εικόνα." },
      { n: "04", title: "Παύση απόφασης", body: "«Δεν χρειάζεται να αποφασίσετε τώρα. Με την ησυχία σας, είμαστε χαρούμενοι να προχωρήσουμε όπως προτιμάτε.»" },
    ],
    sig1: "Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα.",
    sig2: "Τα έργα τελειώνουν· η ευθύνη όχι.",
    sig3: "Δεν πιστοποιούμε τον οργανισμό σας, αναλαμβάνουμε την ευθύνη για ό,τι φτιάχνουμε.",
  },
  contact: {
    eyebrow: "Επικοινωνία",
    title: "Πείτε μας τι ",
    titleEm: "πραγματικά",
    titleEnd: " θέλετε να πετύχετε.",
    sub: "Απαντάμε μέσα σε μία εργάσιμη ημέρα.",
    newMessage: "Νέο μήνυμα",
    from: "Από:",
    to: "Προς:",
    subject: "Θέμα:",
    draftSubject: "Η ιστοσελίδα μας μοιάζει φτιαγμένη το 2014.",
    draftBody: [
      "Γεια σας DS2, έχουμε έναν <hl>οικογενειακό όμιλο εστιατορίων</hl> με τέσσερα σημεία στην πόλη. Η τωρινή μας ιστοσελίδα είναι ένα πρότυπο που έχουμε χρόνια να αγγίξουμε, και φαίνεται.",
      "Θέλουμε κάτι που να δείχνει πραγματικά <hl>premium</hl>, να φορτώνει γρήγορα στο κινητό, με διαδικτυακές κρατήσεις και μενού που θα ενημερώνουμε μόνοι μας.",
      "Μπορούμε να κλείσουμε ένα 30λεπτο τηλεφώνημα την επόμενη εβδομάδα;",
    ],
    statusDrafting: "Σύνταξη · Αθήνα / Λονδίνο",
    statusReady: "Έτοιμο για αποστολή · Αθήνα / Λονδίνο",
    caption: "// Ιδρύθηκε το 2026. Ή γράψτε μας απευθείας στο ",
    tools: { attach: "Επισύναψη", format: "Μορφοποίηση", image: "Εικόνα", sign: "Υπογραφή", stationery: "Χαρτικά", send: "Αποστολή" },
  },
  footer: {
    copyright: "© 2026 DS2, Ψηφιακές Λύσεις Συμβουλευτική · Αθήνα · Λονδίνο",
    services: "Υπηρεσίες",
    portfolio: "Έργα",
    about: "Σχετικά",
    home: "Αρχική",
    tools: "Εργαλεία",
    headline: "Ψηφιακές λύσεις, χτισμένες και δικές μας ως το τέλος.",
    navLabel: "Πλοήγηση",
    reachLabel: "Επικοινωνία",
    email: "ds2consulting.contact@gmail.com",
    basedLabel: "Έδρα",
    locations: "Αθήνα · Λονδίνο",
  },
  about: {
    eyebrow: "Σχετικά με εμάς",
    title: "Δύο ιδρυτές από την Αθήνα, χτίζουν αυτό που ",
    titleEm: "έλειπε",
    titleEnd: " από την πόλη.",
    sub: "Μεγαλώσαμε εδώ, μέσα στην τεχνολογία. Βλέπαμε ξανά και ξανά το ίδιο κενό. Γι’ αυτό υπάρχει η DS2.",
    blocks: [
      {
        k: "01 · Από πού ξεκινάμε",
        p: "Είμαστε και οι δύο από την Αθήνα, και είμαστε κοντά στην τεχνολογία από μικροί. Φτιάχναμε πράγματα, τα χαλούσαμε, καταλαβαίναμε πώς δουλεύουν. Αυτή η επαφή διαμόρφωσε τον τρόπο που σκεφτόμαστε πολύ πριν γίνει δουλειά.",
      },
      {
        k: "02 · Τι βλέπαμε συνέχεια",
        p: "Η Αθήνα κινείται πιο αργά στην τεχνολογία απ’ όσο θα έπρεπε, και αυτό το κενό μεγαλώνει. Αν το αφήσεις, γίνεται πραγματικό μειονέκτημα για τις επιχειρήσεις εδώ, όχι σε κάποιο μακρινό μέλλον, αλλά μέσα στα επόμενα χρόνια.",
      },
      {
        k: "03 · Γιατί η DS2",
        p: "Έτσι αποφασίσαμε να βοηθήσουμε, με πράξεις. Υπάρχουν πολλές μικρομεσαίες επιχειρήσεις που κάνουν σοβαρή δουλειά με εργαλεία που τις κρατούν πίσω. Θέλουμε να τις βοηθήσουμε να γίνονται καλύτερες μέρα με τη μέρα, προϊόν με προϊόν. Να ανεβάσουμε το τεχνολογικό επίπεδο. Να βγάλουμε τα εμπόδια. Να βοηθήσουμε με όσους τρόπους μπορούμε ουσιαστικά.",
      },
      {
        k: "04 · Ο πήχης που κρατάμε",
        p: "Η δουλειά μας είναι premium και κρατάμε την ποιότητα ψηλά, επίτηδες. Πολύ απ’ αυτό έρχεται από τη δουλειά στο Λονδίνο, μέσα σε μια πιο προχωρημένη και πιο οργανωμένη κουλτούρα εργασίας. Πήραμε αυτό που δουλεύει εκεί και το φέραμε στην πατρίδα, χωρίς τα περιττά.",
      },
    ],
    scrollbook: [
      {
        id: "mission",
        eyebrow: "Αποστολή",
        title: "Να κάνουμε τις ελληνικές επιχειρήσεις πραγματικά ικανές με την τεχνολογία.",
        body: "Να κλείσουμε το κενό ανάμεσα σε αυτό που κάνουν καλά και στα εργαλεία που θα μπορούσαν να τις πάνε πολύ πιο μακριά.",
      },
      {
        id: "vision",
        eyebrow: "Όραμα",
        title: "Μια Ελλάδα που εξελίσσεται δραστικά.",
        body: "Όπου οι μικρομεσαίες επιχειρήσεις ανταγωνίζονται σε παγκόσμιο επίπεδο, επειδή η τεχνολογία σταμάτησε να τις κρατά πίσω.",
      },
      {
        id: "gap",
        eyebrow: "Το κενό",
        title: "Η δουλειά είναι σοβαρή. Τα εργαλεία όχι.",
        body: "Πραγματικές επιχειρήσεις τρέχουν πάνω σε συστήματα που τις κρατούν πίσω: φτωχά εργαλεία, χειροκίνητες διαδικασίες, χαμηλό τεχνολογικό επίπεδο. Αν το αφήσεις, το κενό μεγαλώνει.",
      },
      {
        id: "dimitris",
        eyebrow: "Μηχανική & Δεδομένα · Λονδίνο",
        title: "Δημήτρης",
        body: "Σπούδασε και δούλεψε στο Λονδίνο. Φέρνει τον τεχνικό πυρήνα, αρχιτεκτονική, συστήματα δεδομένων, αυτοματισμό και εφαρμοσμένη ΤΝ, σε ένα επίπεδο που ορίζει μια πιο απαιτητική αγορά.",
      },
      {
        id: "stelios",
        eyebrow: "Συμβουλευτική & Στρατηγική · Αθήνα",
        title: "Στέλιος",
        body: "Σπούδασε στην Ολλανδία και συνέχισε στη συμβουλευτική, σε μία από τις Big 4 στην Αθήνα. Φέρνει επιχειρηματική δομή, πειθαρχία στη λειτουργία και καθαρή ανάγνωση της ελληνικής αγοράς.",
      },
      {
        id: "ds2",
        eyebrow: "Γιατί η DS2",
        title: "Δύο κόσμοι, μία ομάδα.",
        body: "Τεχνικό βάθος και συμβουλευτική πειθαρχία, με πραγματική εγγύτητα στην ελληνική αγορά. Αυτός ο συνδυασμός είναι που μας επιτρέπει να υλοποιούμε την αποστολή.",
      },
    ],
    missionK: "Αποστολή",
    mission: "Να κάνουμε τις ελληνικές επιχειρήσεις πραγματικά ικανές με την τεχνολογία, κλείνοντας το κενό ανάμεσα σε αυτό που κάνουν και στα εργαλεία που θα μπορούσαν να τις πάνε πολύ πιο μακριά.",
    visionK: "Όραμα",
    vision: "Μια Ελλάδα που εξελίσσεται δραστικά: όπου οι μικρομεσαίες επιχειρήσεις ανταγωνίζονται σε παγκόσμιο επίπεδο, επειδή η τεχνολογία σταμάτησε να τις κρατά πίσω.",
    cityAthens: "Αθήνα",
    cityLondon: "Λονδίνο",
    citiesCap: "Αθήνα και Λονδίνο, εκεί που ζούμε και δουλεύουμε",
    cityNetherlands: "Ολλανδία",
    coda: "Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα.",
  },
  portfolio: {
    eyebrow: "Επιλεγμένες δουλειές",
    title: "Μερικές συνεργασίες, ",
    titleEm: "ειλικρινά.",
    sub: "Πρώτες δουλειές, με όνομα όπου ο πελάτης χαίρεται να εμφανίζεται. Λέμε τι κάναμε, και τι δεν κάναμε.",
    cases: [
      {
        tag: "Ιστοσελίδες",
        meta: "Ιστοσελίδα · SEO · Google Ads",
        title: "Μια στοχευμένη ιστοσελίδα μάρκετινγκ, φτιαγμένη για να τη βρίσκουν.",
        text: "Σχεδιάσαμε και χτίσαμε την ιστοσελίδα από την αρχή ως το τέλος, και μετά φροντίσαμε να φέρνει πραγματικά επισκεψιμότητα: τεχνικό και on-page SEO, μαζί με λογαριασμό Google Ads στημένο και ενεργό ώστε να φτάνει σε κόσμο από την πρώτη μέρα.",
        list: ["Σχεδιασμός και κατασκευή ιστοσελίδας", "Τεχνικό και on-page SEO", "Στήσιμο και εκκίνηση Google Ads"],
      },
      {
        tag: "Ιστοσελίδες",
        meta: "SaaS · Κατασκευή προϊόντος",
        title: "Ένα SaaS για τη δημιουργία portfolio.",
        text: "Ο πελάτης ήθελε να λανσάρει ένα προϊόν που επιτρέπει στον κόσμο να φτιάχνει portfolio. Το πήγαμε από ιδέα σε λειτουργικό SaaS: την ίδια την εφαρμογή και την ιστοσελίδα γύρω της.",
        list: ["Κατασκευή προϊόντος και UX", "Πλήρης εφαρμογή SaaS", "Ιστοσελίδα μάρκετινγκ γύρω από το προϊόν"],
      },
      {
        tag: "Ιστοσελίδες",
        meta: "Προετοιμασία ιατρικών εξετάσεων · ΗΒ · Συμβουλευτική",
        title: "Μια κορυφαία πλατφόρμα στο ΗΒ που βοηθά γιατρούς να προετοιμαστούν για τις εξετάσεις τους.",
        text: "Αναλάβαμε την τεχνική συμβουλευτική από την αρχή ως το τέλος στις αποφάσεις που μετρούσαν. Με ποιες τεχνολογίες να χτίσουν, ποιους ρόλους να προσλάβουν και με ποια σειρά, και τους βοηθήσαμε να βρουν τους ανθρώπους. Μαζί με τις συμβουλές, φτιάξαμε ένα υψηλής ποιότητας πρωτότυπο σχεδιασμού της ιστοσελίδας τους, για να έχουν πραγματική διαπραγματευτική ισχύ στις προσφορές κατασκευής και πιο καθαρή κατεύθυνση για το UI.",
        list: ["Καθοδήγηση για τεχνολογίες και αρχιτεκτονική", "Σχέδιο προσλήψεων και υποστήριξη εύρεσης", "Πρωτότυπο σχεδιασμού υψηλής ποιότητας για διαπραγμάτευση τιμών και κατεύθυνση UI"],
      },
      {
        tag: "Λύσεις δεδομένων",
        meta: "Γεωχωρικά · Επιστήμη δεδομένων",
        title: "Ένα γεωχωρικό δίκτυο κόμβων από δύο εκατομμύρια σημεία ενδιαφέροντος.",
        text: "Μια εταιρεία δεδομένων και ΤΝ μας έδωσε ένα σύνολο δεδομένων με περίπου δύο εκατομμύρια σημεία ενδιαφέροντος. Το μετατρέψαμε σε ένα γεωχωρικό δίκτυο κόμβων που μπορούσαν να χρησιμοποιήσουν απευθείας μέσα σε ένα από τα προϊόντα τους σε παραγωγή.",
        list: ["Εισαγωγή και καθαρισμός ~2M σημείων (POIs)", "Κατασκευή συνδεδεμένου γεωχωρικού δικτύου κόμβων", "Παράδοση για χρήση μέσα στο ζωντανό προϊόν τους"],
      },
    ],
    coda: "Αν θέλετε μια δεύτερη έμπειρη γνώμη πριν δεσμευτείτε, εκεί ακριβώς είμαστε χρήσιμοι.",
  },
  toolsTeaser: {
    eyebrow: "Για μεγαλύτερους οργανισμούς",
    title: "Ευφυΐα αποφάσεων, ",
    titleEm: "ως υπηρεσία.",
    sub: "Οι υπηρεσίες μας είναι φτιαγμένες για μικρομεσαίες επιχειρήσεις. Για ομίλους, αλυσίδες και scale-ups τρέχουμε τα εργαλεία ευφυΐας αποφάσεων της DS2: συνεχής πληροφόρηση για αγορά, φήμη και τοποθεσίες, παραδομένη ως αποφάσεις που η ομάδα σας μπορεί να πράξει.",
    cta: "Δείτε τα εργαλεία",
  },
  tools: {
    eyebrow: "Εργαλεία DS2",
    title: "Εργαλεία που τρέχουμε ",
    titleEm: "για εσάς.",
    sub: "Υπηρεσίες-προϊόντα: εγγράφεστε, εμείς λειτουργούμε τον μηχανισμό, και τα αποτελέσματα φτάνουν στο email και στο portal σας. Χωρίς dashboards που πρέπει να μάθετε, χωρίς λογισμικό για διαχείριση.",
    statusEarly: "Πρώιμη πρόσβαση",
    statusSoon: "Έρχεται σύντομα",
    view: "Δείτε το εργαλείο",
    interestCta: "Με ενδιαφέρει",
    interestDraft: "Γεια σας DS2, με ενδιαφέρει το {tool}. ",
    audienceLabel: "Για ποιους είναι",
    deliverableLabel: "Τι λαμβάνετε",
    pricingLabel: "Τιμολόγηση",
    featuresLabel: "Τι κάνει",
    roiLabel: "Τι αξίζει",
    backAll: "Όλα τα εργαλεία",
    videoSoon: "Σύντομο φιλμ επίδειξης έρχεται εδώ.",
    items: [
      {
        slug: "competitor-watch",
        status: "early",
        name: "Παρακολούθηση ανταγωνισμού",
        role: "Argus",
        benefit: "Μάθετε κάθε κίνηση του ανταγωνισμού πριν από τη συνάντηση της Δευτέρας.",
        tagline: "Ο εκατόφθαλμος φύλακας. Παρακολουθούμε τους ανταγωνιστές σας, για να μη χρειάζεται εσείς.",
        desc: "Ορίζετε το ανταγωνιστικό σύνολο για το οποίο ήδη ρωτά η διοίκηση. Κάθε εβδομάδα οι πράκτορές μας διαβάζουν τις ιστοσελίδες, τις τιμές, τις προσφορές, τις κριτικές και την ορατότητά τους στην αναζήτηση, και η ομάδα σας λαμβάνει μια ενημέρωση μόνο με ό,τι άλλαξε και γιατί μετράει.",
        roiBody: "Οι ομάδες στρατηγικής πληρώνουν σε εξωτερικές εταιρείες €2.000+ για μια εφάπαξ ανάλυση ανταγωνισμού που παλιώνει μέσα σε έναν μήνα, ή καίνε μέρες αναλυτών ξαναχτίζοντας την ίδια εικόνα στο χέρι. Αυτή είναι η ίδια πληροφόρηση, συνεχής, σε κλάσμα του κόστους.",
        stats: [
          { value: "10+ ώρες", label: "χρόνου αναλυτή πίσω στην ομάδα, κάθε εβδομάδα" },
          { value: "€2.000+", label: "η τρέχουσα τιμή για μία στατική αναφορά" },
          { value: "52×", label: "ενημερώσεις τον χρόνο, όχι ένα μπαγιάτικο deck" },
        ],
        features: [
          { name: "Εβδομαδιαία ενημέρωση", detail: "Ένα σύντομο brief κάθε Δευτέρα, γραμμένο για ιδιοκτήτη, όχι για αναλυτή." },
          { name: "Τιμές & προσφορές", detail: "Νέα πακέτα, εκπτώσεις και αλλαγές τιμών, την εβδομάδα που συμβαίνουν." },
          { name: "Παρακολούθηση κριτικών", detail: "Τι επαινούν και τι κατακρίνουν οι πελάτες στους αντιπάλους σας, συνοψισμένο." },
          { name: "Ορατότητα στην αναζήτηση", detail: "Ποιος εμφανίζεται πού για τις αναζητήσεις που σας φέρνουν πελάτες." },
        ],
        audience: "Ομάδες στρατηγικής, εμπορικής διεύθυνσης και marketing σε ομίλους, αλυσίδες και scale-ups που λογοδοτούν για τη θέση τους στην αγορά.",
        deliverable: "Ένα email κάθε Δευτέρα, με πλήρες αρχείο στο DS2 portal σας.",
        priceNote: "Από €490/μήνα",
      },
      {
        slug: "review-intelligence",
        status: "early",
        name: "Ανάλυση κριτικών",
        role: "Fama",
        benefit: "Μετατρέψτε όσα λένε οι επισκέπτες στην επόμενη απευθείας κράτησή σας.",
        tagline: "Ό,τι λέει ο κόσμος για εσάς. Κάθε κριτική, κάθε πλατφόρμα, μία καθαρή εικόνα.",
        desc: "Συγκεντρώνουμε τις κριτικές κάθε μονάδας από Google, Booking και TripAdvisor σε μία ροή, τις διαβάζουμε στα ελληνικά και στα αγγλικά, και σας λέμε τι πραγματικά καθορίζει τις βαθμολογίες σας, με προσχέδια απαντήσεων έτοιμα για έγκριση από την ομάδα σας.",
        roiBody: "Εννέα στους δέκα επισκέπτες διαβάζουν κριτικές πριν κάνουν κράτηση, και σε κλίμακα χαρτοφυλακίου κανείς δεν τις διαβάζει πραγματικά όλες. Ένας ανακτημένος βαθμός κινεί τις απευθείας κρατήσεις περισσότερο από οποιαδήποτε καμπάνια ίδιου κόστους.",
        stats: [
          { value: "9 / 10", label: "επισκέπτες διαβάζουν κριτικές πριν την κράτηση" },
          { value: "15+ ώρες", label: "εβδομαδιαίο διάβασμα και απαντήσεις, σε όλες τις μονάδες" },
          { value: "1 ροή", label: "για κάθε μονάδα και κάθε πλατφόρμα" },
        ],
        features: [
          { name: "Όλες οι πλατφόρμες μαζί", detail: "Google, Booking και TripAdvisor σε μία ροή, χωρίς διπλότυπα, μεταφρασμένα." },
          { name: "Πραγματική ανάλυση, και στα ελληνικά", detail: "Τι επαινούν οι επισκέπτες και τι σας κοστίζει αστέρια, και στις δύο γλώσσες." },
          { name: "Προσχέδια απαντήσεων", detail: "Προσεγμένες απαντήσεις για κάθε κριτική, στη δική σας φωνή, έτοιμες για έγκριση." },
          { name: "Μηνιαία αναφορά τάσεων", detail: "Η πορεία της βαθμολογίας και τα τρία επόμενα πράγματα που αξίζει να διορθώσετε." },
        ],
        audience: "Ξενοδοχειακοί όμιλοι, αλυσίδες εστίασης και δίκτυα κλινικών που διαχειρίζονται φήμη σε πολλές μονάδες.",
        deliverable: "Εβδομαδιαίο brief κριτικών και μηνιαία αναφορά τάσεων στο portal σας.",
        priceNote: "Από €390/μήνα",
      },
      {
        slug: "site-selection",
        status: "soon",
        name: "Επιλογή τοποθεσίας",
        role: "Panoptes",
        benefit: "Υπογράψτε τη σωστή μίσθωση, όχι απλώς τη διαθέσιμη.",
        tagline: "Ο πανόπτης. Ανοίξτε το επόμενο σημείο εκεί που δείχνουν τα δεδομένα.",
        desc: "Γεωχωρική μελέτη για το πού να ανοίξετε το επόμενο σημείο: ενδείξεις κίνησης, πυκνότητα ανταγωνισμού, δημογραφικά και προσβασιμότητα, βαθμολογημένα δρόμο προς δρόμο. Πάνω στις ίδιες μεθόδους με τις οποίες μετατρέψαμε δύο εκατομμύρια σημεία ενδιαφέροντος σε δίκτυο παραγωγής.",
        roiBody: "Μια ναυαρχίδα είναι δεκαετής δέσμευση επταψήφιου κόστους που κρίνεται σε λίγες εβδομάδες. Οι μεγάλες εταιρείες χρεώνουν €25.000+ για τη μελέτη που μειώνει το ρίσκο. Παραδίδουμε εξίσου τεκμηριωμένη απάντηση σε εβδομάδες, σε κλάσμα της τιμής, με το σκεπτικό ορατό.",
        stats: [
          { value: "€25k+", label: "το κόστος μελέτης από μεγάλη εταιρεία" },
          { value: "10 έτη", label: "μίσθωσης κρέμονται από μία απόφαση" },
          { value: "εβδομάδες", label: "ως την τεκμηριωμένη απάντηση, όχι μήνες" },
        ],
        features: [
          { name: "Βαθμολόγηση τοποθεσιών", detail: "Κάθε υποψήφια τοποθεσία βαθμολογείται σε ζήτηση, ανταγωνισμό και πρόσβαση." },
          { name: "Χάρτες ανταγωνισμού", detail: "Πού συγκεντρώνονται οι αντίπαλοι, πού απουσιάζουν, και τι σημαίνει αυτό." },
          { name: "Ενδείξεις ζήτησης", detail: "Δημογραφικά και σημεία ενδιαφέροντος ως ενδείξεις πραγματικής κίνησης." },
          { name: "Τεκμηριωμένη πρόταση", detail: "Κατάταξη με ορατό σκεπτικό, όχι μαύρο κουτί." },
        ],
        audience: "Αλυσίδες λιανικής, δίκτυα franchise, όμιλοι εστίασης και επενδυτές που ζυγίζουν το επόμενο άνοιγμα στην Ελλάδα.",
        deliverable: "Αναφορά ανά μελέτη με χάρτες, βαθμολογίες και τεκμηριωμένη κατάταξη.",
        priceNote: "Ανά μελέτη, σε μια κλήση",
      },
      {
        slug: "ai-receptionist",
        status: "soon",
        name: "Ψηφιακή υποδοχή",
        role: "Xenia",
        benefit: "Κάθε μήνυμα απαντημένο, κάθε ραντεβού κερδισμένο. Και στις 3 τα ξημερώματα.",
        tagline: "Φιλοξενία, με την αρχαία έννοια. Απαντά στα ελληνικά, κλείνει ραντεβού, δεν κοιμάται ποτέ.",
        desc: "Ένας βοηθός εκπαιδευμένος στις υπηρεσίες, τις τιμές και τα ημερολόγιά σας, που απαντά στους πελάτες στην ιστοσελίδα και τα κανάλιά σας, στα ελληνικά και στα αγγλικά, και μετατρέπει τις συζητήσεις σε ραντεβού, όλο το εικοσιτετράωρο και σε κάθε μονάδα.",
        roiBody: "Περίπου το ένα τρίτο των μηνυμάτων έρχεται εκτός ωραρίου, και σε κλίμακα πολλών μονάδων τα αναπάντητα μηνύματα είναι μια αθόρυβη, μόνιμη διαρροή εσόδων. Η εικοσιτετράωρη κάλυψη υποδοχής κοστίζει μισθούς· αυτό κοστίζει κλάσμα ενός.",
        stats: [
          { value: "24/7", label: "κάθε μήνυμα απαντημένο, σε δύο γλώσσες" },
          { value: "~1/3", label: "των μηνυμάτων έρχεται εκτός ωραρίου" },
          { value: "<1/10", label: "του κόστους επανδρωμένης κάλυψης" },
        ],
        features: [
          { name: "Μιλά τη γλώσσα της επιχείρησής σας", detail: "Βασισμένος στις πραγματικές υπηρεσίες, τιμές και πολιτικές σας. Δεν επινοεί." },
          { name: "Κλείνει ραντεβού", detail: "Ελέγχει διαθεσιμότητα και καταχωρεί ραντεβού απευθείας στο ημερολόγιό σας." },
          { name: "Ελληνικά και αγγλικά", detail: "Φυσικές απαντήσεις και στις δύο γλώσσες, με αυτόματη εναλλαγή." },
          { name: "Ξέρει πότε να παραδώσει", detail: "Οι σύνθετες περιπτώσεις έρχονται σε εσάς με όλη τη συζήτηση συνημμένη." },
        ],
        audience: "Δίκτυα κλινικών, όμιλοι γυμναστηρίων και κομμωτηρίων, και αλυσίδες εστίασης όπου οι κρατήσεις έρχονται πιο γρήγορα απ' όσο προλαβαίνει το προσωπικό.",
        deliverable: "Διαχειριζόμενος βοηθός στην ιστοσελίδα και τα κανάλιά σας, με μηνιαία αναφορά συζητήσεων.",
        priceNote: "Τιμολόγηση σε μια κλήση",
      },
      {
        slug: "collections",
        status: "early",
        name: "Εισπράξεις",
        role: "Plutus",
        benefit: "Πληρωθείτε εβδομάδες νωρίτερα, χωρίς να κυνηγάτε κάθε τιμολόγιο με το χέρι.",
        tagline: "Ο θεός του πλούτου. Ο Plutus προβλέπει ποιος πληρώνει αργά και ετοιμάζει την υπενθύμιση, εσείς απλώς εγκρίνετε.",
        desc: "Ο Plutus διαβάζει τις απαιτήσεις σας, προβλέπει ποια τιμολόγια θα πληρωθούν αργά, κατατάσσει ποιον να κυνηγήσετε πρώτα, και συντάσσει την υπενθύμιση στα ελληνικά ή τα αγγλικά. Κάθε αποστολή περιμένει την έγκρισή σας, ώστε το ύφος να παραμένει δικό σας.",
        roiBody: "Η καθυστερημένη πληρωμή είναι ο σιωπηλός δολοφόνος της ρευστότητας μιας μικρής επιχείρησης, και το κυνήγι της με το χέρι δεν είναι δουλειά κανενός αλλά άγχος όλων. Ο Plutus μετατρέπει μια στοίβα ληξιπρόθεσμων τιμολογίων σε μια σύντομη, ταξινομημένη λίστα και μια έτοιμη υπενθύμιση.",
        stats: [
          { value: "€12k+", label: "μετρητά προς είσπραξη, από την πρώτη μέρα" },
          { value: "59.6→", label: "μέρες είσπραξης, σε πτώση" },
          { value: "Εσείς εγκρίνετε", label: "κάθε υπενθύμιση πριν σταλεί" },
        ],
        features: [
          { name: "Πρόβλεψη καθυστέρησης", detail: "Κατατάσσει ποια τιμολόγια θα καθυστερήσουν πριν συμβεί, για να κυνηγήσετε τα σωστά πρώτα." },
          { name: "Έτοιμες υπενθυμίσεις", detail: "Ένα έτοιμο μήνυμα στα ελληνικά ή τα αγγλικά, στο δικό σας ύφος. Εσείς εγκρίνετε κάθε αποστολή." },
          { name: "Ενηλικίωση με μια ματιά", detail: "Τρέχον, 1-30, 31-60, 61-90 και 90+, με την αξία σε ευρώ σε κάθε κατηγορία." },
          { name: "Κάθε λογιστικό αρχείο", detail: "Ρίξτε ένα CSV από οποιοδήποτε σύστημα· χαρτογραφούμε τις στήλες και διαβάζουμε ελληνικές ή αγγλικές μορφές αριθμών." },
        ],
        audience: "Ιδιοκτήτες και οικονομικές ομάδες μικρομεσαίων επιχειρήσεων με περισσότερα ληξιπρόθεσμα τιμολόγια απ' όσο χρόνο για να τα κυνηγήσουν.",
        deliverable: "Μια ταξινομημένη λίστα και έτοιμες υπενθυμίσεις στο portal σας, ανανεωμένες από το τελευταίο σας αρχείο.",
        priceNote: "Από €290/μήνα",
      },
      {
        slug: "site-audit",
        status: "early",
        name: "Έλεγχος ιστότοπου",
        role: "Aegis",
        benefit: "Μάθετε ακριβώς τι καθυστερεί τον ιστότοπό σας, και τι σας κοστίζει.",
        tagline: "Η ασπίδα. Ο Aegis ελέγχει ταχύτητα, προσβασιμότητα και SEO, και σας λέει τι να διορθώσετε πρώτα.",
        desc: "Ο Aegis ελέγχει τον ιστότοπό σας για ταχύτητα, προσβασιμότητα (Ευρωπαϊκή Πράξη Προσβασιμότητας) και SEO, και εξηγεί κάθε ζήτημα με απλά λόγια, τι σας κοστίζει, και τις διορθώσεις που έχουν σημασία, ταξινομημένες.",
        roiBody: "Οι περισσότεροι έλεγχοι σας δίνουν μια αναφορά 200 γραμμών που δεν διαβάζει κανείς. Ο Aegis σας δίνει τέσσερις βαθμολογίες, τα λίγα ζητήματα που πραγματικά σας κοστίζουν πελάτες ή παραβιάζουν την Πράξη Προσβασιμότητας, και τη σειρά για να τα διορθώσετε.",
        stats: [
          { value: "4 σκορ", label: "ταχύτητα, προσβασιμότητα, SEO, βέλτιστες πρακτικές" },
          { value: "€100k", label: "το πρόστιμο της Πράξης Προσβασιμότητας που αποφεύγετε" },
          { value: "53%", label: "των mobile επισκεπτών που χάνονται σε αργή φόρτωση" },
        ],
        features: [
          { name: "Core Web Vitals", detail: "LCP, CLS και χρόνος αποκλεισμού, βαθμολογημένα όπως τα βλέπει η Google." },
          { name: "Έλεγχος Πράξης Προσβασιμότητας", detail: "Οι αστοχίες που είναι πλέον νομική ευθύνη στην ΕΕ, επισημασμένες πριν σας κοστίσουν." },
          { name: "Τι σας κοστίζει", detail: "Κάθε ζήτημα μεταφρασμένο σε χαμένες κρατήσεις ή ρίσκο, όχι ορολογία." },
          { name: "Διορθώστε πρώτα αυτά", detail: "Μια ταξινομημένη λίστα, ώστε η προσπάθεια να πηγαίνει εκεί που μετράει." },
        ],
        audience: "Κάθε επιχείρηση της οποίας ο ιστότοπος είναι η βιτρίνα της, και όποιος πρέπει να συμμορφωθεί με την Ευρωπαϊκή Πράξη Προσβασιμότητας.",
        deliverable: "Ένας βαθμολογημένος έλεγχος με ταξινομημένη λίστα διορθώσεων στο portal σας. Μπορούμε να κάνουμε και τις διορθώσεις.",
        priceNote: "Από €190 εφάπαξ",
      },
      {
        slug: "ai-memory",
        status: "early",
        name: "Μνήμη AI",
        role: "NeuroVault",
        benefit: "Δώστε σε κάθε AI agent μια ανθεκτική, ιδιωτική μνήμη, ώστε να σταματήσει να ξεχνά.",
        tagline: "Το θησαυροφυλάκιο της μνήμης. Ένα local-first επίπεδο γνώσης που κάθε AI agent μπορεί να ανακαλέσει.",
        desc: "Το NeuroVault χτίζει μια ανθεκτική βάση μνήμης στο δικό σας μηχάνημα και επαναφέρει το σωστό πλαίσιο όταν το χρειάζεται ένας agent. Αυτόματο για το Claude Code, διαθέσιμο σε κάθε MCP-συμβατό agent. Δωρεάν και open source.",
        roiBody: "Κάθε εργαλείο AI που τρέχουμε παραμένει οξυδερκές επειδή θυμάται. Το NeuroVault είναι το επίπεδο μνήμης από κάτω τους, και το κάναμε open source: χωρίς λογαριασμό, χωρίς telemetry, χωρίς λογαριασμό φιλοξενίας μνήμης.",
        stats: [
          { value: "97.45%", label: "ακρίβεια ανάκλησης, μετρημένη τοπικά" },
          { value: "Local-first", label: "η μνήμη σας μένει στο μηχάνημά σας" },
          { value: "Open source", label: "άδεια MIT, χωρίς λογαριασμό φιλοξενίας" },
        ],
        features: [
          { name: "Ανθεκτική μνήμη", detail: "Μια βάση γνώσης που διατηρείται ανάμεσα στις συνεδρίες, ώστε το πλαίσιο να μη χάνεται." },
          { name: "Κάθε agent", detail: "Αυτόματο για το Claude Code, διαθέσιμο σε κάθε MCP-συμβατό agent." },
          { name: "Local-first και ιδιωτικό", detail: "Τρέχει στο μηχάνημά σας. Χωρίς λογαριασμό, χωρίς telemetry, τίποτα δεν φεύγει." },
          { name: "Γρήγορη ανάκληση", detail: "Vector, keyword και graph, συνδυασμένα, ώστε η σωστή σημείωση να έρχεται πρώτη." },
        ],
        audience: "Ομάδες και δημιουργοί που τρέχουν AI agents οι οποίοι πρέπει να θυμούνται πλαίσιο ανάμεσα σε συνεδρίες και εργαλεία.",
        deliverable: "Ένα δωρεάν, open-source επίπεδο μνήμης που μπορείτε να κατεβάσετε, μαζί με τη βοήθειά μας να το συνδέσετε στο stack σας.",
        priceNote: "Δωρεάν, open source",
      },
      {
        slug: "newsletters",
        status: "early",
        name: "Διαδραστικά newsletter",
        role: "Iris",
        benefit: "Μετατρέψτε μια λίστα email σε κανάλι που οι πελάτες πραγματικά ανοίγουν και ενεργούν.",
        tagline: "Η αγγελιαφόρος των θεών. Newsletter που οι πελάτες σας ανοίγουν, πατούν και απαντούν.",
        desc: "Σχεδιάζουμε και τρέχουμε ένα τακτικό newsletter που κάνει κάτι παραπάνω από το να ενημερώνει: οι αναγνώστες ψηφίζουν, κλείνουν ραντεβού, εξαργυρώνουν προσφορά και απαντούν με ένα άγγιγμα, στα ελληνικά και τα αγγλικά, και βλέπετε ακριβώς τι δούλεψε.",
        roiBody: "Το email είναι το μόνο κανάλι που σας ανήκει εξ ολοκλήρου, χωρίς αλγόριθμο ανάμεσα σε εσάς και τους πελάτες σας. Ένα καλό τεύχος φέρνει πίσω περισσότερες επαναλαμβανόμενες πωλήσεις από έναν μήνα πληρωμένης προβολής, με κλάσμα του κόστους.",
        stats: [
          { value: "1st-party", label: "κοινό που σας ανήκει, δεν το νοικιάζετε από πλατφόρμα" },
          { value: "GR / EN", label: "κάθε τεύχος, και στις δύο γλώσσες" },
          { value: "Κάθε άγγιγμα", label: "ψηφοφορίες, κρατήσεις και κλικ, μετρημένα ανά τεύχος" },
        ],
        features: [
          { name: "Διαδραστικό εξ ορισμού", detail: "Ψηφοφορίες, κρατήσεις με ένα άγγιγμα, προσφορές και απαντήσεις μέσα στο email, όχι απλώς ένας σύνδεσμος." },
          { name: "Δίγλωσσο", detail: "Ελληνικά και αγγλικά σε κάθε τεύχος, γραμμένα για το κοινό σας, όχι μηχανική μετάφραση." },
          { name: "Το γράφουμε και το στέλνουμε", detail: "Ένα τακτικό τεύχος, σχεδιασμένο, γραμμένο και σταλμένο για εσάς, στο πρόγραμμα που εγκρίνετε." },
          { name: "Βλέπετε τι δούλεψε", detail: "Ανοίγματα, κλικ και απαντήσεις ανά τεύχος, ώστε το επόμενο να είναι πιο στοχευμένο." },
        ],
        audience: "Τοπικές επιχειρήσεις με λίστα πελατών, ιατρεία, γυμναστήρια, καταστήματα και εστίαση, που θέλουν επαναλαμβανόμενες επισκέψεις χωρίς να πληρώνουν κάθε φορά για προβολή.",
        deliverable: "Ένα τακτικό δίγλωσσο newsletter, σχεδιασμένο, γραμμένο και σταλμένο, με αναφορά απόδοσης ανά τεύχος.",
        priceNote: "Από €190/μήνα",
      },
      {
        slug: "data-extraction",
        status: "early",
        name: "Εξαγωγή δεδομένων",
        role: "Scrath",
        benefit: "Μετατρέψτε οποιονδήποτε ιστότοπο σε ένα καθαρό, επαληθευμένο υπολογιστικό φύλλο, ακόμη κι αυτούς που δεν εξάγονται.",
        tagline: "Ο σκαραβαίος που μετατρέπει ακατέργαστες σελίδες σε τακτοποιημένα δεδομένα. Ένας scraper που διαβάζει τη σελίδα όπως ένας άνθρωπος.",
        desc: "Το Scrath διαβάζει μια σελίδα από τα pixel της όπως ένας άνθρωπος, και μετά θεμελιώνει κάθε τιμή στην ίδια την πηγή της σελίδας, ώστε να παίρνετε έναν καθαρό πίνακα με παραπομπή και βαθμό βεβαιότητας για κάθε κελί. Δουλεύει πίσω από logins, μέσα από σελιδοποίηση και infinite scroll, και μπορεί ακόμη να διαβάσει εικόνες κειμένου όταν δεν υπάρχει καθαρό markup.",
        roiBody: "Τα δεδομένα που χρειάζεστε συνήθως βρίσκονται σε μια σελίδα που κανείς δεν μπορεί να εξάγει. Το Scrath τα μετατρέπει σε έναν πίνακα που εμπιστεύεστε, με πηγή για κάθε αριθμό, ώστε οι ώρες αντιγραφής και τα αθόρυβα λάθη μεταγραφής να εξαφανίζονται.",
        stats: [
          { value: "Κάθε site", label: "logins, σελιδοποίηση και infinite scroll" },
          { value: "Με πηγή", label: "κάθε τιμή παραπέμπει στο στοιχείο απ' όπου ήρθε" },
          { value: "Επαληθευμένο", label: "βαθμός βεβαιότητας σε κάθε πεδίο" },
        ],
        features: [
          { name: "Διαβάζει σαν άνθρωπος", detail: "Δουλεύει από το rendered screenshot, οπότε αντεπεξέρχεται σε σελίδες που σπάνε τους selector-based scrapers." },
          { name: "Θεμελιωμένο, όχι μαντεψιά", detail: "Η όραση βρίσκει την τιμή· η ίδια η πηγή της σελίδας δίνει το ακριβές κείμενο. Χωρίς επινοημένα δεδομένα." },
          { name: "Πίσω από logins και scroll", detail: "Αποθηκευμένες συνεδρίες, σελιδοποίηση και virtualized infinite-scroll λίστες, όλα καλυμμένα." },
          { name: "Καθαρό αποτέλεσμα, με απόδειξη", detail: "CSV, JSON ή NDJSON, με κάθε πεδίο να φέρει την πηγή του και έναν βαθμό βεβαιότητας που ελέγχεται." },
        ],
        audience: "Ομάδες που χρειάζονται δεδομένα παγιδευμένα σε ιστότοπους, καταλόγους, ευρετήρια, σελίδες ανταγωνιστών, μετατρεμμένα σε έναν καθαρό, επαληθεύσιμο πίνακα.",
        deliverable: "Ένα δομημένο σύνολο δεδομένων με πηγή και βεβαιότητα ανά πεδίο, ως εφάπαξ εξαγωγή ή προγραμματισμένη ροή.",
        priceNote: "Έργο ή ροή",
      },
    ],
  },
  panel: {
    title: "Μήνυμα στη DS2",
    introUnlocked: "Χωρίς φόρμες, χωρίς σύνδεση. Πείτε μας τι θέλετε να κάνετε και φτάνει κατευθείαν στους δυο μας.",
    introLockedPrefix: "Μιλάτε με ",
    introLockedSuffix: ". Διαβάζουμε κάθε μήνυμα.",
    phName: "Το όνομά σας (προαιρετικό)",
    phCompany: "Εταιρεία (προαιρετικό)",
    phCountry: "Πού εδρεύετε (προαιρετικό)",
    phEmail: "Email (για να απαντήσουμε)",
    ackBase: "Το μήνυμα παραλήφθηκε",
    ackWithEmail: " · θα απαντήσουμε με email εντός της ημέρας",
    ackNoEmail: " · θα απαντήσουμε εντός της ημέρας",
    composeLocked: "Προσθέστε άλλο μήνυμα…",
    composeUnlocked: "Τι θέλετε να φτιάξετε;",
    send: "Αποστολή",
    sending: "Αποστολή…",
    footSent: "Στάλθηκε · Αθήνα / Λονδίνο",
    footIdle: "Αθήνα / Λονδίνο · συνήθως αυθημερόν",
    errName: "Προσθέστε πρώτα το όνομά σας.",
    errEmail: "Προσθέστε το email σας για να απαντήσουμε.",
    errEmailInvalid: "Αυτό το email δεν φαίνεται σωστό.",
    errMsg: "Γράψτε πρώτα ένα μήνυμα.",
    errGeneric: "Κάτι πήγε στραβά. Δοκιμάστε ξανά.",
    errNetwork: "Δεν μπορέσαμε να επικοινωνήσουμε. Ελέγξτε τη σύνδεσή σας και ξαναδοκιμάστε.",
    close: "Κλείσιμο", minimise: "Ελαχιστοποίηση", maximise: "Μεγιστοποίηση", restore: "Επαναφορά", reopen: "Ξανανοίξτε το μήνυμά σας στη DS2",
    chips: [
      { label: "Θέλω ιστοσελίδα", draft: "Γεια σας DS2, χρειαζόμαστε μια ιστοσελίδα που " },
      { label: "Αυτοματοποίηση", draft: "Γεια σας DS2, θέλουμε να αυτοματοποιήσουμε " },
      { label: "Δεν είμαι σίγουρος, ας τα πούμε", draft: "Γεια σας DS2, δεν ξέρουμε ακόμη τι ακριβώς χρειαζόμαστε. Η κατάστασή μας: " },
    ],
    detailsTitle: "Πού να απαντήσουμε;",
    detailsHint: "Το μήνυμά σας είναι έτοιμο. Χρειαζόμαστε μόνο έναν τρόπο να σας απαντήσουμε.",
    back: "Επεξεργασία μηνύματος",
    promise: "Απαντάμε την ίδια μέρα.",
    tab: "Μήνυμα στη DS2",
  },
};

export const dict: Record<Lang, Dict> = { en, el };
