import { assistantCopy } from "../apps/ds-site/src/app/assistant/assistant-data.ts";

const goals = ["customers", "time", "product", "clarity"];
const prompts = [];

// A few English words are heteronyms that Kokoro's G2P sometimes reads with
// the wrong pronunciation for how they're used here -- e.g. "live" defaulting
// to the verb reading ("to live", rhymes with "give") when the copy means the
// status adjective ("the site is live", rhymes with "five"). Rather than
// baking IPA markup into the on-screen copy itself, the fix is applied only
// to the text piped into the voice generator, keyed by prompt id, so the
// displayed copy in assistant-data.ts stays exactly as written.
// A Map rather than an object literal: keys here are prompt ids, and a plain
// object would resolve ids like "constructor" or "toString" to inherited
// Object.prototype members, which are truthy and so survive a `|| []` fallback
// only to blow up as "is not iterable" in the loop below. No current id hits
// that, so this is guarding a latent trap, not fixing a live break.
// Each pattern is global: String.replace with a non-global regex substitutes
// only the first match, which is right for today's copy ("live" appears once)
// but would silently skip a second occurrence the day one is added.
const PRONUNCIATION_FIXES = new Map([
  ["timing", [[/\blive\b/gi, "[live](/lˈaɪv/)"]]],
]);

function add(lang, key, title, help) {
  let text = `${title}. ${help}`;
  if (lang === "en") {
    for (const [pattern, replacement] of PRONUNCIATION_FIXES.get(key) ?? []) {
      text = text.replace(pattern, replacement);
    }
  }
  prompts.push({ lang, key, text });
}

for (const lang of ["en", "el"]) {
  const copy = assistantCopy[lang];
  add(lang, "goal", copy.goal.title, copy.goal.help);

  for (const goal of goals) {
    const branch = copy.branches[goal];
    for (const stepName of ["services", "diagnosis", "outcomes"]) {
      const step = branch[stepName];
      add(lang, `${goal}-${stepName}`, step.title, step.help);
    }
    add(lang, `${goal}-details`, branch.detailsTitle, branch.detailsHelp);
  }

  for (const stepName of ["business", "team", "timing", "budget", "contact"]) {
    const step = copy.common[stepName];
    add(lang, stepName, step.title, step.help);
  }

  add(lang, "review", copy.ui.reviewTitle, copy.ui.reviewHelp);

  const validationPrompts = lang === "el"
    ? {
        one: "Παρακαλώ επιλέξτε μία απάντηση για να συνεχίσετε.",
        two: "Παρακαλώ επιλέξτε μία ή δύο απαντήσεις για να συνεχίσετε.",
        three: "Παρακαλώ επιλέξτε μία, δύο ή τρεις απαντήσεις για να συνεχίσετε.",
        required: "Παρακαλώ συμπληρώστε τα υποχρεωτικά πεδία για να συνεχίσετε.",
        email: "Παρακαλώ εισαγάγετε μια έγκυρη διεύθυνση email για να συνεχίσετε.",
      }
    : {
        one: "Please select an answer to continue.",
        two: "Please select one or two answers to continue.",
        three: "Please select one, two, or three answers to continue.",
        required: "Please complete the required fields to continue.",
        email: "Please enter a valid email address to continue.",
      };
  for (const [key, text] of Object.entries(validationPrompts)) {
    prompts.push({ lang, key: `validation-${key}`, text });
  }
}

process.stdout.write(JSON.stringify(prompts));
