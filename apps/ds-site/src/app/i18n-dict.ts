/**
 * DS2 site copy, EN + EL.
 * Greek is a first professional draft — review/refine before treating as final.
 * Inline markup conventions:
 *   - titles split into plain + `Em` (rendered inside <em>)
 *   - <hl>…</hl> in compose-draft strings is parsed by the typewriter
 */

export type Lang = "en" | "el";

type SvcItem = { name: string; body: string };
type EngageMode = { num: string; title: string; best: string; bestLabel: string; desc: string };
type AboutBlock = { k: string; p: string };
type CaseItem = { tag: string; meta: string; title: string; text: string; list: string[] };
type Six<T> = [T, T, T, T, T, T];
type Four<T> = [T, T, T, T];
type Three<T> = [T, T, T];

export interface Dict {
  nav: { portfolio: string; about: string };
  cta: { send: string };
  hero: { tag1: string; tag2: string; sub: string; what: string };
  services: {
    eyebrow: string;
    title: string;
    titleEm: string;
    sub: string;
    items: Six<SvcItem>;
  };
  thesis: { eyebrow: string; quote: string; quoteEm: string; quoteEnd: string; by: string };
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
    quote: string;
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
  footer: { copyright: string; services: string; portfolio: string; about: string };
  about: {
    eyebrow: string;
    title: string;
    titleEm: string;
    titleEnd: string;
    sub: string;
    blocks: Four<AboutBlock>;
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
    errMsg: string;
    errGeneric: string;
    errNetwork: string;
    tab: string;
  };
}

const en: Dict = {
  nav: { portfolio: "Portfolio", about: "About" },
  cta: { send: "Send a message" },
  hero: {
    tag1: "Digital Solutions",
    tag2: "consulting",
    sub: "A senior team for strategy, engineering, and applied AI. We work best when we can be honest early, even if that means challenging the initial idea.",
    what: "What we do",
  },
  services: {
    eyebrow: "Services",
    title: "Six things we build,",
    titleEm: "and we build them seriously.",
    sub: "No menu padding. Each of these is something we'd take responsibility for end-to-end, or refuse the engagement.",
    items: [
      { name: "Websites", body: "Fast, polished sites built to win trust and convert." },
      { name: "AI assistant", body: "Texts and calls your customers, books jobs and follows up — day and night." },
      { name: "Automation", body: "The repetitive work between your tools, handled in the background." },
      { name: "Data", body: "Straight answers from your data — what's going on and what to do next." },
      { name: "Predictions", body: "Spot demand, risk, and opportunity before they arrive." },
      { name: "Mobile apps", body: "iOS and Android that feel fast and native." },
    ],
  },
  thesis: {
    eyebrow: "A working principle",
    quote: "The biggest cost is ",
    quoteEm: "lack of knowledge",
    quoteEnd: ".",
    by: "— DS2",
  },
  engage: {
    eyebrow: "How we engage",
    title: "Three modes.",
    titleEm: "You pick one.",
    sub: "No bundles, no upsell. Each mode is its own contract, scoped to what you actually need.",
    modes: [
      {
        num: "MODE 01",
        title: "Consulting only.",
        bestLabel: "Best for:",
        best: " teams who already build, but want a second pair of senior eyes.",
        desc: "We pressure-test the plan, the architecture and the team, without writing a line of code.",
      },
      {
        num: "MODE 02",
        title: "Build only.",
        bestLabel: "Best for:",
        best: " when the spec is clear and you need senior hands to ship it.",
        desc: "You bring the spec. We ship it with senior engineers and weekly visibility, in code we'd maintain ourselves.",
      },
      {
        num: "MODE 03",
        title: "End-to-end.",
        bestLabel: "Best for:",
        best: " early ideas, ambiguous problems, full accountability under one roof.",
        desc: "Strategy, design, build and handoff under one roof. Where challenge-first pays back the most.",
      },
    ],
    rows: {
      strategy: "Strategy & diagnostic",
      build: "Build & delivery",
      handover: "Handover docs",
      stewardship: "Stewardship",
    },
    tags: { included: "included", none: "—", addon: "add-on" },
    stewardshipTag: "Optional",
    stewardshipLead: "Stewardship.",
    stewardshipRest: " A monthly retainer after delivery. We keep eyes on what we built. Patching, monitoring, and the occasional honest call when something's drifting.",
    ctaText: "Not sure which one fits? Tell us what you're trying to do and we'll point you straight.",
  },
  founders: {
    eyebrow: "Team",
    title: "Two senior founders.",
    titleEm: "No layers in between.",
    sub: "When you talk to DS2, you talk to one of these two. That doesn't change as the engagement grows.",
    role: "Founder",
    f1Title: "Head of Strategy & Consulting.",
    f1Desc: "Client relationships, commercial strategy, advisory. The person who asks the uncomfortable questions early, so they're not asked late by someone with less context.",
    f1Loc: "Athens",
    f2Title: "Head of Engineering & Data.",
    f2Desc: "Architecture, data and ML, technical delivery. The person who decides whether what we're proposing will still be standing in three years, and says so before we ship it.",
    f2Loc: "London",
    quote: "We don't certify your organisation. We take responsibility for what we build.",
  },
  contact: {
    eyebrow: "Contact",
    title: "Tell us what you're ",
    titleEm: "actually",
    titleEnd: " trying to do.",
    sub: "Three lines is enough. We'll write back within the week, usually the same day.",
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
    copyright: "© 2026 DS2 — Digital Solutions Consulting · Athens · London",
    services: "Services",
    portfolio: "Portfolio",
    about: "About",
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
    missionK: "Mission",
    mission: "To make Greek businesses genuinely proficient with technology — closing the gap between what they do and the tools that could take them much further.",
    visionK: "Vision",
    vision: "A Greece that evolves drastically: where small and medium businesses compete on a global level, because technology stopped holding them back.",
    cityAthens: "Athens",
    cityLondon: "London",
    citiesCap: "Athens and London — where we live and work",
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
    phEmail: "Email (optional, so we can reply)",
    ackBase: "Delivered to DS2",
    ackWithEmail: " · we’ll reply by email",
    ackNoEmail: " · add an email above if you’d like a reply",
    composeLocked: "Add another message…",
    composeUnlocked: "What are you trying to build?",
    send: "Send",
    sending: "Sending…",
    footSent: "Sent · Athens / London",
    footIdle: "Athens / London · usually same-day",
    errName: "Add your name first.",
    errMsg: "Write a message first.",
    errGeneric: "Something went wrong. Try again.",
    errNetwork: "Couldn't reach us. Check your connection and retry.",
    tab: "Message DS2",
  },
};

const el: Dict = {
  nav: { portfolio: "Έργα", about: "Σχετικά" },
  cta: { send: "Στείλτε μήνυμα" },
  hero: {
    tag1: "Ψηφιακές Λύσεις",
    tag2: "συμβουλευτική",
    sub: "Μια έμπειρη ομάδα για στρατηγική, μηχανική και εφαρμοσμένη ΤΝ. Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα.",
    what: "Τι κάνουμε",
  },
  services: {
    eyebrow: "Υπηρεσίες",
    title: "Έξι πράγματα που φτιάχνουμε,",
    titleEm: "και τα φτιάχνουμε σοβαρά.",
    sub: "Χωρίς περιττά. Για καθένα από αυτά αναλαμβάνουμε την ευθύνη από την αρχή ως το τέλος — αλλιώς δεν αναλαμβάνουμε το έργο.",
    items: [
      { name: "Ιστοσελίδες", body: "Γρήγορες, καλοφτιαγμένες ιστοσελίδες που κερδίζουν εμπιστοσύνη και πελάτες." },
      { name: "Ψηφιακός βοηθός", body: "Στέλνει μηνύματα και τηλεφωνεί στους πελάτες σας, κλείνει ραντεβού και κάνει follow-up — μέρα νύχτα." },
      { name: "Αυτοματισμοί", body: "Η επαναλαμβανόμενη δουλειά ανάμεσα στα εργαλεία σας, να γίνεται στο παρασκήνιο." },
      { name: "Δεδομένα", body: "Ξεκάθαρες απαντήσεις από τα δεδομένα σας — τι συμβαίνει και τι να κάνετε στη συνέχεια." },
      { name: "Προβλέψεις", body: "Εντοπίστε ζήτηση, ρίσκο και ευκαιρίες πριν εμφανιστούν." },
      { name: "Εφαρμογές κινητού", body: "iOS και Android που μοιάζουν γρήγορες και φυσικές." },
    ],
  },
  thesis: {
    eyebrow: "Μια αρχή που μας καθοδηγεί",
    quote: "Το μεγαλύτερο κόστος είναι ",
    quoteEm: "η έλλειψη γνώσης",
    quoteEnd: ".",
    by: "— DS2",
  },
  engage: {
    eyebrow: "Πώς συνεργαζόμαστε",
    title: "Τρεις τρόποι.",
    titleEm: "Διαλέγετε εσείς.",
    sub: "Χωρίς πακέτα, χωρίς upsell. Κάθε τρόπος είναι ξεχωριστή συμφωνία, προσαρμοσμένη σε αυτό που πραγματικά χρειάζεστε.",
    modes: [
      {
        num: "ΤΡΟΠΟΣ 01",
        title: "Μόνο συμβουλευτική.",
        bestLabel: "Ιδανικό για:",
        best: " ομάδες που ήδη χτίζουν, αλλά θέλουν ένα δεύτερο έμπειρο ζευγάρι μάτια.",
        desc: "Δοκιμάζουμε στην πράξη το σχέδιο, την αρχιτεκτονική και την ομάδα, χωρίς να γράψουμε γραμμή κώδικα.",
      },
      {
        num: "ΤΡΟΠΟΣ 02",
        title: "Μόνο υλοποίηση.",
        bestLabel: "Ιδανικό για:",
        best: " όταν η προδιαγραφή είναι ξεκάθαρη και χρειάζεστε έμπειρα χέρια να την υλοποιήσουν.",
        desc: "Φέρνετε την προδιαγραφή. Την υλοποιούμε με έμπειρους μηχανικούς και εβδομαδιαία ενημέρωση, σε κώδικα που θα συντηρούσαμε κι εμείς οι ίδιοι.",
      },
      {
        num: "ΤΡΟΠΟΣ 03",
        title: "Από την αρχή ως το τέλος.",
        bestLabel: "Ιδανικό για:",
        best: " πρώιμες ιδέες, ασαφή προβλήματα, πλήρη ευθύνη κάτω από μία στέγη.",
        desc: "Στρατηγική, σχεδιασμός, υλοποίηση και παράδοση κάτω από μία στέγη. Εδώ η προσέγγιση «πρώτα η αμφισβήτηση» αποδίδει περισσότερο.",
      },
    ],
    rows: {
      strategy: "Στρατηγική & διάγνωση",
      build: "Υλοποίηση & παράδοση",
      handover: "Τεκμηρίωση παράδοσης",
      stewardship: "Επίβλεψη",
    },
    tags: { included: "περιλαμβάνεται", none: "—", addon: "προαιρετικό" },
    stewardshipTag: "Προαιρετικό",
    stewardshipLead: "Επίβλεψη.",
    stewardshipRest: " Μηνιαία συνεργασία μετά την παράδοση. Κρατάμε το μάτι μας σε ό,τι φτιάξαμε. Διορθώσεις, παρακολούθηση και η περιστασιακή ειλικρινής κουβέντα όταν κάτι αρχίζει να ξεφεύγει.",
    ctaText: "Δεν είστε σίγουροι ποιος ταιριάζει; Πείτε μας τι θέλετε να πετύχετε και θα σας κατευθύνουμε.",
  },
  founders: {
    eyebrow: "Ομάδα",
    title: "Δύο έμπειροι ιδρυτές.",
    titleEm: "Κανένα ενδιάμεσο επίπεδο.",
    sub: "Όταν μιλάτε με τη DS2, μιλάτε με έναν από τους δύο. Αυτό δεν αλλάζει όσο μεγαλώνει το έργο.",
    role: "Ιδρυτής",
    f1Title: "Επικεφαλής Στρατηγικής & Συμβουλευτικής.",
    f1Desc: "Σχέσεις με πελάτες, εμπορική στρατηγική, συμβουλευτική. Αυτός που κάνει τις δύσκολες ερωτήσεις νωρίς, ώστε να μην τεθούν αργά από κάποιον με λιγότερη εικόνα.",
    f1Loc: "Αθήνα",
    f2Title: "Επικεφαλής Μηχανικής & Δεδομένων.",
    f2Desc: "Αρχιτεκτονική, δεδομένα και ML, τεχνική παράδοση. Αυτός που κρίνει αν αυτό που προτείνουμε θα στέκεται ακόμη σε τρία χρόνια, και το λέει πριν το παραδώσουμε.",
    f2Loc: "Λονδίνο",
    quote: "Δεν πιστοποιούμε τον οργανισμό σας. Αναλαμβάνουμε την ευθύνη για αυτό που φτιάχνουμε.",
  },
  contact: {
    eyebrow: "Επικοινωνία",
    title: "Πείτε μας τι ",
    titleEm: "πραγματικά",
    titleEnd: " θέλετε να πετύχετε.",
    sub: "Τρεις γραμμές αρκούν. Απαντάμε μέσα στην εβδομάδα, συνήθως την ίδια μέρα.",
    newMessage: "Νέο μήνυμα",
    from: "Από:",
    to: "Προς:",
    subject: "Θέμα:",
    draftSubject: "Η ιστοσελίδα μας μοιάζει φτιαγμένη το 2014.",
    draftBody: [
      "Γεια σας DS2, έχουμε έναν <hl>οικογενειακό όμιλο εστιατορίων</hl> με τέσσερα σημεία στην πόλη. Η τωρινή μας ιστοσελίδα είναι ένα template που έχουμε χρόνια να αγγίξουμε — και φαίνεται.",
      "Θέλουμε κάτι που να δείχνει πραγματικά <hl>premium</hl>, να φορτώνει γρήγορα στο κινητό, με online κρατήσεις και μενού που θα ενημερώνουμε μόνοι μας.",
      "Μπορούμε να κλείσουμε ένα 30λεπτο τηλεφώνημα την επόμενη εβδομάδα;",
    ],
    statusDrafting: "Σύνταξη · Αθήνα / Λονδίνο",
    statusReady: "Έτοιμο για αποστολή · Αθήνα / Λονδίνο",
    caption: "// Ιδρύθηκε το 2026. Ή γράψτε μας απευθείας στο ",
  },
  footer: {
    copyright: "© 2026 DS2 — Digital Solutions Consulting · Αθήνα · Λονδίνο",
    services: "Υπηρεσίες",
    portfolio: "Έργα",
    about: "Σχετικά",
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
        p: "Η Αθήνα κινείται πιο αργά στην τεχνολογία απ’ όσο θα έπρεπε, και αυτό το κενό μεγαλώνει. Αν το αφήσεις, γίνεται πραγματικό μειονέκτημα για τις επιχειρήσεις εδώ — όχι σε κάποιο μακρινό μέλλον, αλλά μέσα στα επόμενα χρόνια.",
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
    missionK: "Αποστολή",
    mission: "Να κάνουμε τις ελληνικές επιχειρήσεις πραγματικά ικανές με την τεχνολογία — κλείνοντας το κενό ανάμεσα σε αυτό που κάνουν και στα εργαλεία που θα μπορούσαν να τις πάνε πολύ πιο μακριά.",
    visionK: "Όραμα",
    vision: "Μια Ελλάδα που εξελίσσεται δραστικά: όπου οι μικρομεσαίες επιχειρήσεις ανταγωνίζονται σε παγκόσμιο επίπεδο, επειδή η τεχνολογία σταμάτησε να τις κρατά πίσω.",
    cityAthens: "Αθήνα",
    cityLondon: "Λονδίνο",
    citiesCap: "Αθήνα και Λονδίνο — εκεί που ζούμε και δουλεύουμε",
    coda: "Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς, ακόμη κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα.",
  },
  portfolio: {
    eyebrow: "Επιλεγμένες δουλειές",
    title: "Μερικές συνεργασίες, ",
    titleEm: "ειλικρινά.",
    sub: "Πρώτες δουλειές, με όνομα όπου ο πελάτης χαίρεται να εμφανίζεται. Λέμε τι κάναμε — και τι δεν κάναμε.",
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
        text: "Αναλάβαμε την τεχνική συμβουλευτική από την αρχή ως το τέλος στις αποφάσεις που μετρούσαν. Σε ποιο stack να χτίσουν, ποιους ρόλους να προσλάβουν και με ποια σειρά — και τους βοηθήσαμε να βρουν τους ανθρώπους. Μαζί με τις συμβουλές, φτιάξαμε ένα υψηλής ποιότητας πρωτότυπο σχεδιασμού της ιστοσελίδας τους, για να έχουν πραγματική διαπραγματευτική ισχύ στις προσφορές κατασκευής και πιο καθαρή κατεύθυνση για το UI.",
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
    phEmail: "Email (προαιρετικό, για να απαντήσουμε)",
    ackBase: "Παραδόθηκε στη DS2",
    ackWithEmail: " · θα απαντήσουμε με email",
    ackNoEmail: " · προσθέστε email παραπάνω αν θέλετε απάντηση",
    composeLocked: "Προσθέστε άλλο μήνυμα…",
    composeUnlocked: "Τι θέλετε να φτιάξετε;",
    send: "Αποστολή",
    sending: "Αποστολή…",
    footSent: "Στάλθηκε · Αθήνα / Λονδίνο",
    footIdle: "Αθήνα / Λονδίνο · συνήθως αυθημερόν",
    errName: "Προσθέστε πρώτα το όνομά σας.",
    errMsg: "Γράψτε πρώτα ένα μήνυμα.",
    errGeneric: "Κάτι πήγε στραβά. Δοκιμάστε ξανά.",
    errNetwork: "Δεν μπορέσαμε να επικοινωνήσουμε. Ελέγξτε τη σύνδεσή σας και ξαναδοκιμάστε.",
    tab: "Μήνυμα στη DS2",
  },
};

export const dict: Record<Lang, Dict> = { en, el };
