"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LangToggle, useLang } from "../i18n";
import { assistantCopy, type AssistantField, type AssistantStep } from "./assistant-data";
import "./assistant.css";

type Answers = Record<string, string | string[]>;
const EMAIL = "ds2consulting.contact@gmail.com";
const STORAGE = "ds2-project-brief";

function valueList(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

export default function AssistantPage() {
  const { lang } = useLang();
  const c = assistantCopy[lang];
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const total = c.steps.length;
  const isIntro = screen === 0;
  const isReview = screen === total + 1;
  const step = isIntro || isReview ? null : c.steps[screen - 1] as AssistantStep;

  useEffect(() => {
    try { setAnswers(JSON.parse(localStorage.getItem(STORAGE) || "{}")); } catch { /* keep a clean draft */ }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(answers));
  }, [answers]);

  useEffect(() => setError(""), [screen, lang]);

  const setAnswer = (id: string, value: string | string[]) => setAnswers((current) => ({ ...current, [id]: value }));

  const toggleOption = (currentStep: AssistantStep, label: string) => {
    const values = valueList(answers[currentStep.id]);
    if (currentStep.type === "single") return setAnswer(currentStep.id, [label]);
    if (values.includes(label)) return setAnswer(currentStep.id, values.filter((item) => item !== label));
    if (currentStep.type === "limit" && values.length >= (currentStep.limit || 3)) return;
    setAnswer(currentStep.id, [...values, label]);
  };

  const validate = () => {
    if (!step) return true;
    if (["multi", "single", "limit"].includes(step.type) && !valueList(answers[step.id]).length) return false;
    if (step.fields) {
      const missing = step.fields.some((field) => field.required && !String(answers[field.id] || "").trim());
      if (missing) return false;
      if (step.id === "contact" && !/^\S+@\S+\.\S+$/.test(String(answers.email || ""))) return false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return setError(c.ui.error);
    setError("");
    setScreen((current) => Math.min(total + 1, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const summary = useMemo(() => {
    const rows = c.steps.map((item) => {
      const direct = answers[item.id];
      if (direct) return [item.title, valueList(direct).join(", ")];
      if (item.fields) return [item.title, item.fields.map((field) => `${field.label}: ${answers[field.id] || "—"}`).join(" · ")];
      return [item.title, "—"];
    });
    return rows;
  }, [answers, c.steps]);

  const send = () => {
    const body = summary.map(([label, value]) => `${label}\n${value}`).join("\n\n");
    const subject = `DS2 project brief — ${answers.company || answers.name || "New enquiry"}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const reset = () => {
    setAnswers({});
    setScreen(0);
    localStorage.removeItem(STORAGE);
  };

  return (
    <main className="assistant-shell">
      <header className="assistant-nav">
        <Link href="/" aria-label={c.ui.close}><img src="/logos/ds2-white.png" alt="DS2" /></Link>
        <div className="assistant-progress" aria-label={c.ui.progress}>
          <span>{c.ui.progress}</span><i><b style={{ width: `${Math.min(100, (screen / (total + 1)) * 100)}%` }} /></i><strong>{String(Math.min(screen, total)).padStart(2, "0")} / {String(total).padStart(2, "0")}</strong>
        </div>
        <LangToggle />
      </header>

      <section className="assistant-screen" key={`${lang}-${screen}`}>
        {isIntro && <div className="assistant-intro"><p>{c.intro.eyebrow}</p><h1>{c.intro.title}</h1><div><span>DS2</span><p>{c.intro.body}</p></div></div>}

        {step && <div className="assistant-question">
          <header><p>{step.eyebrow}</p><h1>{step.title}</h1><span>{step.help}</span></header>
          {step.options && <div className="assistant-options">
            {step.options.map((option, index) => {
              const selected = valueList(answers[step.id]).includes(option.label);
              return <button type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} key={option.label} onClick={() => toggleOption(step, option.label)}>
                <span className="assistant-option__index">{String(index + 1).padStart(2, "0")}</span><span><strong>{option.label}</strong><small>{option.note}</small></span><i aria-hidden="true" />
              </button>;
            })}
          </div>}
          {step.fields && <div className="assistant-fields">{step.fields.map((field) => <Field key={field.id} field={field} value={String(answers[field.id] || "")} onChange={(value) => setAnswer(field.id, value)} ui={c.ui} />)}</div>}
          {step.type === "textarea" && <label className="assistant-textarea"><span>{c.ui.notes} · {c.ui.optional}</span><textarea value={String(answers.details || "")} onChange={(event) => setAnswer("details", event.target.value)} placeholder={c.ui.notesPlaceholder} /></label>}
          {step.type === "limit" && <p className="assistant-count">{valueList(answers[step.id]).length} / {step.limit} {c.ui.selected}</p>}
        </div>}

        {isReview && <div className="assistant-review">
          <header><p>{c.ui.reviewEyebrow}</p><h1>{c.ui.reviewTitle}</h1><span>{c.ui.reviewHelp}</span></header>
          <div>{summary.map(([label, value], index) => <article key={label}><span>{String(index + 1).padStart(2, "0")}</span><h2>{label}</h2><p>{value || "—"}</p></article>)}</div>
        </div>}
        {error && <p className="assistant-error" role="alert">{error}</p>}
      </section>

      <footer className="assistant-controls">
        <button type="button" onClick={() => setScreen((current) => Math.max(0, current - 1))} disabled={isIntro}>{c.ui.back}</button>
        <span>{isIntro ? c.intro.eyebrow : isReview ? c.ui.reviewEyebrow : step?.eyebrow}</span>
        {!isReview && <button type="button" className="assistant-next" onClick={next}>{isIntro ? c.intro.cta : screen === total ? c.ui.review : c.ui.next}<span>→</span></button>}
        {isReview && <div className="assistant-finish"><button type="button" onClick={reset}>{c.ui.reset}</button><button type="button" className="assistant-next" onClick={send}>{c.ui.send}<span>↗</span></button></div>}
      </footer>
    </main>
  );
}

function Field({ field, value, onChange, ui }: { field: AssistantField; value: string; onChange: (value: string) => void; ui: { required: string; optional: string; choose: string } }) {
  return <label><span>{field.label} · {field.required ? ui.required : ui.optional}</span>
    {field.type === "select" ? <select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{ui.choose}</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input type={field.type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={field.id === "email" ? "email" : field.id === "name" ? "name" : "off"} />}
  </label>;
}
