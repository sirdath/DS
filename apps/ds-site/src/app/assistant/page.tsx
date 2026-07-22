"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { LangToggle, useLang } from "../i18n";
import { assistantCopy, type AssistantField, type AssistantOption, type AssistantStep, type GoalKey } from "./assistant-data";
import { createAryaOrb, type AryaOrbHandle } from "./arya-orb";
import "./assistant.css";

type Answers = Record<string, string | string[]>;
const EMAIL = "ds2consulting.contact@gmail.com";
const STORAGE = "ds2-project-brief-v2";

function valueList(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function answerLabel(step: AssistantStep, answers: Answers) {
  if (step.slider) {
    const index = Number(answers[step.id] ?? step.slider.defaultValue);
    return step.slider.values[index] || step.slider.values[step.slider.defaultValue];
  }
  if (step.options) {
    const values = valueList(answers[step.id]);
    return values.map((value) => step.options?.find((option) => option.value === value)?.label || value).join(", ");
  }
  if (step.fields) {
    return step.fields
      .filter((field) => answers[field.id])
      .map((field) => `${field.label}: ${answers[field.id]}`)
      .join(" · ");
  }
  return String(answers[step.id] || "");
}

export default function AssistantPage() {
  const { lang } = useLang();
  const c = assistantCopy[lang];
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [voiceOn, setVoiceOn] = useState(true);
  const [replay, setReplay] = useState(0);

  const goalKey = (String(answers.goal || "customers") as GoalKey);
  const branch = c.branches[goalKey] || c.branches.customers;
  const steps = useMemo<AssistantStep[]>(() => [
    c.goal as AssistantStep,
    branch.services as AssistantStep,
    branch.diagnosis as AssistantStep,
    branch.outcomes as AssistantStep,
    c.common.business as AssistantStep,
    c.common.team as AssistantStep,
    c.common.timing as AssistantStep,
    c.common.budget as AssistantStep,
    {
      id: "details", eyebrow: lang === "el" ? "09 · Με δικά σας λόγια" : "09 · In your words",
      title: branch.detailsTitle, help: branch.detailsHelp, summaryLabel: lang === "el" ? "Επιπλέον context" : "Additional context",
      type: "textarea", optional: true, placeholder: branch.detailsPlaceholder,
    },
    c.common.contact as AssistantStep,
  ], [branch, c.common, c.goal, lang]);

  const isReview = screen >= steps.length;
  const step = isReview ? null : steps[screen];
  const visibleStep = isReview ? steps.length : screen + 1;
  const percent = isReview ? 100 : Math.round((visibleStep / steps.length) * 100);
  const remaining = Math.max(0, steps.length - visibleStep);

  useEffect(() => {
    try { setAnswers(JSON.parse(localStorage.getItem(STORAGE) || "{}")); } catch { /* clean start */ }
    try { setVoiceOn(localStorage.getItem(`${STORAGE}-voice`) !== "off"); } catch { /* voice stays on */ }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(answers)); }, [answers]);
  useEffect(() => { localStorage.setItem(`${STORAGE}-voice`, voiceOn ? "on" : "off"); }, [voiceOn]);
  useEffect(() => setError(""), [screen, lang]);
  useEffect(() => { if (screen > steps.length) setScreen(steps.length); }, [screen, steps.length]);

  const setAnswer = (id: string, value: string | string[]) => setAnswers((current) => ({ ...current, [id]: value }));

  const moveTo = useCallback((nextScreen: number) => {
    setScreen(Math.max(0, Math.min(steps.length, nextScreen)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [steps.length]);

  const chooseOption = (currentStep: AssistantStep, option: AssistantOption) => {
    const values = valueList(answers[currentStep.id]);
    if (currentStep.type === "single") {
      setAnswers((current) => {
        if (currentStep.id !== "goal" || current.goal === option.value) return { ...current, [currentStep.id]: option.value };
        const clean: Answers = { ...current, [currentStep.id]: option.value };
        ["services", "diagnosis", "outcomes", "details"].forEach((key) => delete clean[key]);
        return clean;
      });
      if (currentStep.autoAdvance) window.setTimeout(() => moveTo(screen + 1), 420);
      return;
    }
    if (values.includes(option.value)) return setAnswer(currentStep.id, values.filter((item) => item !== option.value));
    if (currentStep.type === "limit" && values.length >= (currentStep.limit || 3)) return;
    setAnswer(currentStep.id, [...values, option.value]);
  };

  const validate = () => {
    if (!step || step.optional || step.type === "slider") return true;
    if (["multi", "single", "limit"].includes(step.type) && !valueList(answers[step.id]).length) return false;
    if (step.fields) {
      if (step.fields.some((field) => field.required && !String(answers[field.id] || "").trim())) return false;
      if (step.id === "contact" && !/^\S+@\S+\.\S+$/.test(String(answers.email || ""))) return false;
    }
    return true;
  };

  const next = () => {
    if (!validate()) return setError(c.ui.error);
    setError("");
    moveTo(screen + 1);
  };

  const summary = useMemo(() => steps.map((item) => [item.summaryLabel, answerLabel(item, answers) || (lang === "el" ? "—" : "—")] as const), [answers, lang, steps]);

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

  const spokenText = step ? `${step.title}. ${step.help}` : `${c.ui.reviewTitle}. ${c.ui.reviewHelp}`;

  return (
    <main className="assistant-shell">
      <div className="assistant-aurora" aria-hidden="true"><i /><i /><i /></div>
      <header className="assistant-nav">
        <Link href="/" className="assistant-brand" aria-label={c.ui.close}><img src="/logos/ds2-white.png" alt="DS2" /></Link>
        <div className="assistant-progress" aria-label={`${c.ui.progress}: ${percent}%`}>
          <div className="assistant-progress__copy"><span>{c.ui.step} {visibleStep} / {steps.length}</span><strong>{percent}% {c.ui.complete}</strong><small>{remaining} {c.ui.remaining}</small></div>
          <div className="assistant-progress__track"><b style={{ width: `${percent}%` }} />{steps.map((item, index) => <i key={item.id} className={index < visibleStep || isReview ? "is-done" : ""} />)}</div>
        </div>
        <div className="assistant-nav__actions"><button type="button" className={`assistant-voice${voiceOn ? " is-on" : ""}`} onClick={() => setVoiceOn((current) => !current)} aria-pressed={voiceOn}><span aria-hidden="true">{voiceOn ? "◖))" : "◖×"}</span>{voiceOn ? "Arya on" : "Arya off"}</button><LangToggle /></div>
      </header>

      <section className="assistant-stage">
        <AryaGuide key={`${lang}-${screen}-${replay}`} text={spokenText} help={step?.help || c.ui.reviewHelp} lang={lang} enabled={voiceOn} onReplay={() => setReplay((value) => value + 1)} />

        <div className="assistant-screen" key={`${lang}-${screen}`}>
          {step && <div className={`assistant-question assistant-question--${step.type}`}>
            <header>
              <p>{step.eyebrow}</p>
              {step.context && <span className="assistant-context"><i />{step.context}</span>}
              <h1>{step.title}</h1>
              <span className="assistant-help">{step.help}</span>
            </header>

            {step.options && <div className="assistant-options">
              {step.options.map((option, index) => {
                const selected = valueList(answers[step.id]).includes(option.value);
                return <button type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} key={option.value} onClick={() => chooseOption(step, option)}>
                  <span className="assistant-option__number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="assistant-option__copy"><strong>{option.label}</strong><small>{option.note}</small></span>
                  <i className="assistant-option__check" aria-hidden="true"><b /></i>
                </button>;
              })}
            </div>}

            {step.fields && <div className="assistant-fields">{step.fields.map((field) => <Field key={field.id} field={field} value={String(answers[field.id] || "")} onChange={(value) => setAnswer(field.id, value)} ui={c.ui} />)}</div>}

            {step.slider && <SliderQuestion step={step} value={Number(answers[step.id] ?? step.slider.defaultValue)} onChange={(value) => setAnswer(step.id, String(value))} hint={c.ui.sliderHint} />}

            {step.type === "textarea" && <label className="assistant-textarea"><span>{lang === "el" ? "Προαιρετικό" : "Optional — a few sentences are enough"}</span><textarea value={String(answers.details || "")} onChange={(event) => setAnswer("details", event.target.value)} placeholder={step.placeholder} /></label>}

            {step.type === "limit" && <p className="assistant-count"><span>{valueList(answers[step.id]).length}</span> / {step.limit} {c.ui.selected}</p>}
          </div>}

          {isReview && <div className="assistant-review">
            <header><p>{c.ui.reviewEyebrow}</p><h1>{c.ui.reviewTitle}</h1><span>{c.ui.reviewHelp}</span></header>
            <div className="assistant-review__grid">{summary.map(([label, value], index) => <article key={label}><span>{String(index + 1).padStart(2, "0")}</span><button type="button" onClick={() => moveTo(index)}>{lang === "el" ? "Αλλαγή" : "Edit"}</button><h2>{label}</h2><p>{value}</p></article>)}</div>
          </div>}

          {error && <p className="assistant-error" role="alert">{error}</p>}
        </div>
      </section>

      <footer className="assistant-controls">
        <button type="button" onClick={() => moveTo(screen - 1)} disabled={screen === 0}><span>←</span>{c.ui.back}</button>
        <span>{step?.eyebrow || c.ui.reviewEyebrow}</span>
        {!isReview && !step?.autoAdvance && <button type="button" className="assistant-next" onClick={next}>{screen === steps.length - 1 ? c.ui.review : c.ui.next}<span>→</span></button>}
        {!isReview && step?.autoAdvance && <span className="assistant-autocue">{lang === "el" ? "Επιλέξτε για συνέχεια" : "Choose to continue"}</span>}
        {isReview && <div className="assistant-finish"><button type="button" onClick={reset}>{c.ui.reset}</button><button type="button" className="assistant-next" onClick={send}>{c.ui.send}<span>↗</span></button></div>}
      </footer>
    </main>
  );
}

function AryaGuide({ text, help, lang, enabled, onReplay }: { text: string; help: string; lang: "en" | "el"; enabled: boolean; onReplay: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<AryaOrbHandle | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    orbRef.current = createAryaOrb(mountRef.current);
    return () => orbRef.current?.destroy();
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      window.speechSynthesis?.cancel();
      orbRef.current?.setState("idle");
      return;
    }
    const timer = window.setTimeout(() => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const chooseVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        utterance.voice = lang === "el"
          ? voices.find((voice) => voice.lang.toLowerCase().startsWith("el")) || null
          : voices.find((voice) => /aria/i.test(voice.name)) || voices.find((voice) => /sonia|jenny/i.test(voice.name)) || voices.find((voice) => voice.lang.toLowerCase().startsWith("en")) || null;
        utterance.lang = lang === "el" ? "el-GR" : "en-US";
        utterance.rate = 0.96;
        utterance.pitch = 1.02;
        utterance.onstart = () => orbRef.current?.setState("speaking");
        utterance.onend = () => orbRef.current?.setState("idle");
        utterance.onerror = () => orbRef.current?.setState("idle");
        window.speechSynthesis.speak(utterance);
      };
      if (window.speechSynthesis.getVoices().length) chooseVoice();
      else window.speechSynthesis.addEventListener("voiceschanged", chooseVoice, { once: true });
    }, 520);
    return () => { window.clearTimeout(timer); window.speechSynthesis.cancel(); };
  }, [enabled, lang, text]);

  return <aside className="arya-guide">
    <button type="button" className="arya-orb" onClick={onReplay} aria-label={lang === "el" ? "Επανάληψη ερώτησης" : "Repeat Arya’s question"}><span ref={mountRef} /></button>
    <div className="arya-bubble"><div><i /><strong>Arya</strong><small>DS2 assistant</small></div><p>{help}</p><button type="button" onClick={onReplay}>{lang === "el" ? "Ξανά" : "Hear again"}<span aria-hidden="true">◖))</span></button></div>
  </aside>;
}

function SliderQuestion({ step, value, onChange, hint }: { step: AssistantStep; value: number; onChange: (value: number) => void; hint: string }) {
  const slider = step.slider!;
  const progress = ((value - slider.min) / Math.max(1, slider.max - slider.min)) * 100;
  return <div className="assistant-slider" style={{ "--range-progress": `${progress}%` } as CSSProperties}>
    <div className="assistant-slider__scene">
      {slider.scene === "team" && <TeamScene value={value} />}
      {slider.scene === "budget" && <BudgetScene value={value} />}
      {slider.scene === "timing" && <TimingScene value={value} max={slider.max} />}
      <div className="assistant-slider__reading"><span>{slider.labels[value]}</span><strong>{slider.values[value]}</strong></div>
    </div>
    <label><span>{hint}</span><input type="range" min={slider.min} max={slider.max} step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-valuetext={slider.values[value]} /></label>
    <div className="assistant-slider__ticks" style={{ gridTemplateColumns: `repeat(${slider.values.length}, 1fr)` }}>{slider.values.map((_, index) => <button type="button" key={index} className={index === value ? "is-active" : ""} onClick={() => onChange(index)} aria-label={slider.values[index]}><i /><span>{index === 0 || index === slider.max ? slider.labels[index] : ""}</span></button>)}</div>
  </div>;
}

function TeamScene({ value }: { value: number }) {
  const active = [1, 4, 8, 13, 18][value] || 1;
  return <div className="scene-team" aria-hidden="true"><div className="scene-team__room"><i /><i /><i /></div><div className="scene-team__people">{Array.from({ length: 18 }, (_, index) => <span className={index < active ? "is-active" : ""} key={index}><i /></span>)}</div></div>;
}

function BudgetScene({ value }: { value: number }) {
  return <div className="scene-budget" aria-hidden="true">{Array.from({ length: 6 }, (_, stack) => <div className={stack <= value ? "is-active" : ""} key={stack}>{Array.from({ length: stack + 1 }, (_, coin) => <i key={coin}>€</i>)}</div>)}</div>;
}

function TimingScene({ value, max }: { value: number; max: number }) {
  const progress = value / max;
  return <div className="scene-timing" style={{ "--pace": progress } as CSSProperties} aria-hidden="true"><div className="scene-timing__line">{Array.from({ length: 5 }, (_, index) => <i className={index <= value ? "is-active" : ""} key={index} />)}</div><span>➤</span><b /></div>;
}

function Field({ field, value, onChange, ui }: { field: AssistantField; value: string; onChange: (value: string) => void; ui: { required: string; optional: string; choose: string } }) {
  return <label><span>{field.label}<small>{field.required ? ui.required : ui.optional}</small></span>
    {field.type === "select"
      ? <select value={value} onChange={(event) => onChange(event.target.value)}><option value="">{ui.choose}</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
      : <input type={field.type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={field.id === "email" ? "email" : field.id === "name" ? "name" : "off"} />}
  </label>;
}
