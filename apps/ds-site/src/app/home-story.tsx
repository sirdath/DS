"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useLang } from "./i18n";
import "./home-story.css";

type GoalKey = "customers" | "time" | "idea";
type TemplateKey = "atelier" | "padel";

const copy = {
  en: {
    goals: {
      prompt: "What would make the biggest difference right now?",
      options: {
        customers: "Bring in more customers",
        time: "Give my team time back",
        idea: "Build a new idea",
      },
      answers: {
        customers: ["A stronger website, shop or booking journey.", "Make the first impression clearer, build trust faster and turn more visits into enquiries or sales."],
        time: ["Automation where the work keeps repeating.", "Connect the tools you use, remove manual steps and give your team hours back every week."],
        idea: ["A custom product shaped around the opportunity.", "Turn the idea into a clear scope, challenge the risks early and build the useful version."],
      },
      label: "We would explore",
      cta: "Show me how",
    },
    capability: {
      eyebrow: "One senior team. The right shape for the problem.",
      title: "DS2 connects the customer experience to the systems behind it.",
      intro: "Move across the capabilities. Each one is a starting point, never a fixed package.",
      selected: "Currently exploring",
      words: ["Websites", "Online shops", "Booking", "Automation", "AI assistants", "CRM systems", "Dashboards", "Custom apps"],
    },
    services: {
      eyebrow: "Three ways we create value",
      title: "From what customers see to how the work gets done.",
      intro: "You do not need to know the solution. Start with the problem that feels familiar.",
      cards: [
        {
          kicker: "When customers do not see your value",
          title: "Upgrade your public face.",
          body: "We create the website, online shop, booking system or app that shows your business at its best — fast, credible and simple to use.",
          items: ["Websites that generate enquiries", "Online shops that make buying easy", "Booking and payment journeys", "Web and mobile applications"],
          result: "The result → a stronger first impression",
          image: "/services/atmos-brand-wide.webp",
        },
        {
          kicker: "When manual work keeps coming back",
          title: "Rewire the work behind the work.",
          body: "We connect your tools, automate routine tasks and use AI where it creates a real advantage — fewer mistakes, faster service, hours returned.",
          items: ["Workflow and admin automation", "AI receptionist and website chat", "Customer follow-ups and newsletters", "Data, reporting and forecasts"],
          result: "The result → fewer manual tasks",
          image: "/services/atmos-internal-wide.webp",
        },
        {
          kicker: "When the right solution does not exist",
          title: "Build something that is only yours.",
          body: "From a CRM shaped around your team to a new marketplace or internal platform, we turn the idea into a clear scope and a working product.",
          items: ["Custom CRM and internal systems", "Dashboards and data pipelines", "Marketplaces and SaaS products", "Anything useful you can describe"],
          result: "The result → software that fits",
          image: "/services/atmos-custom-wide.webp",
        },
      ],
    },
    templates: {
      eyebrow: "Ready-to-tailor directions",
      title: "See the difference before we explain it.",
      intro: "Choose a direction, then move across the preview. The useful part is not the template — it is how quickly the right experience can become tangible.",
      explore: "Explore the experience",
      items: {
        atelier: { name: "Atelier", type: "Fashion commerce", body: "A premium shop direction built around discovery, trust and a frictionless path to purchase.", image: "/templates/atelier.png", notes: ["Brand story", "Product discovery", "Clear purchase path"] },
        padel: { name: "Padel City", type: "Booking experience", body: "A booking-first direction that turns availability, payment and repeat visits into one clear journey.", image: "/templates/padel.png", notes: ["Live availability", "Fast booking", "Customer retention"] },
      },
    },
    work: {
      eyebrow: "Featured work",
      title: "Real work. Visible on hover.",
      intro: "Two businesses, two very different needs, and no template answer.",
      all: "See all projects",
      open: "Open project",
      items: [
        { name: "GlobalTeamPlans", tag: "Website · SEO · Lead generation", year: "2026", image: "/portfolio/globalteamplans.png", href: "https://globalteamplans.com" },
        { name: "dataportfolio.co.uk", tag: "SaaS · Product · Platform", year: "2026", image: "/portfolio/dataportfolio.png", href: "https://dataportfolio.co.uk" },
      ],
    },
    delivery: {
      eyebrow: "A different kind of delivery",
      quote: "We would rather challenge the idea in the first meeting than bill for the problem in the sixth.",
      steps: [["01", "Diagnose", "Understand what the business actually needs."], ["02", "Challenge", "Explain risk and show a useful alternative."], ["03", "Deliver", "Senior strategy and engineering remain accountable."], ["04", "Stay", "Optional stewardship after the project launches."]],
    },
    journey: {
      eyebrow: "Two bases. One DS2.",
      title: "Based in Athens and London.",
      intro: "One team operating from both cities, combining close local understanding with an international perspective.",
      athens: "Our Athens base keeps us close to Greek businesses and the practical value they need to see.",
      london: "Our London base keeps us connected to a market that expects clarity, pace and proof.",
      cue: "Scroll to connect both bases",
    },
  },
  el: {
    goals: {
      prompt: "Τι θα έκανε τη μεγαλύτερη διαφορά αυτή τη στιγμή;",
      options: { customers: "Περισσότεροι πελάτες", time: "Περισσότερος χρόνος στην ομάδα", idea: "Μια νέα ιδέα" },
      answers: {
        customers: ["Μια ισχυρότερη ιστοσελίδα, e-shop ή εμπειρία κρατήσεων.", "Πιο ξεκάθαρη πρώτη εντύπωση, ταχύτερη εμπιστοσύνη και περισσότερες επισκέψεις που γίνονται πωλήσεις ή αιτήματα."],
        time: ["Αυτοματισμός εκεί όπου η δουλειά επαναλαμβάνεται.", "Συνδέουμε τα εργαλεία σας, αφαιρούμε χειροκίνητα βήματα και επιστρέφουμε ώρες στην ομάδα κάθε εβδομάδα."],
        idea: ["Ένα προσαρμοσμένο προϊόν γύρω από την ευκαιρία.", "Μετατρέπουμε την ιδέα σε σαφές πλάνο, αμφισβητούμε έγκαιρα τους κινδύνους και χτίζουμε τη χρήσιμη εκδοχή."],
      },
      label: "Θα εξετάζαμε",
      cta: "Δείξτε μου πώς",
    },
    capability: {
      eyebrow: "Μία έμπειρη ομάδα. Η σωστή μορφή για το πρόβλημα.",
      title: "Η DS2 συνδέει την εμπειρία του πελάτη με τα συστήματα πίσω από αυτή.",
      intro: "Περάστε πάνω από τις δυνατότητες. Κάθε μία είναι αφετηρία, ποτέ ένα σταθερό πακέτο.",
      selected: "Εξετάζουμε",
      words: ["Ιστοσελίδες", "E-shop", "Κρατήσεις", "Αυτοματισμοί", "AI βοηθοί", "Συστήματα CRM", "Dashboards", "Custom εφαρμογές"],
    },
    services: {
      eyebrow: "Τρεις τρόποι με τους οποίους δημιουργούμε αξία",
      title: "Από αυτό που βλέπουν οι πελάτες μέχρι το πώς γίνεται η δουλειά.",
      intro: "Δεν χρειάζεται να γνωρίζετε τη λύση. Ξεκινήστε από το πρόβλημα που σας φαίνεται γνώριμο.",
      cards: [
        { kicker: "Όταν οι πελάτες δεν βλέπουν την αξία σας", title: "Αναβαθμίστε τη δημόσια εικόνα σας.", body: "Δημιουργούμε την ιστοσελίδα, το e-shop, το σύστημα κρατήσεων ή την εφαρμογή που παρουσιάζει την επιχείρησή σας όπως της αξίζει — γρήγορα, αξιόπιστα και απλά.", items: ["Ιστοσελίδες που φέρνουν αιτήματα", "E-shop που κάνουν την αγορά εύκολη", "Κρατήσεις και πληρωμές", "Web και mobile εφαρμογές"], result: "Το αποτέλεσμα → ισχυρότερη πρώτη εντύπωση", image: "/services/atmos-brand-wide.webp" },
        { kicker: "Όταν η χειροκίνητη δουλειά επιστρέφει συνεχώς", title: "Αλλάξτε τη δουλειά πίσω από τη δουλειά.", body: "Συνδέουμε τα εργαλεία σας, αυτοματοποιούμε επαναλαμβανόμενες εργασίες και χρησιμοποιούμε AI όπου προσφέρει πραγματικό πλεονέκτημα.", items: ["Αυτοματισμοί ροών και admin", "AI υποδοχή και website chat", "Follow-up πελατών και newsletters", "Δεδομένα, αναφορές και προβλέψεις"], result: "Το αποτέλεσμα → λιγότερες χειροκίνητες εργασίες", image: "/services/atmos-internal-wide.webp" },
        { kicker: "Όταν η σωστή λύση δεν υπάρχει", title: "Χτίστε κάτι αποκλειστικά δικό σας.", body: "Από CRM προσαρμοσμένο στην ομάδα σας μέχρι marketplace ή εσωτερική πλατφόρμα, μετατρέπουμε την ιδέα σε σαφές πλάνο και λειτουργικό προϊόν.", items: ["Custom CRM και εσωτερικά συστήματα", "Dashboards και ροές δεδομένων", "Marketplaces και SaaS προϊόντα", "Οτιδήποτε χρήσιμο μπορείτε να περιγράψετε"], result: "Το αποτέλεσμα → λογισμικό που ταιριάζει", image: "/services/atmos-custom-wide.webp" },
      ],
    },
    templates: {
      eyebrow: "Κατευθύνσεις έτοιμες για προσαρμογή",
      title: "Δείτε τη διαφορά πριν την εξηγήσουμε.",
      intro: "Επιλέξτε μια κατεύθυνση και κινηθείτε πάνω στην προεπισκόπηση. Η αξία δεν είναι το template — είναι το πόσο γρήγορα η σωστή εμπειρία γίνεται χειροπιαστή.",
      explore: "Εξερευνήστε την εμπειρία",
      items: {
        atelier: { name: "Atelier", type: "Fashion commerce", body: "Μια premium κατεύθυνση e-shop γύρω από την ανακάλυψη, την εμπιστοσύνη και την εύκολη αγορά.", image: "/templates/atelier.png", notes: ["Ιστορία brand", "Ανακάλυψη προϊόντων", "Καθαρή αγορά"] },
        padel: { name: "Padel City", type: "Εμπειρία κρατήσεων", body: "Μια κατεύθυνση όπου διαθεσιμότητα, πληρωμή και επαναλαμβανόμενες επισκέψεις γίνονται μία ξεκάθαρη διαδρομή.", image: "/templates/padel.png", notes: ["Live διαθεσιμότητα", "Γρήγορη κράτηση", "Διατήρηση πελατών"] },
      },
    },
    work: {
      eyebrow: "Επιλεγμένα έργα", title: "Πραγματική δουλειά. Ορατή με ένα πέρασμα.", intro: "Δύο επιχειρήσεις, δύο πολύ διαφορετικές ανάγκες και καμία έτοιμη απάντηση.", all: "Δείτε όλα τα έργα", open: "Άνοιγμα έργου",
      items: [
        { name: "GlobalTeamPlans", tag: "Ιστοσελίδα · SEO · Lead generation", year: "2026", image: "/portfolio/globalteamplans.png", href: "https://globalteamplans.com" },
        { name: "dataportfolio.co.uk", tag: "SaaS · Προϊόν · Πλατφόρμα", year: "2026", image: "/portfolio/dataportfolio.png", href: "https://dataportfolio.co.uk" },
      ],
    },
    delivery: {
      eyebrow: "Ένας διαφορετικός τρόπος παράδοσης",
      quote: "Προτιμάμε να αμφισβητήσουμε την ιδέα στην πρώτη συνάντηση, παρά να χρεώσουμε το πρόβλημα στην έκτη.",
      steps: [["01", "Διάγνωση", "Καταλαβαίνουμε τι πραγματικά χρειάζεται η επιχείρηση."], ["02", "Αμφισβήτηση", "Εξηγούμε τον κίνδυνο και δείχνουμε μια χρήσιμη εναλλακτική."], ["03", "Παράδοση", "Στρατηγική και μηχανική παραμένουν υπεύθυνες."], ["04", "Συνέχεια", "Προαιρετική επίβλεψη μετά την έναρξη."],],
    },
    journey: {
      eyebrow: "Δύο βάσεις. Μία DS2.", title: "Με βάση την Αθήνα και το Λονδίνο.", intro: "Μία ομάδα που δραστηριοποιείται και από τις δύο πόλεις, συνδυάζοντας τοπική κατανόηση με διεθνή οπτική.", athens: "Η βάση μας στην Αθήνα μάς κρατά κοντά στις ελληνικές επιχειρήσεις και στην πρακτική αξία που χρειάζονται.", london: "Η βάση μας στο Λονδίνο μάς συνδέει με μια αγορά που απαιτεί σαφήνεια, ταχύτητα και αποδείξεις.", cue: "Κυλήστε για να συνδέσετε τις δύο βάσεις",
    },
  },
} as const;

export default function HomeStory() {
  const { lang } = useLang();
  const c = copy[lang];
  const [goal, setGoal] = useState<GoalKey>("customers");
  const [capability, setCapability] = useState<string>(c.capability.words[0]);
  const [template, setTemplate] = useState<TemplateKey>("atelier");
  const journeyRef = useRef<HTMLElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const valueCardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCapability(c.capability.words[0]), [c.capability.words]);

  useEffect(() => {
    const section = journeyRef.current;
    if (!section) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const travel = Math.max(1, section.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));
      section.style.setProperty("--journey-progress", progress.toFixed(4));
      section.dataset.connected = progress > 0.62 ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const stack = valueCardsRef.current;
    if (!stack) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const cards = Array.from(stack.querySelectorAll<HTMLElement>(".value-card"));
      const staticLayout = window.innerWidth <= 900 || matchMedia("(prefers-reduced-motion: reduce)").matches;

      cards.forEach((card, index) => {
        const nextCard = cards[index + 1];
        if (staticLayout || !nextCard) {
          card.style.setProperty("--stack-scale", "1");
          card.style.setProperty("--stack-y", "0px");
          card.style.setProperty("--stack-brightness", "1");
          return;
        }

        const stickyTop = Number.parseFloat(getComputedStyle(card).top) || 88;
        const approach = Math.max(180, window.innerHeight * 0.42);
        const progress = Math.min(1, Math.max(0, (stickyTop + approach - nextCard.getBoundingClientRect().top) / approach));

        card.style.setProperty("--stack-scale", (1 - progress * 0.035).toFixed(4));
        card.style.setProperty("--stack-y", `${(-progress * 12).toFixed(2)}px`);
        card.style.setProperty("--stack-brightness", (1 - progress * 0.16).toFixed(4));
      });
    };
    const onViewportChange = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
    return () => {
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const moveTemplate = (event: PointerEvent<HTMLDivElement>) => {
    const el = templateRef.current;
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((event.clientX - rect.left) / rect.width - 0.5) * 10}px`);
    el.style.setProperty("--my", `${((event.clientY - rect.top) / rect.height - 0.5) * 10}px`);
  };

  const selectedTemplate = c.templates.items[template];

  return (
    <div className="ds2-story">
      <section className="goal-section" aria-labelledby="goal-prompt">
        <div className="goal-panel">
          <p id="goal-prompt">{c.goals.prompt}</p>
          <div className="goal-tabs" role="group" aria-label={c.goals.prompt}>
            {(Object.keys(c.goals.options) as GoalKey[]).map((key, index) => (
              <button key={key} type="button" className={goal === key ? "is-active" : ""} aria-pressed={goal === key} onClick={() => setGoal(key)}>
                <span aria-hidden="true">{["↗", "◷", "◇"][index]}</span>{c.goals.options[key]}
              </button>
            ))}
          </div>
          <div className="goal-answer" aria-live="polite">
            <div><small>{c.goals.label}</small><strong>{c.goals.answers[goal][0]}</strong></div>
            <p>{c.goals.answers[goal][1]}</p>
            <Link href="/assistant">{c.goals.cta} <span aria-hidden="true">↓</span></Link>
          </div>
        </div>
      </section>

      <section className="capability-field" aria-labelledby="capability-title">
        <header>
          <p className="story-eyebrow">// {c.capability.eyebrow}</p>
          <h2 id="capability-title">{c.capability.title}</h2>
          <p>{c.capability.intro}</p>
        </header>
        <div className="capability-stage">
          <div className="capability-rings" aria-hidden="true"><i /><i /><i /></div>
          <div className="capability-mark">
            <img src="/logos/ds2-white.png" alt="DS2" />
            <small>{c.capability.selected}</small>
            <strong aria-live="polite">{capability}</strong>
          </div>
          <div className="capability-words">
            {c.capability.words.map((word, index) => (
              <button key={word} type="button" className={capability === word ? "is-active" : ""} onPointerEnter={() => setCapability(word)} onFocus={() => setCapability(word)} onClick={() => setCapability(word)}>
                <span>{String(index + 1).padStart(2, "0")}</span>{word}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="value-stack" id="solutions" aria-labelledby="value-title">
        <header className="story-heading">
          <p className="story-eyebrow">// {c.services.eyebrow}</p>
          <h2 id="value-title">{c.services.title}</h2>
          <p>{c.services.intro}</p>
        </header>
        <div className="value-cards" ref={valueCardsRef}>
          {c.services.cards.map((card, index) => (
            <article
              className="value-card"
              key={card.title}
              style={{ "--card-top": `${88 + index * 18}px`, zIndex: index + 1 } as CSSProperties}
            >
              <div className="value-card__media"><img src={card.image} alt="" /></div>
              <div className="value-card__body">
                <span className="value-card__number">0{index + 1}</span>
                <p className="story-eyebrow">{card.kicker}</p>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
                <ul>{card.items.map((item) => <li key={item}>{item}</li>)}</ul>
                <strong>{card.result}</strong>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="template-lab" aria-labelledby="template-title">
        <header className="story-heading">
          <p className="story-eyebrow">// {c.templates.eyebrow}</p>
          <h2 id="template-title">{c.templates.title}</h2>
          <p>{c.templates.intro}</p>
        </header>
        <div className="template-switcher" role="tablist" aria-label={c.templates.eyebrow}>
          {(Object.keys(c.templates.items) as TemplateKey[]).map((key, index) => (
            <button key={key} type="button" role="tab" aria-selected={template === key} className={template === key ? "is-active" : ""} onClick={() => setTemplate(key)}>
              <span>0{index + 1}</span>{c.templates.items[key].name}<small>{c.templates.items[key].type}</small>
            </button>
          ))}
        </div>
        <div className="template-canvas" ref={templateRef} onPointerMove={moveTemplate} onPointerLeave={() => { templateRef.current?.style.setProperty("--mx", "0px"); templateRef.current?.style.setProperty("--my", "0px"); }}>
          <div className="template-browser">
            <div className="template-browser__bar"><i /><i /><i /><span>{selectedTemplate.type}</span></div>
            <img key={template} src={selectedTemplate.image} alt={`${selectedTemplate.name} ${selectedTemplate.type}`} />
          </div>
          <div className="template-caption">
            <span>{c.templates.explore}</span><h3>{selectedTemplate.name}</h3><p>{selectedTemplate.body}</p>
            <ul>{selectedTemplate.notes.map((note, index) => <li key={note}><span>0{index + 1}</span>{note}</li>)}</ul>
          </div>
        </div>
      </section>

      <section className="work-index" id="featured" aria-labelledby="work-title">
        <header className="story-heading">
          <p className="story-eyebrow">// {c.work.eyebrow}</p>
          <h2 id="work-title">{c.work.title}</h2>
          <p>{c.work.intro}</p>
        </header>
        <div className="work-index__list">
          {c.work.items.map((item, index) => (
            <a className="work-index__row" key={item.name} href={item.href} target="_blank" rel="noreferrer">
              <span className="work-index__number">0{index + 1}</span>
              <span className="work-index__name">{item.name}</span>
              <span className="work-index__meta">{item.tag}</span>
              <span className="work-index__year">{item.year}</span>
              <span className="work-index__arrow" aria-label={c.work.open}>↗</span>
              <span className="work-index__preview" aria-hidden="true"><img src={item.image} alt="" /></span>
            </a>
          ))}
        </div>
        <Link className="story-link" href="/portfolio">{c.work.all} <span>→</span></Link>
      </section>

      <section className="delivery-statement" aria-labelledby="delivery-title">
        <p className="story-eyebrow">// {c.delivery.eyebrow}</p>
        <blockquote id="delivery-title">“{c.delivery.quote}”</blockquote>
        <div className="delivery-steps">
          {c.delivery.steps.map(([number, title, body]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}
        </div>
      </section>

      <section className="city-journey" ref={journeyRef} aria-labelledby="journey-title">
        <div className="city-journey__sticky">
          <header>
            <p className="story-eyebrow">// {c.journey.eyebrow}</p>
            <h2 id="journey-title">{c.journey.title}</h2>
            <p>{c.journey.intro}</p>
          </header>
          <div className="city-route" aria-hidden="true">
            <svg viewBox="0 0 1200 520" preserveAspectRatio="none">
              <path className="city-route__ghost" d="M90 395 C300 460 390 145 615 270 S900 385 1110 130" pathLength="1" />
              <path className="city-route__live" d="M90 395 C300 460 390 145 615 270 S900 385 1110 130" pathLength="1" />
            </svg>
            <div className="city city--athens"><span>37.9838° N</span><strong>Athens</strong><p>{c.journey.athens}</p></div>
            <div className="city city--london"><span>51.5072° N</span><strong>London</strong><p>{c.journey.london}</p></div>
          </div>
          <div className="city-journey__cue">{c.journey.cue}<span>↓</span></div>
        </div>
      </section>
    </div>
  );
}
