export type AssistantLang = "en" | "el";
export type AssistantOption = { label: string; note: string };
export type AssistantField = { id: string; label: string; type: "text" | "url" | "email" | "tel" | "select"; required?: boolean; options?: string[] };
export type AssistantStep = {
  id: string;
  eyebrow: string;
  title: string;
  help: string;
  type: "multi" | "single" | "limit" | "fields" | "textarea";
  limit?: number;
  options?: AssistantOption[];
  fields?: AssistantField[];
};

export const assistantCopy = {
  en: {
    intro: { eyebrow: "A useful first step", title: "How can we help you?", body: "Start with the business result, not the technology. In about four minutes, your answers become a clear project brief you can review before anything is sent.", cta: "Start with what you need" },
    steps: [
      { id: "goal", eyebrow: "01 · The change", title: "What would you most like to improve?", help: "Choose everything that matters.", type: "multi", options: [
        { label: "Bring in more customers", note: "Trust, visibility and conversion" }, { label: "Save my team time", note: "Repetition, admin and delays" }, { label: "See the business clearly", note: "Data, reporting and decisions" }, { label: "Launch a new idea", note: "A product, service or opportunity" }, { label: "Improve an existing system", note: "Something works, but not well enough" }, { label: "Something else", note: "Tell us in your own words" },
      ] },
      { id: "solution", eyebrow: "02 · What we might build", title: "Which options feel relevant?", help: "Choose more than one, or ask us to help decide.", type: "multi", options: [
        { label: "Website or redesign", note: "A clearer, more credible public face" }, { label: "Online shop", note: "Products, checkout and payments" }, { label: "Booking system", note: "Availability, appointments and payment" }, { label: "Automation", note: "Connect tools and remove manual work" }, { label: "AI receptionist or chatbot", note: "Reply, qualify and book 24/7" }, { label: "Data dashboard or forecasting", note: "One useful view of the numbers" }, { label: "Custom app or platform", note: "Web app, mobile app, SaaS or marketplace" }, { label: "CRM or internal tool", note: "Software shaped around your team" }, { label: "Not sure yet", note: "Help me choose the right approach" }, { label: "Other / completely custom", note: "Something not listed here" },
      ] },
      { id: "context", eyebrow: "03 · Your business", title: "Tell us a little about the business.", help: "Only the name and industry are required.", type: "fields", fields: [
        { id: "company", label: "Business or project name", type: "text", required: true }, { id: "industry", label: "Industry", type: "text", required: true }, { id: "website", label: "Current website", type: "url" }, { id: "size", label: "Team size", type: "select", options: ["Just me", "2–10", "11–50", "51–200", "200+", "Prefer not to say"] },
      ] },
      { id: "stage", eyebrow: "04 · Where you are now", title: "How far along is the project?", help: "We can begin with a rough idea or a clear scope.", type: "single", options: [
        { label: "It is still an idea", note: "I want help making it concrete" }, { label: "We know the problem", note: "The right solution is not clear yet" }, { label: "We have a rough scope", note: "We know most of what we need" }, { label: "Something already exists", note: "We want to improve or replace it" }, { label: "We are ready to build", note: "The scope and priorities are clear" },
      ] },
      { id: "priorities", eyebrow: "05 · What matters most", title: "Choose your top three priorities.", help: "Priorities make the right trade-offs visible.", type: "limit", limit: 3, options: [
        { label: "Business growth", note: "More sales, bookings or leads" }, { label: "Speed to launch", note: "Get useful value live quickly" }, { label: "Premium look and feel", note: "A stronger brand impression" }, { label: "Ease of use", note: "Simple for customers and staff" }, { label: "Less manual work", note: "Automation and operational time" }, { label: "Visibility and control", note: "Better data and decisions" }, { label: "Ability to scale", note: "Foundations that can grow" }, { label: "Reliability", note: "Stable, tested and supportable" },
      ] },
      { id: "practical", eyebrow: "06 · Practical shape", title: "What timing and investment feel realistic?", help: "Optional, but useful for suggesting a sensible first scope.", type: "fields", fields: [
        { id: "timing", label: "Ideal timing", type: "select", options: ["Exploring / no deadline", "Within 1 month", "Within 1–3 months", "Within 3–6 months", "Later this year"] }, { id: "budget", label: "Investment comfort", type: "select", options: ["Not sure yet", "Under €5,000", "€5,000–€15,000", "€15,000–€30,000", "€30,000+", "Prefer to discuss"] },
      ] },
      { id: "details", eyebrow: "07 · In your own words", title: "What should we understand before we talk?", help: "What is frustrating? What have you tried? What would success look like?", type: "textarea" },
      { id: "contact", eyebrow: "08 · Keep the conversation going", title: "Where should we send the next step?", help: "We will use this only to respond to this enquiry.", type: "fields", fields: [
        { id: "name", label: "Your name", type: "text", required: true }, { id: "email", label: "Email", type: "email", required: true }, { id: "phone", label: "Phone / WhatsApp", type: "tel" }, { id: "channel", label: "Preferred reply", type: "select", options: ["Email", "Phone", "WhatsApp", "Telegram", "No preference"] }, { id: "language", label: "Preferred language", type: "select", options: ["English", "Greek / Ελληνικά", "Either"] },
      ] },
    ] satisfies AssistantStep[],
    ui: { progress: "Your project brief", back: "Back", next: "Continue", review: "Review brief", send: "Open email with brief", reset: "Start again", close: "Back to DS2", selected: "selected", required: "Required", optional: "Optional", choose: "Choose one", notes: "Project notes", notesPlaceholder: "For example: our current website is hard to update, customers keep calling with the same questions, and we want online booking…", reviewEyebrow: "Your DS2 project brief", reviewTitle: "This is what we understand so far.", reviewHelp: "Review the summary. No information leaves this browser until you choose to open the email.", error: "Complete the highlighted information to continue." },
  },
  el: {
    intro: { eyebrow: "Ένα χρήσιμο πρώτο βήμα", title: "Πώς μπορούμε να σας βοηθήσουμε;", body: "Ξεκινήστε από το αποτέλεσμα για την επιχείρηση, όχι από την τεχνολογία. Σε περίπου τέσσερα λεπτά, οι απαντήσεις σας γίνονται ένα σαφές brief που ελέγχετε πριν σταλεί οτιδήποτε.", cta: "Ξεκινήστε με αυτό που χρειάζεστε" },
    steps: [
      { id: "goal", eyebrow: "01 · Η αλλαγή", title: "Τι θα θέλατε περισσότερο να βελτιώσετε;", help: "Επιλέξτε όσα έχουν σημασία.", type: "multi", options: [
        { label: "Περισσότεροι πελάτες", note: "Εμπιστοσύνη, προβολή και πωλήσεις" }, { label: "Περισσότερος χρόνος στην ομάδα", note: "Επανάληψη, admin και καθυστερήσεις" }, { label: "Καθαρότερη εικόνα της επιχείρησης", note: "Δεδομένα, αναφορές και αποφάσεις" }, { label: "Έναρξη μιας νέας ιδέας", note: "Προϊόν, υπηρεσία ή ευκαιρία" }, { label: "Βελτίωση υπάρχοντος συστήματος", note: "Κάτι λειτουργεί, αλλά όχι αρκετά καλά" }, { label: "Κάτι άλλο", note: "Πείτε το με δικά σας λόγια" },
      ] },
      { id: "solution", eyebrow: "02 · Τι μπορεί να χτίσουμε", title: "Ποιες επιλογές φαίνονται σχετικές;", help: "Επιλέξτε περισσότερες από μία ή ζητήστε μας να βοηθήσουμε.", type: "multi", options: [
        { label: "Ιστοσελίδα ή redesign", note: "Πιο ξεκάθαρη και αξιόπιστη δημόσια εικόνα" }, { label: "E-shop", note: "Προϊόντα, checkout και πληρωμές" }, { label: "Σύστημα κρατήσεων", note: "Διαθεσιμότητα, ραντεβού και πληρωμή" }, { label: "Αυτοματισμοί", note: "Σύνδεση εργαλείων και λιγότερη χειροκίνητη εργασία" }, { label: "AI receptionist ή chatbot", note: "Απαντήσεις, αξιολόγηση και κρατήσεις 24/7" }, { label: "Dashboard ή προβλέψεις", note: "Μία χρήσιμη εικόνα των αριθμών" }, { label: "Custom εφαρμογή ή πλατφόρμα", note: "Web app, mobile app, SaaS ή marketplace" }, { label: "CRM ή εσωτερικό εργαλείο", note: "Λογισμικό προσαρμοσμένο στην ομάδα" }, { label: "Δεν είμαι σίγουρος/η", note: "Βοηθήστε με να επιλέξω" }, { label: "Άλλο / εντελώς custom", note: "Κάτι που δεν υπάρχει στη λίστα" },
      ] },
      { id: "context", eyebrow: "03 · Η επιχείρησή σας", title: "Πείτε μας λίγα πράγματα για την επιχείρηση.", help: "Χρειαζόμαστε μόνο το όνομα και τον κλάδο.", type: "fields", fields: [
        { id: "company", label: "Επιχείρηση ή όνομα έργου", type: "text", required: true }, { id: "industry", label: "Κλάδος", type: "text", required: true }, { id: "website", label: "Τρέχουσα ιστοσελίδα", type: "url" }, { id: "size", label: "Μέγεθος ομάδας", type: "select", options: ["Μόνο εγώ", "2–10", "11–50", "51–200", "200+", "Προτιμώ να μην απαντήσω"] },
      ] },
      { id: "stage", eyebrow: "04 · Πού βρίσκεστε τώρα", title: "Σε ποιο στάδιο βρίσκεται το έργο;", help: "Μπορούμε να ξεκινήσουμε από μια αρχική ιδέα ή σαφές scope.", type: "single", options: [
        { label: "Είναι ακόμη μια ιδέα", note: "Θέλω βοήθεια να γίνει συγκεκριμένη" }, { label: "Γνωρίζουμε το πρόβλημα", note: "Η σωστή λύση δεν είναι ακόμη σαφής" }, { label: "Έχουμε ένα αρχικό scope", note: "Γνωρίζουμε τα περισσότερα από όσα χρειαζόμαστε" }, { label: "Υπάρχει ήδη κάτι", note: "Θέλουμε να το βελτιώσουμε ή να το αντικαταστήσουμε" }, { label: "Είμαστε έτοιμοι να χτίσουμε", note: "Το scope και οι προτεραιότητες είναι σαφή" },
      ] },
      { id: "priorities", eyebrow: "05 · Τι έχει μεγαλύτερη σημασία", title: "Επιλέξτε τις τρεις βασικές προτεραιότητες.", help: "Οι προτεραιότητες κάνουν τους σωστούς συμβιβασμούς ορατούς.", type: "limit", limit: 3, options: [
        { label: "Ανάπτυξη", note: "Περισσότερες πωλήσεις, κρατήσεις ή leads" }, { label: "Ταχύτητα έναρξης", note: "Χρήσιμη αξία γρήγορα" }, { label: "Premium εικόνα", note: "Ισχυρότερη εντύπωση brand" }, { label: "Ευκολία χρήσης", note: "Απλό για πελάτες και προσωπικό" }, { label: "Λιγότερη χειροκίνητη εργασία", note: "Αυτοματισμός και χρόνος" }, { label: "Ορατότητα και έλεγχος", note: "Καλύτερα δεδομένα και αποφάσεις" }, { label: "Δυνατότητα κλιμάκωσης", note: "Βάσεις που μπορούν να μεγαλώσουν" }, { label: "Αξιοπιστία", note: "Σταθερό, δοκιμασμένο και υποστηρίξιμο" },
      ] },
      { id: "practical", eyebrow: "06 · Πρακτικό πλαίσιο", title: "Ποιο χρονοδιάγραμμα και επένδυση είναι ρεαλιστικά;", help: "Προαιρετικό, αλλά χρήσιμο για ένα λογικό πρώτο scope.", type: "fields", fields: [
        { id: "timing", label: "Ιδανικό χρονοδιάγραμμα", type: "select", options: ["Διερεύνηση / χωρίς deadline", "Μέσα σε 1 μήνα", "Μέσα σε 1–3 μήνες", "Μέσα σε 3–6 μήνες", "Αργότερα φέτος"] }, { id: "budget", label: "Εύρος επένδυσης", type: "select", options: ["Δεν είμαι σίγουρος/η", "Κάτω από €5.000", "€5.000–€15.000", "€15.000–€30.000", "€30.000+", "Προτιμώ να το συζητήσουμε"] },
      ] },
      { id: "details", eyebrow: "07 · Με δικά σας λόγια", title: "Τι πρέπει να καταλάβουμε πριν μιλήσουμε;", help: "Τι σας δυσκολεύει; Τι δοκιμάσατε; Πώς μοιάζει η επιτυχία;", type: "textarea" },
      { id: "contact", eyebrow: "08 · Να συνεχίσουμε τη συζήτηση", title: "Πού να στείλουμε το επόμενο βήμα;", help: "Θα χρησιμοποιήσουμε τα στοιχεία μόνο για να απαντήσουμε.", type: "fields", fields: [
        { id: "name", label: "Το όνομά σας", type: "text", required: true }, { id: "email", label: "Email", type: "email", required: true }, { id: "phone", label: "Τηλέφωνο / WhatsApp", type: "tel" }, { id: "channel", label: "Προτιμώμενη απάντηση", type: "select", options: ["Email", "Τηλέφωνο", "WhatsApp", "Telegram", "Χωρίς προτίμηση"] }, { id: "language", label: "Προτιμώμενη γλώσσα", type: "select", options: ["Ελληνικά", "English", "Και τα δύο"] },
      ] },
    ] satisfies AssistantStep[],
    ui: { progress: "Το project brief σας", back: "Πίσω", next: "Συνέχεια", review: "Έλεγχος brief", send: "Άνοιγμα email με το brief", reset: "Από την αρχή", close: "Πίσω στη DS2", selected: "επιλεγμένα", required: "Υποχρεωτικό", optional: "Προαιρετικό", choose: "Επιλέξτε", notes: "Σημειώσεις έργου", notesPlaceholder: "Για παράδειγμα: η τρέχουσα ιστοσελίδα είναι δύσκολη στην ενημέρωση, οι πελάτες καλούν με τις ίδιες ερωτήσεις και θέλουμε online κρατήσεις…", reviewEyebrow: "Το DS2 project brief σας", reviewTitle: "Αυτό καταλάβαμε μέχρι στιγμής.", reviewHelp: "Ελέγξτε τη σύνοψη. Καμία πληροφορία δεν φεύγει από τον browser μέχρι να ανοίξετε το email.", error: "Συμπληρώστε τις σημειωμένες πληροφορίες για να συνεχίσετε." },
  },
} as const;
