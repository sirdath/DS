export type AssistantLang = "en" | "el";
export type GoalKey = "customers" | "time" | "product" | "clarity";
export type AssistantOption = { value: string; label: string; note: string };
export type AssistantField = {
  id: string;
  label: string;
  type: "text" | "url" | "email" | "tel" | "select";
  required?: boolean;
  options?: readonly string[];
};
export type AssistantSlider = {
  min: number;
  max: number;
  defaultValue: number;
  values: readonly string[];
  labels: readonly string[];
  scene: "team" | "timing" | "budget";
};
export type AssistantStep = {
  id: string;
  eyebrow: string;
  title: string;
  help: string;
  summaryLabel: string;
  type: "single" | "multi" | "limit" | "fields" | "textarea" | "slider";
  limit?: number;
  options?: readonly AssistantOption[];
  fields?: readonly AssistantField[];
  slider?: AssistantSlider;
  autoAdvance?: boolean;
  optional?: boolean;
  context?: string;
  placeholder?: string;
};

type Branch = {
  label: string;
  services: AssistantStep;
  diagnosis: AssistantStep;
  outcomes: AssistantStep;
  detailsTitle: string;
  detailsHelp: string;
  detailsPlaceholder: string;
};

export const assistantCopy = {
  en: {
    goal: {
      id: "goal", eyebrow: "01 · Start here", title: "How can we help you?", help: "Choose the result that would make the biggest difference right now.", summaryLabel: "Primary goal", type: "single", autoAdvance: true,
      options: [
        { value: "customers", label: "Win more customers / clients", note: "Trust, visibility, sales and bookings" },
        { value: "time", label: "Give my team time back", note: "Automation, AI and fewer repetitive tasks" },
        { value: "product", label: "Build a new idea", note: "A product, platform or custom system" },
        { value: "clarity", label: "See the business clearly", note: "Data, reporting, forecasts and decisions" },
      ],
    } satisfies AssistantStep,
    branches: {
      customers: {
        label: "Win more customers",
        services: { id: "services", eyebrow: "02 · The opportunity", title: "Where should the customer experience improve?", help: "Choose up to three. We will use this to shape the next question.", summaryLabel: "Customer-facing opportunities", type: "limit", limit: 3, context: "Because you chose customer growth", options: [
          { value: "website", label: "Website or brand upgrade", note: "A credible public face that converts" },
          { value: "shop", label: "Online shop", note: "Products, checkout and payments" },
          { value: "booking", label: "Booking system", note: "Availability, appointments and payment" },
          { value: "platform", label: "Customer web platform", note: "A logged-in service or useful experience" },
          { value: "mobile", label: "Mobile app", note: "A direct place for customers to return" },
          { value: "unsure", label: "Help me choose", note: "I know the result, not the solution" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · What is happening now", title: "What is getting in the way of growth?", help: "Choose the closest answer. It does not need to be perfect.", summaryLabel: "Current growth problem", type: "single", autoAdvance: true, options: [
          { value: "trust", label: "We do not look as good as we are", note: "The first impression undersells the business" },
          { value: "conversion", label: "People visit but do not act", note: "Enquiries, purchases or bookings are too low" },
          { value: "friction", label: "Buying or booking is difficult", note: "Too many calls, steps or abandoned journeys" },
          { value: "outdated", label: "The current site holds us back", note: "Slow, hard to update or no longer accurate" },
          { value: "missing", label: "We are starting from zero", note: "There is no useful digital experience yet" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · A good result", title: "What should the new experience achieve first?", help: "Pick the two outcomes that matter most.", summaryLabel: "Growth outcomes", type: "limit", limit: 2, options: [
          { value: "leads", label: "More qualified enquiries", note: "Better-fit customers getting in touch" },
          { value: "sales", label: "More online sales", note: "A clearer path from product to payment" },
          { value: "bookings", label: "More direct bookings", note: "Less friction and fewer phone calls" },
          { value: "trust", label: "A more premium impression", note: "Make the value obvious immediately" },
          { value: "launch", label: "Launch quickly", note: "Get a strong first version live soon" },
        ] },
        detailsTitle: "What should customers understand, feel or do?",
        detailsHelp: "A short real-world example is more useful than a technical specification.",
        detailsPlaceholder: "For example: customers call because they cannot see availability, our current site makes us look smaller than we are, and we want more direct bookings…",
      },
      time: {
        label: "Give my team time back",
        services: { id: "services", eyebrow: "02 · The opportunity", title: "Where is the repeated work happening?", help: "Choose up to three. The next question will focus on your workflow.", summaryLabel: "Operational opportunities", type: "limit", limit: 3, context: "Because you chose time and automation", options: [
          { value: "automation", label: "Workflow automation", note: "Connect tools and remove repeated admin" },
          { value: "receptionist", label: "AI receptionist", note: "Answer enquiries and book 24/7" },
          { value: "chatbot", label: "Website chatbot", note: "Useful answers from your real business information" },
          { value: "agents", label: "AI agents by the hour", note: "Research, entry, follow-ups and routine tasks" },
          { value: "loyalty", label: "Loyalty and in-store tools", note: "Wallet cards, reviews and digital menus" },
          { value: "unsure", label: "Help me find the opportunity", note: "I know time is being wasted somewhere" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · What is happening now", title: "Which sentence sounds most familiar?", help: "Choose the one you would be happiest to never deal with again.", summaryLabel: "Current operational problem", type: "single", autoAdvance: true, options: [
          { value: "repetition", label: "We repeat the same admin every day", note: "Copying, updating, chasing and re-entering" },
          { value: "enquiries", label: "Customer enquiries get missed", note: "The team cannot answer instantly or after hours" },
          { value: "disconnected", label: "Our tools do not talk to each other", note: "Information lives in too many places" },
          { value: "reporting", label: "Reports take too long to prepare", note: "Useful answers depend on manual spreadsheets" },
          { value: "scale", label: "Growth is creating operational pressure", note: "More work currently means more people and errors" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · A good result", title: "What should the system give back?", help: "Pick the two outcomes with the greatest business value.", summaryLabel: "Operational outcomes", type: "limit", limit: 2, options: [
          { value: "hours", label: "Hours every week", note: "Less repetitive work for the team" },
          { value: "accuracy", label: "Fewer mistakes", note: "Reliable processes and consistent information" },
          { value: "speed", label: "Faster customer service", note: "Quicker answers and follow-ups" },
          { value: "always-on", label: "24/7 response", note: "Capture enquiries outside working hours" },
          { value: "control", label: "More visibility and control", note: "Know what is happening without chasing" },
        ] },
        detailsTitle: "Walk us through the task you wish handled itself.",
        detailsHelp: "Tell us what triggers it, who touches it and where it tends to slow down.",
        detailsPlaceholder: "For example: every booking arrives by email, someone copies it into a calendar, replies manually and prepares a weekly report…",
      },
      product: {
        label: "Build a new idea",
        services: { id: "services", eyebrow: "02 · The opportunity", title: "What kind of thing are you imagining?", help: "Choose up to three. Custom is a perfectly useful answer.", summaryLabel: "Product direction", type: "limit", limit: 3, context: "Because you chose a new product or idea", options: [
          { value: "crm", label: "Custom CRM", note: "A sales and client hub shaped around your team" },
          { value: "marketplace", label: "Marketplace", note: "Connect two sides of a market" },
          { value: "internal", label: "Internal tool or dashboard", note: "The admin system your team wishes it had" },
          { value: "saas", label: "SaaS or web platform", note: "A logged-in subscription product" },
          { value: "mobile", label: "Mobile app", note: "A focused iOS and Android experience" },
          { value: "custom", label: "Completely custom", note: "It does not fit an existing category" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · Where the idea stands", title: "How tangible is it today?", help: "This tells us whether the first job is strategy, design or building.", summaryLabel: "Current product stage", type: "single", autoAdvance: true, options: [
          { value: "idea", label: "It is an idea in my head", note: "The opportunity is clearer than the product" },
          { value: "rough", label: "We have rough features or sketches", note: "The shape exists but needs challenging" },
          { value: "prototype", label: "There is a prototype", note: "We need to test, improve or productionise it" },
          { value: "replace", label: "Something existing must be replaced", note: "The current tool no longer fits" },
          { value: "ready", label: "We have a clear specification", note: "We are close to being ready to build" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · A good result", title: "What matters most for the first version?", help: "Pick two. Good products are shaped by deliberate trade-offs.", summaryLabel: "Product priorities", type: "limit", limit: 2, options: [
          { value: "validate", label: "Prove the idea", note: "Learn whether customers really want it" },
          { value: "speed", label: "Reach the market quickly", note: "A focused useful version first" },
          { value: "experience", label: "Exceptional ease of use", note: "Make a complex job feel simple" },
          { value: "scale", label: "Strong foundations", note: "Room to grow users, data and features" },
          { value: "ownership", label: "Full ownership and control", note: "Software fitted to the business" },
        ] },
        detailsTitle: "Describe the idea as if you were telling a customer.",
        detailsHelp: "Who is it for, what can they do with it, and why would they care?",
        detailsPlaceholder: "For example: a marketplace where local sports clubs publish empty court slots and players can book and pay in one place…",
      },
      clarity: {
        label: "See the business clearly",
        services: { id: "services", eyebrow: "02 · The opportunity", title: "Which answers are hardest to get today?", help: "Choose up to three. We will narrow the information problem next.", summaryLabel: "Data opportunities", type: "limit", limit: 3, context: "Because you chose clearer data and decisions", options: [
          { value: "dashboard", label: "Business dashboard", note: "One useful view of performance" },
          { value: "forecast", label: "Forecasting", note: "A clearer view of what comes next" },
          { value: "marketing", label: "Marketing dashboard", note: "Campaigns, leads and commercial results" },
          { value: "competitors", label: "Competitor intelligence", note: "See how the market is moving" },
          { value: "pipeline", label: "Data pipeline", note: "Move, clean and connect scattered information" },
          { value: "unsure", label: "Help me diagnose it", note: "The numbers exist but are not useful yet" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · What is happening now", title: "Where does clarity break down?", help: "Choose the closest description of the current reality.", summaryLabel: "Current information problem", type: "single", autoAdvance: true, options: [
          { value: "scattered", label: "The data is scattered", note: "Different tools hold different versions of the truth" },
          { value: "slow", label: "Reporting is always late", note: "Answers arrive after the moment to act" },
          { value: "gut", label: "Decisions rely on instinct", note: "We cannot see the evidence quickly enough" },
          { value: "future", label: "We cannot see what is coming", note: "Demand, cash or workload is hard to anticipate" },
          { value: "market", label: "We do not see the market clearly", note: "Competitors and opportunities are hard to track" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · A good result", title: "What should be obvious at a glance?", help: "Pick the two answers you would check most often.", summaryLabel: "Decision outcomes", type: "limit", limit: 2, options: [
          { value: "performance", label: "How the business is performing", note: "The few numbers that actually matter" },
          { value: "next", label: "What is likely to happen next", note: "Forecast demand, revenue or workload" },
          { value: "attention", label: "What needs attention now", note: "Exceptions, risks and opportunities" },
          { value: "marketing", label: "What marketing is producing", note: "Connect activity to leads and sales" },
          { value: "market", label: "How we compare to the market", note: "Competitors, pricing and movement" },
        ] },
        detailsTitle: "What decision do you wish the numbers made easier?",
        detailsHelp: "Describe the question you ask repeatedly but cannot answer quickly.",
        detailsPlaceholder: "For example: every Friday we combine three spreadsheets to understand next month’s bookings, but the answer is already out of date…",
      },
    } satisfies Record<GoalKey, Branch>,
    common: {
      business: { id: "business", eyebrow: "05 · Your business", title: "A little context changes the recommendation.", help: "Just the business name and industry are required.", summaryLabel: "Business context", type: "fields", fields: [
        { id: "company", label: "Business or project name", type: "text", required: true },
        { id: "industry", label: "Industry", type: "text", required: true },
        { id: "website", label: "Current website", type: "url" },
      ] },
      team: { id: "team", eyebrow: "06 · The people", title: "How many people will this need to work for?", help: "Move the slider. This helps us judge complexity, access and handover.", summaryLabel: "Team size", type: "slider", slider: { min: 0, max: 4, defaultValue: 1, values: ["Just me", "2–5 people", "6–15 people", "16–50 people", "More than 50"], labels: ["Solo", "Small team", "Growing team", "Established team", "Large organisation"], scene: "team" } },
      timing: { id: "timing", eyebrow: "07 · The pace", title: "When would it feel useful to have this live?", help: "There is no wrong speed. Move the marker to what feels realistic.", summaryLabel: "Ideal timing", type: "slider", slider: { min: 0, max: 4, defaultValue: 1, values: ["Exploring — no deadline", "Within 3–6 months", "Within 1–3 months", "Within one month", "As soon as responsibly possible"], labels: ["Exploring", "This half-year", "This quarter", "This month", "Ready now"], scene: "timing" } },
      budget: { id: "budget", eyebrow: "08 · The investment", title: "What investment range feels comfortable?", help: "This shapes the first useful scope. It is guidance, not a quote or commitment.", summaryLabel: "Investment range", type: "slider", slider: { min: 0, max: 5, defaultValue: 0, values: ["Not sure yet", "Under €5,000", "€5,000–€15,000", "€15,000–€30,000", "€30,000–€60,000", "€60,000+"], labels: ["Let’s scope it", "Focused start", "Solid build", "Ambitious build", "Major system", "Strategic platform"], scene: "budget" } },
      contact: { id: "contact", eyebrow: "10 · The next step", title: "Where should we continue the conversation?", help: "We will use these details only to reply to this brief.", summaryLabel: "Contact", type: "fields", fields: [
        { id: "name", label: "Your name", type: "text", required: true },
        { id: "email", label: "Email", type: "email", required: true },
      ] },
    },
    ui: { progress: "Your DS2 brief", step: "Step", complete: "complete", remaining: "remaining", back: "Back", next: "Continue", review: "Review brief", send: "Send", reset: "Start again", close: "Back to DS2", selected: "selected", required: "Required", optional: "Optional", choose: "Choose one", reviewEyebrow: "Your DS2 brief", reviewTitle: "Here is the shape of the opportunity.", reviewHelp: "Review what we understood before sending your brief.", error: "Choose an answer before continuing.", sliderHint: "Drag or use the arrow keys" },
  },
  el: {
    goal: {
      id: "goal", eyebrow: "01 · Ξεκινάμε", title: "Πώς μπορούμε να σας βοηθήσουμε;", help: "Επιλέξτε το αποτέλεσμα που θα έκανε τη μεγαλύτερη διαφορά τώρα.", summaryLabel: "Βασικός στόχος", type: "single", autoAdvance: true,
      options: [
        { value: "customers", label: "Περισσότεροι πελάτες", note: "Εμπιστοσύνη, προβολή, πωλήσεις και κρατήσεις" },
        { value: "time", label: "Περισσότερος χρόνος στην ομάδα", note: "Αυτοματισμοί, AI και λιγότερη επανάληψη" },
        { value: "product", label: "Μια νέα ιδέα", note: "Προϊόν, πλατφόρμα ή custom σύστημα" },
        { value: "clarity", label: "Καθαρότερη εικόνα της επιχείρησης", note: "Δεδομένα, αναφορές, προβλέψεις και αποφάσεις" },
      ],
    } satisfies AssistantStep,
    branches: {
      customers: {
        label: "Περισσότεροι πελάτες",
        services: { id: "services", eyebrow: "02 · Η ευκαιρία", title: "Πού πρέπει να βελτιωθεί η εμπειρία του πελάτη;", help: "Επιλέξτε έως τρία.", summaryLabel: "Ευκαιρίες εμπειρίας πελάτη", type: "limit", limit: 3, context: "Επειδή επιλέξατε ανάπτυξη πελατών", options: [
          { value: "website", label: "Ιστοσελίδα ή brand upgrade", note: "Αξιόπιστη δημόσια εικόνα που μετατρέπει" }, { value: "shop", label: "E-shop", note: "Προϊόντα, checkout και πληρωμές" }, { value: "booking", label: "Σύστημα κρατήσεων", note: "Διαθεσιμότητα, ραντεβού και πληρωμή" }, { value: "platform", label: "Πλατφόρμα πελατών", note: "Χρήσιμη logged-in εμπειρία" }, { value: "mobile", label: "Mobile app", note: "Ένας άμεσος χώρος επιστροφής πελατών" }, { value: "unsure", label: "Βοηθήστε με να επιλέξω", note: "Γνωρίζω το αποτέλεσμα, όχι τη λύση" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · Τι συμβαίνει τώρα", title: "Τι εμποδίζει την ανάπτυξη;", help: "Επιλέξτε την πιο κοντινή απάντηση.", summaryLabel: "Τρέχον πρόβλημα ανάπτυξης", type: "single", autoAdvance: true, options: [
          { value: "trust", label: "Δεν φαινόμαστε τόσο καλοί όσο είμαστε", note: "Η πρώτη εντύπωση μας υποτιμά" }, { value: "conversion", label: "Οι επισκέπτες δεν προχωρούν", note: "Λίγα αιτήματα, αγορές ή κρατήσεις" }, { value: "friction", label: "Η αγορά ή κράτηση είναι δύσκολη", note: "Πολλά βήματα και τηλεφωνήματα" }, { value: "outdated", label: "Η τρέχουσα ιστοσελίδα μας κρατά πίσω", note: "Αργή, δύσκολη ή ανακριβής" }, { value: "missing", label: "Ξεκινάμε από το μηδέν", note: "Δεν υπάρχει ακόμη χρήσιμη ψηφιακή εμπειρία" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · Ένα καλό αποτέλεσμα", title: "Τι πρέπει να πετύχει πρώτα;", help: "Επιλέξτε δύο αποτελέσματα.", summaryLabel: "Αποτελέσματα ανάπτυξης", type: "limit", limit: 2, options: [
          { value: "leads", label: "Περισσότερα σωστά αιτήματα", note: "Καλύτεροι πελάτες επικοινωνούν" }, { value: "sales", label: "Περισσότερες online πωλήσεις", note: "Καθαρή πορεία προς την πληρωμή" }, { value: "bookings", label: "Περισσότερες άμεσες κρατήσεις", note: "Λιγότερη τριβή και τηλεφωνήματα" }, { value: "trust", label: "Πιο premium εντύπωση", note: "Η αξία γίνεται αμέσως ξεκάθαρη" }, { value: "launch", label: "Γρήγορο launch", note: "Μια ισχυρή πρώτη έκδοση σύντομα" },
        ] },
        detailsTitle: "Τι πρέπει να καταλάβουν, να νιώσουν ή να κάνουν οι πελάτες;", detailsHelp: "Ένα πραγματικό παράδειγμα είναι πιο χρήσιμο από τεχνικές προδιαγραφές.", detailsPlaceholder: "Για παράδειγμα: οι πελάτες τηλεφωνούν επειδή δεν βλέπουν διαθεσιμότητα και θέλουμε περισσότερες άμεσες κρατήσεις…",
      },
      time: {
        label: "Περισσότερος χρόνος στην ομάδα",
        services: { id: "services", eyebrow: "02 · Η ευκαιρία", title: "Πού επαναλαμβάνεται η δουλειά;", help: "Επιλέξτε έως τρία.", summaryLabel: "Λειτουργικές ευκαιρίες", type: "limit", limit: 3, context: "Επειδή επιλέξατε χρόνο και αυτοματισμό", options: [
          { value: "automation", label: "Αυτοματισμός ροών", note: "Σύνδεση εργαλείων και λιγότερο admin" }, { value: "receptionist", label: "AI receptionist", note: "Απαντήσεις και κρατήσεις 24/7" }, { value: "chatbot", label: "Website chatbot", note: "Απαντήσεις από τα πραγματικά στοιχεία σας" }, { value: "agents", label: "AI agents με την ώρα", note: "Έρευνα, καταχώρηση και follow-ups" }, { value: "loyalty", label: "Loyalty και in-store εργαλεία", note: "Wallet cards, reviews και digital menus" }, { value: "unsure", label: "Βοηθήστε με να βρω την ευκαιρία", note: "Ξέρω ότι κάπου χάνεται χρόνος" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · Τι συμβαίνει τώρα", title: "Ποια πρόταση σας θυμίζει περισσότερο την καθημερινότητα;", help: "Επιλέξτε αυτό που θα θέλατε να μην ξανακάνετε.", summaryLabel: "Τρέχον λειτουργικό πρόβλημα", type: "single", autoAdvance: true, options: [
          { value: "repetition", label: "Επαναλαμβάνουμε το ίδιο admin καθημερινά", note: "Αντιγραφή, ενημέρωση και καταχώρηση" }, { value: "enquiries", label: "Χάνονται αιτήματα πελατών", note: "Δεν απαντάμε άμεσα ή εκτός ωραρίου" }, { value: "disconnected", label: "Τα εργαλεία μας δεν επικοινωνούν", note: "Οι πληροφορίες είναι παντού" }, { value: "reporting", label: "Οι αναφορές αργούν πολύ", note: "Οι απαντήσεις εξαρτώνται από spreadsheets" }, { value: "scale", label: "Η ανάπτυξη δημιουργεί πίεση", note: "Περισσότερη δουλειά σημαίνει περισσότερα λάθη" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · Ένα καλό αποτέλεσμα", title: "Τι πρέπει να επιστρέψει το σύστημα;", help: "Επιλέξτε δύο αποτελέσματα.", summaryLabel: "Λειτουργικά αποτελέσματα", type: "limit", limit: 2, options: [
          { value: "hours", label: "Ώρες κάθε εβδομάδα", note: "Λιγότερη επαναληπτική εργασία" }, { value: "accuracy", label: "Λιγότερα λάθη", note: "Αξιόπιστες διαδικασίες" }, { value: "speed", label: "Ταχύτερη εξυπηρέτηση", note: "Γρήγορες απαντήσεις και follow-ups" }, { value: "always-on", label: "Απόκριση 24/7", note: "Κανένα αίτημα εκτός ωραρίου δεν χάνεται" }, { value: "control", label: "Περισσότερος έλεγχος", note: "Ξέρετε τι συμβαίνει χωρίς κυνηγητό" },
        ] },
        detailsTitle: "Περιγράψτε τη δουλειά που θα θέλατε να γίνεται μόνη της.", detailsHelp: "Τι την ξεκινά, ποιος εμπλέκεται και πού καθυστερεί;", detailsPlaceholder: "Για παράδειγμα: κάθε κράτηση έρχεται με email, κάποιος την περνά σε ημερολόγιο και απαντά χειροκίνητα…",
      },
      product: {
        label: "Μια νέα ιδέα",
        services: { id: "services", eyebrow: "02 · Η ευκαιρία", title: "Τι είδους πράγμα φαντάζεστε;", help: "Επιλέξτε έως τρία.", summaryLabel: "Κατεύθυνση προϊόντος", type: "limit", limit: 3, context: "Επειδή επιλέξατε νέο προϊόν ή ιδέα", options: [
          { value: "crm", label: "Custom CRM", note: "Sales και client hub στα μέτρα σας" }, { value: "marketplace", label: "Marketplace", note: "Σύνδεση δύο πλευρών μιας αγοράς" }, { value: "internal", label: "Internal εργαλείο ή dashboard", note: "Το admin σύστημα που χρειάζεται η ομάδα" }, { value: "saas", label: "SaaS ή web πλατφόρμα", note: "Logged-in συνδρομητικό προϊόν" }, { value: "mobile", label: "Mobile app", note: "Εστιασμένη iOS και Android εμπειρία" }, { value: "custom", label: "Εντελώς custom", note: "Δεν ταιριάζει σε υπάρχουσα κατηγορία" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · Πού βρίσκεται η ιδέα", title: "Πόσο χειροπιαστή είναι σήμερα;", help: "Έτσι καταλαβαίνουμε αν ξεκινάμε από στρατηγική, design ή build.", summaryLabel: "Τρέχον στάδιο προϊόντος", type: "single", autoAdvance: true, options: [
          { value: "idea", label: "Είναι μια ιδέα στο μυαλό μου", note: "Η ευκαιρία είναι πιο καθαρή από το προϊόν" }, { value: "rough", label: "Έχουμε πρόχειρα features ή sketches", note: "Υπάρχει μια μορφή που θέλει challenge" }, { value: "prototype", label: "Υπάρχει prototype", note: "Χρειάζεται test, βελτίωση ή production" }, { value: "replace", label: "Πρέπει να αντικατασταθεί κάτι", note: "Το υπάρχον εργαλείο δεν ταιριάζει πλέον" }, { value: "ready", label: "Έχουμε σαφές specification", note: "Είμαστε σχεδόν έτοιμοι για build" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · Ένα καλό αποτέλεσμα", title: "Τι έχει μεγαλύτερη σημασία για την πρώτη έκδοση;", help: "Επιλέξτε δύο.", summaryLabel: "Προτεραιότητες προϊόντος", type: "limit", limit: 2, options: [
          { value: "validate", label: "Να αποδείξουμε την ιδέα", note: "Να δούμε αν τη θέλουν οι πελάτες" }, { value: "speed", label: "Γρήγορα στην αγορά", note: "Μια εστιασμένη χρήσιμη έκδοση" }, { value: "experience", label: "Εξαιρετική ευκολία χρήσης", note: "Το σύνθετο να μοιάζει απλό" }, { value: "scale", label: "Ισχυρές βάσεις", note: "Χώρος για χρήστες, data και features" }, { value: "ownership", label: "Πλήρης ιδιοκτησία και έλεγχος", note: "Λογισμικό στα μέτρα της επιχείρησης" },
        ] },
        detailsTitle: "Περιγράψτε την ιδέα σαν να τη λέγατε σε έναν πελάτη.", detailsHelp: "Για ποιον είναι, τι κάνει και γιατί έχει αξία;", detailsPlaceholder: "Για παράδειγμα: ένα marketplace όπου αθλητικοί σύλλογοι δημοσιεύουν κενές ώρες και οι παίκτες κάνουν κράτηση και πληρωμή…",
      },
      clarity: {
        label: "Καθαρότερη εικόνα της επιχείρησης",
        services: { id: "services", eyebrow: "02 · Η ευκαιρία", title: "Ποιες απαντήσεις είναι δύσκολο να βρείτε σήμερα;", help: "Επιλέξτε έως τρία.", summaryLabel: "Ευκαιρίες δεδομένων", type: "limit", limit: 3, context: "Επειδή επιλέξατε καθαρότερα δεδομένα", options: [
          { value: "dashboard", label: "Business dashboard", note: "Μία χρήσιμη εικόνα της απόδοσης" }, { value: "forecast", label: "Προβλέψεις", note: "Καθαρότερη εικόνα για το επόμενο βήμα" }, { value: "marketing", label: "Marketing dashboard", note: "Καμπάνιες, leads και αποτελέσματα" }, { value: "competitors", label: "Competitor intelligence", note: "Πώς κινείται η αγορά" }, { value: "pipeline", label: "Data pipeline", note: "Σύνδεση και καθαρισμός πληροφοριών" }, { value: "unsure", label: "Βοηθήστε με να το διαγνώσω", note: "Οι αριθμοί υπάρχουν αλλά δεν είναι χρήσιμοι" },
        ] },
        diagnosis: { id: "diagnosis", eyebrow: "03 · Τι συμβαίνει τώρα", title: "Πού χάνεται η καθαρή εικόνα;", help: "Επιλέξτε την πιο κοντινή περιγραφή.", summaryLabel: "Τρέχον πρόβλημα πληροφορίας", type: "single", autoAdvance: true, options: [
          { value: "scattered", label: "Τα δεδομένα είναι διάσπαρτα", note: "Κάθε εργαλείο έχει άλλη αλήθεια" }, { value: "slow", label: "Οι αναφορές αργούν", note: "Οι απαντήσεις έρχονται αφού περάσει η στιγμή" }, { value: "gut", label: "Οι αποφάσεις βασίζονται στο ένστικτο", note: "Δεν βλέπουμε γρήγορα τις αποδείξεις" }, { value: "future", label: "Δεν βλέπουμε τι έρχεται", note: "Ζήτηση, έσοδα ή workload είναι αβέβαια" }, { value: "market", label: "Δεν βλέπουμε καθαρά την αγορά", note: "Δύσκολο tracking ανταγωνιστών και ευκαιριών" },
        ] },
        outcomes: { id: "outcomes", eyebrow: "04 · Ένα καλό αποτέλεσμα", title: "Τι πρέπει να είναι προφανές με μία ματιά;", help: "Επιλέξτε δύο.", summaryLabel: "Αποτελέσματα αποφάσεων", type: "limit", limit: 2, options: [
          { value: "performance", label: "Πώς αποδίδει η επιχείρηση", note: "Οι λίγοι αριθμοί που έχουν σημασία" }, { value: "next", label: "Τι πιθανότατα ακολουθεί", note: "Πρόβλεψη ζήτησης, εσόδων ή workload" }, { value: "attention", label: "Τι χρειάζεται προσοχή τώρα", note: "Κίνδυνοι και ευκαιρίες" }, { value: "marketing", label: "Τι παράγει το marketing", note: "Σύνδεση activity με leads και πωλήσεις" }, { value: "market", label: "Πώς συγκρινόμαστε με την αγορά", note: "Ανταγωνιστές, τιμές και κίνηση" },
        ] },
        detailsTitle: "Ποια απόφαση θα θέλατε να κάνουν οι αριθμοί ευκολότερη;", detailsHelp: "Περιγράψτε την ερώτηση που επαναλαμβάνεται αλλά δεν απαντιέται γρήγορα.", detailsPlaceholder: "Για παράδειγμα: κάθε Παρασκευή ενώνουμε τρία spreadsheets για να δούμε τις κρατήσεις του επόμενου μήνα…",
      },
    } satisfies Record<GoalKey, Branch>,
    common: {
      business: { id: "business", eyebrow: "05 · Η επιχείρηση", title: "Λίγο context αλλάζει την πρόταση.", help: "Μόνο το όνομα και ο κλάδος είναι υποχρεωτικά.", summaryLabel: "Στοιχεία επιχείρησης", type: "fields", fields: [
        { id: "company", label: "Επιχείρηση ή project", type: "text", required: true }, { id: "industry", label: "Κλάδος", type: "text", required: true }, { id: "website", label: "Τρέχουσα ιστοσελίδα", type: "url" },
      ] },
      team: { id: "team", eyebrow: "06 · Οι άνθρωποι", title: "Για πόσα άτομα πρέπει να λειτουργεί;", help: "Μετακινήστε το slider. Μας βοηθά να κρίνουμε πολυπλοκότητα και handover.", summaryLabel: "Μέγεθος ομάδας", type: "slider", slider: { min: 0, max: 4, defaultValue: 1, values: ["Μόνο εγώ", "2–5 άτομα", "6–15 άτομα", "16–50 άτομα", "Πάνω από 50"], labels: ["Solo", "Μικρή ομάδα", "Αναπτυσσόμενη ομάδα", "Εδραιωμένη ομάδα", "Μεγάλος οργανισμός"], scene: "team" } },
      timing: { id: "timing", eyebrow: "07 · Ο ρυθμός", title: "Πότε θα ήταν χρήσιμο να είναι live;", help: "Δεν υπάρχει λάθος ταχύτητα. Επιλέξτε το ρεαλιστικό.", summaryLabel: "Ιδανικό timing", type: "slider", slider: { min: 0, max: 4, defaultValue: 1, values: ["Διερεύνηση — χωρίς deadline", "Μέσα σε 3–6 μήνες", "Μέσα σε 1–3 μήνες", "Μέσα σε έναν μήνα", "Όσο πιο σύντομα γίνεται υπεύθυνα"], labels: ["Διερεύνηση", "Αυτό το εξάμηνο", "Αυτό το τρίμηνο", "Αυτόν τον μήνα", "Έτοιμοι τώρα"], scene: "timing" } },
      budget: { id: "budget", eyebrow: "08 · Η επένδυση", title: "Ποιο εύρος επένδυσης νιώθετε άνετο;", help: "Καθορίζει το πρώτο χρήσιμο scope. Δεν είναι προσφορά ή δέσμευση.", summaryLabel: "Εύρος επένδυσης", type: "slider", slider: { min: 0, max: 5, defaultValue: 0, values: ["Δεν είμαι σίγουρος/η", "Κάτω από €5.000", "€5.000–€15.000", "€15.000–€30.000", "€30.000–€60.000", "€60.000+"], labels: ["Ας το ορίσουμε", "Εστιασμένη αρχή", "Πλήρες build", "Φιλόδοξο build", "Μεγάλο σύστημα", "Στρατηγική πλατφόρμα"], scene: "budget" } },
      contact: { id: "contact", eyebrow: "10 · Το επόμενο βήμα", title: "Πού να συνεχίσουμε τη συζήτηση;", help: "Θα χρησιμοποιήσουμε τα στοιχεία μόνο για να απαντήσουμε σε αυτό το brief.", summaryLabel: "Επικοινωνία", type: "fields", fields: [
        { id: "name", label: "Το όνομά σας", type: "text", required: true }, { id: "email", label: "Email", type: "email", required: true },
      ] },
    },
    ui: { progress: "Το DS2 brief σας", step: "Βήμα", complete: "ολοκληρώθηκε", remaining: "απομένει", back: "Πίσω", next: "Συνέχεια", review: "Έλεγχος brief", send: "Αποστολή", reset: "Από την αρχή", close: "Πίσω στη DS2", selected: "επιλεγμένα", required: "Υποχρεωτικό", optional: "Προαιρετικό", choose: "Επιλέξτε", reviewEyebrow: "Το DS2 brief σας", reviewTitle: "Αυτή είναι η μορφή της ευκαιρίας.", reviewHelp: "Ελέγξτε τι καταλάβαμε πριν στείλετε το brief.", error: "Επιλέξτε μια απάντηση για να συνεχίσετε.", sliderHint: "Σύρετε ή χρησιμοποιήστε τα βελάκια" },
  },
} as const;
