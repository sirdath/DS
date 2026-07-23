import { assistantCopy } from "../apps/ds-site/src/app/assistant/assistant-data.ts";

const goals = ["customers", "time", "product", "clarity"];
const prompts = [];

function add(lang, key, title, help) {
  prompts.push({ lang, key, text: `${title}. ${help}` });
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
