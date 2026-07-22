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
}

process.stdout.write(JSON.stringify(prompts));
