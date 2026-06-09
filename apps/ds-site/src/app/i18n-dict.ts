/**
 * DS2 site copy, EN + EL.
 * Greek is a first professional draft, review/refine before treating as final.
 * Inline markup conventions:
 *   - titles split into plain + `Em` (rendered inside <em>)
 *   - <hl>…</hl> in compose-draft strings is parsed by the typewriter
 */

export type Lang = "en" | "el";

type SvcOffering = { name: string; detail: string };
type SvcCat = { key: "brand" | "internal" | "custom"; tag: string; name: string; tagline: string; desc: string; example: string; items: SvcOffering[] };
type EngageMode = { num: string; title: string; best: string; bestLabel: string; desc: string };
type AboutBlock = { k: string; p: string };
type ScrollPage = { id: string; eyebrow: string; title: string; body: string };
type FeatItem = { tag: string; name: string; blurb: string; url: string; img: string };
type Two<T> = [T, T];
type CaseItem = { tag: string; meta: string; title: string; text: string; list: string[] };
type Six<T> = [T, T, T, T, T, T];
type Four<T> = [T, T, T, T];
type Three<T> = [T, T, T];

export interface Dict {
  nav: { portfolio: string; about: string };
  cta: { send: string };
  poweredBy: string;
  hero: {
    tag1: string;
    tag2: string;
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
  };
  footer: {
    copyright: string;
    services: string;
    portfolio: string;
    about: string;
    home: string;
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
    tab: string;
  };
}

const en: Dict = {
  nav: { portfolio: "Portfolio", about: "About" },
  cta: { send: "Send a message" },
  poweredBy: "Powered by",
  hero: {
    tag1: "Digital Solutions",
    tag2: "consulting",
    sub: "A senior team for strategy, engineering, and applied AI. We work best when we can be honest early, even if that means challenging the initial idea.",
    what: "What we do",
    tags: ["AI Automation", "Website Development", "AI Integration", "Data & Predictions"],
    build: ["Websites", "Automation", "AI Integration"],
    buildLabel: "What we build",
    book: { title: "Talk with us", role: "Founders · Athens & London", cta: "Book a 15-min call", draft: "Hi, I'd like to book a 15-minute intro call." },
  },
  services: {
    eyebrow: "What we build",
    title: "Two standard builds,",
    titleEm: "or one that's only yours.",
    sub: "Most work lands in one of two standards. When it doesn't, we scope and build exactly what you describe. Consulting-only, build-only or end-to-end, with optional Stewardship once you launch.",
    detailCta: "Start a conversation",
    expand: "Expand for more info",
    collapse: "Minimise",
    cats: [
      {
        key: "brand",
        tag: "Standard",
        name: "Brand Upgrade",
        tagline: "Your public face, rebuilt to look credible and made to convert.",
        desc: "The work people see first. We rebuild your public surface so it loads fast, reads as credible, and turns visitors into enquiries. Strategy, design and build, owned end to end.",
        example: "We built GlobalTeamPlans and dataportfolio.co.uk, focused sites made to be found and to convert.",
        items: [
          { name: "Websites", detail: "Fast, polished marketing sites that win trust and rank on Google." },
          { name: "Web apps", detail: "Logged-in products and tools that feel as smooth as native software." },
          { name: "Platforms", detail: "Multi-sided products where your users, data and workflows live." },
          { name: "SaaS products", detail: "Subscription software, from the first screen to billing and onboarding." },
          { name: "Web shops", detail: "Storefronts built to be found and to check out without friction." },
          { name: "Applications", detail: "Bespoke browser software shaped around how you actually work." },
        ],
      },
      {
        key: "internal",
        tag: "Standard",
        name: "Internal Rewiring",
        tagline: "The work behind the work, automated and made to think.",
        desc: "The systems your customers never see. We connect your tools, remove the repetitive work, and put your own data to work, so the business runs with fewer hands and fewer mistakes.",
        example: "Invoices, reports, handovers and forecasts, all running on time without you.",
        items: [
          { name: "Automation", detail: "The repeating work between your tools, handled quietly in the background." },
          { name: "AI agents", detail: "Assistants that answer, book and follow up, grounded in your real documents." },
          { name: "AI integration", detail: "Modern AI wired into the software and workflows you already run." },
          { name: "Data and prediction", detail: "Straight answers from your data, and forecasts of what comes next." },
        ],
      },
      {
        key: "custom",
        tag: "Bespoke",
        name: "Custom Solution",
        tagline: "Anything you can describe, scoped and built from scratch. If it does not fit a box above, it fits here.",
        desc: "When the problem is yours alone, the build should be too. We scope it with you, say where it creates risk, and build exactly what the problem needs, nothing more.",
        example: "Start with a conversation. We will tell you what we would do, and what we would not.",
        items: [
          { name: "CRM systems", detail: "A sales and client hub shaped around your pipeline, not a template." },
          { name: "Marketplaces", detail: "Two-sided platforms that match supply and demand and take a cut." },
          { name: "Internal tools", detail: "The dashboards and admin panels your team wishes they had." },
          { name: "Data pipelines", detail: "Move, clean and join data so it is ready the moment you need it." },
          { name: "Booking systems", detail: "Calendars, availability and payments that just work." },
          { name: "Whatever else you need", detail: "If you can describe it, we can scope it and build it." },
        ],
      },
    ],
  },
  featured: {
    eyebrow: "Featured work",
    title: "A look at ",
    titleEm: "what we ship.",
    sub: "A couple of recent builds, the rest live in the portfolio.",
    visit: "Visit",
    viewAll: "See all work",
    items: [
      { tag: "Website · SEO · Ads", name: "GlobalTeamPlans", blurb: "A focused marketing site, built to be found.", url: "https://globalteamplans.com", img: "globalteamplans" },
      { tag: "SaaS · Product", name: "dataportfolio.co.uk", blurb: "From idea to a working portfolio-builder SaaS.", url: "https://dataportfolio.co.uk", img: "dataportfolio" },
    ],
  },
  thesis: {
    eyebrow: "A working principle",
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
  },
  footer: {
    copyright: "© 2026 DS2, Digital Solutions Consulting · Athens · London",
    services: "Services",
    portfolio: "Portfolio",
    about: "About",
    home: "Home",
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
        body: "Studied in the Netherlands, then consulting at PwC in Athens. He brings business structure, operating discipline and a clear read of the Greek market.",
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
  panel: {
    title: "Message DS2",
    introUnlocked: "No forms, no login. Tell us what you’re trying to do and it lands straight with the two of us.",
    introLockedPrefix: "Talking to ",
    introLockedSuffix: ". We read every message.",
    phName: "Your name",
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
    tab: "Message DS2",
  },
};

const el: Dict = {
  nav: { portfolio: "Έργα", about: "Σχετικά" },
  cta: { send: "Στείλτε μήνυμα" },
  poweredBy: "Χτισμένο με",
  hero: {
    tag1: "Ψηφιακές Λύσεις",
    tag2: "συμβουλευτική",
    sub: "Μια έμπειρη ομάδα για στρατηγική, μηχανική και εφαρμοσμένη ΤΝ. Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα.",
    what: "Τι κάνουμε",
    tags: ["Αυτοματισμοί ΤΝ", "Κατασκευή Ιστοσελίδων", "Ενσωμάτωση ΤΝ", "Δεδομένα & Προβλέψεις"],
    build: ["Ιστοσελίδες", "Αυτοματισμοί", "Ενσωμάτωση ΤΝ"],
    buildLabel: "Τι φτιάχνουμε",
    book: { title: "Μιλήστε μαζί μας", role: "Ιδρυτές · Αθήνα & Λονδίνο", cta: "Κλείστε κλήση 15'", draft: "Γεια σας, θα ήθελα να κλείσω μια εισαγωγική κλήση 15 λεπτών." },
  },
  services: {
    eyebrow: "Τι φτιάχνουμε",
    title: "Δύο σταθερές λύσεις,",
    titleEm: "ή μία αποκλειστικά δική σας.",
    sub: "Οι περισσότερες συνεργασίες είναι μία από δύο σταθερές λύσεις. Όταν δεν είναι, σχεδιάζουμε και χτίζουμε ακριβώς αυτό που περιγράφετε. Μόνο συμβουλευτική, μόνο υλοποίηση ή ολοκληρωμένα, με προαιρετικό Stewardship μετά την κυκλοφορία.",
    detailCta: "Ξεκινήστε μια συζήτηση",
    expand: "Δείτε περισσότερα",
    collapse: "Σύμπτυξη",
    cats: [
      {
        key: "brand",
        tag: "Σταθερή",
        name: "Αναβάθμιση Brand",
        tagline: "Το δημόσιο πρόσωπό σας, ξαναχτισμένο για κύρος και για αποτέλεσμα.",
        desc: "Αυτό που βλέπει πρώτο ο κόσμος. Ξαναχτίζουμε τη δημόσια εικόνα σας ώστε να φορτώνει γρήγορα, να εμπνέει εμπιστοσύνη και να μετατρέπει επισκέπτες σε ενδιαφερόμενους. Στρατηγική, σχεδιασμός και υλοποίηση, από την αρχή ως το τέλος.",
        example: "Φτιάξαμε τα GlobalTeamPlans και dataportfolio.co.uk, στοχευμένες σελίδες που βρίσκονται και πείθουν.",
        items: [
          { name: "Ιστοσελίδες", detail: "Γρήγορες, καλοφτιαγμένες σελίδες που κερδίζουν εμπιστοσύνη και βρίσκονται στο Google." },
          { name: "Web apps", detail: "Προϊόντα και εργαλεία με σύνδεση, τόσο ομαλά όσο μια native εφαρμογή." },
          { name: "Πλατφόρμες", detail: "Προϊόντα πολλαπλών πλευρών όπου ζουν οι χρήστες, τα δεδομένα και οι ροές σας." },
          { name: "Προϊόντα SaaS", detail: "Λογισμικό με συνδρομή, από την πρώτη οθόνη ως τη χρέωση και το onboarding." },
          { name: "Ηλεκτρονικά καταστήματα", detail: "Καταστήματα φτιαγμένα για να βρίσκονται και να ολοκληρώνουν αγορές χωρίς τριβή." },
          { name: "Εφαρμογές", detail: "Λογισμικό browser φτιαγμένο γύρω από τον τρόπο που πραγματικά δουλεύετε." },
        ],
      },
      {
        key: "internal",
        tag: "Σταθερή",
        name: "Εσωτερική Αναδιάρθρωση",
        tagline: "Η δουλειά πίσω από τη δουλειά, αυτοματοποιημένη και έξυπνη.",
        desc: "Τα συστήματα που δεν βλέπουν οι πελάτες σας. Συνδέουμε τα εργαλεία σας, αφαιρούμε την επαναλαμβανόμενη δουλειά και αξιοποιούμε τα δικά σας δεδομένα, ώστε η επιχείρηση να τρέχει με λιγότερα χέρια και λιγότερα λάθη.",
        example: "Τιμολόγια, αναφορές, παραδόσεις και προβλέψεις, όλα στην ώρα τους χωρίς εσάς.",
        items: [
          { name: "Αυτοματισμοί", detail: "Η επαναλαμβανόμενη δουλειά ανάμεσα στα εργαλεία σας, ήσυχα στο παρασκήνιο." },
          { name: "AI agents", detail: "Βοηθοί που απαντούν, κλείνουν ραντεβού και κάνουν follow-up, με βάση τα έγγραφά σας." },
          { name: "Ενσωμάτωση AI", detail: "Σύγχρονο AI ενσωματωμένο στο λογισμικό και τις ροές που ήδη έχετε." },
          { name: "Δεδομένα και προβλέψεις", detail: "Ξεκάθαρες απαντήσεις από τα δεδομένα σας, και προβλέψεις για το τι έρχεται." },
        ],
      },
      {
        key: "custom",
        tag: "Κατά παραγγελία",
        name: "Custom Λύση",
        tagline: "Ό,τι μπορείτε να περιγράψετε, σχεδιασμένο και φτιαγμένο από την αρχή. Αν δεν χωράει σε κάποιο κουτί παραπάνω, χωράει εδώ.",
        desc: "Όταν το πρόβλημα είναι μόνο δικό σας, το ίδιο πρέπει να είναι και η λύση. Το σχεδιάζουμε μαζί σας, λέμε πού δημιουργεί ρίσκο, και χτίζουμε ακριβώς αυτό που χρειάζεται, τίποτα παραπάνω.",
        example: "Ξεκινήστε με μια συζήτηση. Θα σας πούμε τι θα κάναμε, και τι δεν θα κάναμε.",
        items: [
          { name: "Συστήματα CRM", detail: "Ένα κέντρο πωλήσεων και πελατών φτιαγμένο γύρω από το pipeline σας, όχι template." },
          { name: "Marketplaces", detail: "Πλατφόρμες δύο πλευρών που ενώνουν ζήτηση και προσφορά και κρατούν προμήθεια." },
          { name: "Εσωτερικά εργαλεία", detail: "Τα dashboards και τα admin panel που εύχεται η ομάδα σας." },
          { name: "Data pipelines", detail: "Μεταφορά, καθαρισμός και ένωση δεδομένων, έτοιμα τη στιγμή που τα χρειάζεστε." },
          { name: "Συστήματα κρατήσεων", detail: "Ημερολόγια, διαθεσιμότητα και πληρωμές που απλώς δουλεύουν." },
          { name: "Ό,τι άλλο χρειάζεστε", detail: "Αν μπορείτε να το περιγράψετε, μπορούμε να το σχεδιάσουμε και να το χτίσουμε." },
        ],
      },
    ],
  },
  featured: {
    eyebrow: "Επιλεγμένες δουλειές",
    title: "Μια ματιά σε ",
    titleEm: "αυτά που παραδίδουμε.",
    sub: "Μερικές πρόσφατες δουλειές, οι υπόλοιπες είναι στα έργα.",
    visit: "Επίσκεψη",
    viewAll: "Δείτε όλες τις δουλειές",
    items: [
      { tag: "Ιστοσελίδα · SEO · Ads", name: "GlobalTeamPlans", blurb: "Μια στοχευμένη ιστοσελίδα marketing, φτιαγμένη για να τη βρίσκουν.", url: "https://globalteamplans.com", img: "globalteamplans" },
      { tag: "SaaS · Προϊόν", name: "dataportfolio.co.uk", blurb: "Από ιδέα σε λειτουργικό SaaS δημιουργίας portfolio.", url: "https://dataportfolio.co.uk", img: "dataportfolio" },
    ],
  },
  thesis: {
    eyebrow: "Μια αρχή που μας καθοδηγεί",
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
    sub: "Όταν μιλάτε με τη DS2, μιλάτε με έναν από τους δύο. Δεν σας περνάμε ποτέ σε junior προσωπικό, όσο μεγάλο κι αν γίνει το έργο.",
    role: "Ιδρυτής",
    f1Title: "Επικεφαλής Στρατηγικής & Συμβουλευτικής.",
    f1Desc: "Σχέσεις με πελάτες, εμπορική στρατηγική, συμβουλευτική. Αυτός που κάνει τις δύσκολες ερωτήσεις νωρίς, ώστε να μην τεθούν αργά από κάποιον με λιγότερη εικόνα.",
    f1Loc: "Αθήνα",
    f2Title: "Επικεφαλής Μηχανικής & Δεδομένων.",
    f2Desc: "Αρχιτεκτονική, δεδομένα και ML, τεχνική παράδοση. Αυτός που κρίνει αν αυτό που προτείνουμε θα στέκεται ακόμη σε τρία χρόνια, και το λέει πριν το παραδώσουμε.",
    f2Loc: "Λονδίνο",
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
      "Γεια σας DS2, έχουμε έναν <hl>οικογενειακό όμιλο εστιατορίων</hl> με τέσσερα σημεία στην πόλη. Η τωρινή μας ιστοσελίδα είναι ένα template που έχουμε χρόνια να αγγίξουμε, και φαίνεται.",
      "Θέλουμε κάτι που να δείχνει πραγματικά <hl>premium</hl>, να φορτώνει γρήγορα στο κινητό, με online κρατήσεις και μενού που θα ενημερώνουμε μόνοι μας.",
      "Μπορούμε να κλείσουμε ένα 30λεπτο τηλεφώνημα την επόμενη εβδομάδα;",
    ],
    statusDrafting: "Σύνταξη · Αθήνα / Λονδίνο",
    statusReady: "Έτοιμο για αποστολή · Αθήνα / Λονδίνο",
    caption: "// Ιδρύθηκε το 2026. Ή γράψτε μας απευθείας στο ",
  },
  footer: {
    copyright: "© 2026 DS2, Digital Solutions Consulting · Αθήνα · Λονδίνο",
    services: "Υπηρεσίες",
    portfolio: "Έργα",
    about: "Σχετικά",
    home: "Αρχική",
    headline: "Ψηφιακές λύσεις, χτισμένες και υποστηριγμένες ως το τέλος.",
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
        body: "Σπούδασε και δούλεψε στο Λονδίνο. Φέρνει τον τεχνικό πυρήνα, αρχιτεκτονική, συστήματα δεδομένων, αυτοματισμό και εφαρμοσμένη AI, σε ένα επίπεδο που ορίζει μια πιο απαιτητική αγορά.",
      },
      {
        id: "stelios",
        eyebrow: "Συμβουλευτική & Στρατηγική · Αθήνα",
        title: "Στέλιος",
        body: "Σπούδασε στην Ολλανδία και συνέχισε στη συμβουλευτική, στην PwC στην Αθήνα. Φέρνει επιχειρηματική δομή, πειθαρχία στη λειτουργία και καθαρή ανάγνωση της ελληνικής αγοράς.",
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
        title: "Μια στοχευμένη ιστοσελίδα marketing, φτιαγμένη για να τη βρίσκουν.",
        text: "Σχεδιάσαμε και χτίσαμε την ιστοσελίδα από την αρχή ως το τέλος, και μετά φροντίσαμε να φέρνει πραγματικά επισκεψιμότητα: τεχνικό και on-page SEO, μαζί με λογαριασμό Google Ads στημένο και ενεργό ώστε να φτάνει σε κόσμο από την πρώτη μέρα.",
        list: ["Σχεδιασμός και κατασκευή ιστοσελίδας", "Τεχνικό και on-page SEO", "Στήσιμο και εκκίνηση Google Ads"],
      },
      {
        tag: "Ιστοσελίδες",
        meta: "SaaS · Κατασκευή προϊόντος",
        title: "Ένα SaaS για τη δημιουργία portfolio.",
        text: "Ο πελάτης ήθελε να λανσάρει ένα προϊόν που επιτρέπει στον κόσμο να φτιάχνει portfolio. Το πήγαμε από ιδέα σε λειτουργικό SaaS: την ίδια την εφαρμογή και την ιστοσελίδα γύρω της.",
        list: ["Κατασκευή προϊόντος και UX", "Πλήρης εφαρμογή SaaS", "Ιστοσελίδα marketing γύρω από το προϊόν"],
      },
      {
        tag: "Ιστοσελίδες",
        meta: "Προετοιμασία ιατρικών εξετάσεων · ΗΒ · Συμβουλευτική",
        title: "Μια κορυφαία πλατφόρμα στο ΗΒ που βοηθά γιατρούς να προετοιμαστούν για τις εξετάσεις τους.",
        text: "Αναλάβαμε την τεχνική συμβουλευτική από την αρχή ως το τέλος στις αποφάσεις που μετρούσαν. Σε ποιο stack να χτίσουν, ποιους ρόλους να προσλάβουν και με ποια σειρά, και τους βοηθήσαμε να βρουν τους ανθρώπους. Μαζί με τις συμβουλές, φτιάξαμε ένα υψηλής ποιότητας πρωτότυπο σχεδιασμού της ιστοσελίδας τους, για να έχουν πραγματική διαπραγματευτική ισχύ στις προσφορές κατασκευής και πιο καθαρή κατεύθυνση για το UI.",
        list: ["Καθοδήγηση για stack και αρχιτεκτονική", "Σχέδιο προσλήψεων και υποστήριξη εύρεσης", "Πρωτότυπο σχεδιασμού υψηλής ποιότητας για διαπραγμάτευση τιμών και κατεύθυνση UI"],
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
  panel: {
    title: "Μήνυμα στη DS2",
    introUnlocked: "Χωρίς φόρμες, χωρίς login. Πείτε μας τι θέλετε να κάνετε και φτάνει κατευθείαν στους δυο μας.",
    introLockedPrefix: "Μιλάτε με ",
    introLockedSuffix: ". Διαβάζουμε κάθε μήνυμα.",
    phName: "Το όνομά σας",
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
    tab: "Μήνυμα στη DS2",
  },
};

export const dict: Record<Lang, Dict> = { en, el };
