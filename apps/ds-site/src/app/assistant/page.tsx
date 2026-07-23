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

const SERVICE_DIAGNOSIS_PRIORITY: Record<GoalKey, Record<string, string[]>> = {
  customers: {
    website: ["trust", "outdated", "conversion", "friction", "missing"],
    shop: ["conversion", "friction", "outdated", "trust", "missing"],
    booking: ["friction", "conversion", "outdated", "missing", "trust"],
    platform: ["missing", "outdated", "friction", "conversion", "trust"],
    mobile: ["missing", "outdated", "friction", "conversion", "trust"],
  },
  time: {
    automation: ["repetition", "disconnected", "reporting", "scale", "enquiries"],
    receptionist: ["enquiries", "scale", "repetition", "disconnected", "reporting"],
    chatbot: ["enquiries", "scale", "repetition", "disconnected", "reporting"],
    agents: ["repetition", "scale", "reporting", "disconnected", "enquiries"],
    loyalty: ["enquiries", "repetition", "scale", "disconnected", "reporting"],
  },
  product: {},
  clarity: {
    dashboard: ["scattered", "slow", "gut", "future", "market"],
    forecast: ["future", "scattered", "slow", "gut", "market"],
    marketing: ["slow", "scattered", "gut", "market", "future"],
    competitors: ["market", "slow", "scattered", "gut", "future"],
    pipeline: ["scattered", "slow", "gut", "future", "market"],
  },
};

const DIAGNOSIS_OUTCOME_PRIORITY: Record<GoalKey, Record<string, string[]>> = {
  customers: {
    trust: ["trust", "leads", "launch", "sales", "bookings"],
    conversion: ["leads", "sales", "bookings", "trust", "launch"],
    friction: ["bookings", "sales", "leads", "launch", "trust"],
    outdated: ["trust", "launch", "leads", "sales", "bookings"],
    missing: ["launch", "trust", "leads", "sales", "bookings"],
  },
  time: {
    repetition: ["hours", "accuracy", "control", "speed", "always-on"],
    enquiries: ["always-on", "speed", "hours", "control", "accuracy"],
    disconnected: ["control", "accuracy", "hours", "speed", "always-on"],
    reporting: ["hours", "control", "accuracy", "speed", "always-on"],
    scale: ["hours", "accuracy", "speed", "control", "always-on"],
  },
  product: {
    idea: ["validate", "speed", "experience", "ownership", "scale"],
    rough: ["validate", "experience", "speed", "scale", "ownership"],
    prototype: ["validate", "scale", "experience", "speed", "ownership"],
    replace: ["ownership", "experience", "scale", "speed", "validate"],
    ready: ["speed", "scale", "experience", "ownership", "validate"],
  },
  clarity: {
    scattered: ["performance", "attention", "marketing", "next", "market"],
    slow: ["attention", "performance", "next", "marketing", "market"],
    gut: ["performance", "attention", "next", "marketing", "market"],
    future: ["next", "attention", "performance", "market", "marketing"],
    market: ["market", "attention", "performance", "next", "marketing"],
  },
};

function valueList(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function prioritizedStep(step: AssistantStep, order?: string[], context?: string): AssistantStep {
  if (!order?.length || !step.options) return context ? { ...step, context } : step;
  const rank = new Map(order.map((value, index) => [value, index]));
  return {
    ...step,
    context,
    options: [...step.options].sort(
      (a, b) => (rank.get(a.value) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.value) ?? Number.MAX_SAFE_INTEGER),
    ),
  };
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
  const selectedService = valueList(answers.services)[0] || "";
  const selectedDiagnosis = String(answers.diagnosis || "");
  const steps = useMemo<AssistantStep[]>(() => {
    const serviceLabel = branch.services.options?.find((option) => option.value === selectedService)?.label;
    const diagnosisLabel = branch.diagnosis.options?.find((option) => option.value === selectedDiagnosis)?.label;
    const diagnosisContext = serviceLabel
      ? `${lang === "el" ? "Προσαρμοσμένο για" : "Adapted for"}: ${serviceLabel}`
      : undefined;
    const outcomeContext = diagnosisLabel
      ? `${lang === "el" ? "Με βάση" : "Based on"}: ${diagnosisLabel}`
      : undefined;
    const diagnosis = prioritizedStep(
      branch.diagnosis as AssistantStep,
      SERVICE_DIAGNOSIS_PRIORITY[goalKey][selectedService],
      diagnosisContext,
    );
    const outcomes = prioritizedStep(
      branch.outcomes as AssistantStep,
      DIAGNOSIS_OUTCOME_PRIORITY[goalKey][selectedDiagnosis],
      outcomeContext,
    );
    return [
      c.goal as AssistantStep,
      branch.services as AssistantStep,
      diagnosis,
      outcomes,
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
    ];
  }, [branch, c.common, c.goal, goalKey, lang, selectedDiagnosis, selectedService]);

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

  const voiceKey = isReview
    ? "review"
    : step?.id === "goal"
      ? "goal"
      : step && ["services", "diagnosis", "outcomes", "details"].includes(step.id)
        ? `${goalKey}-${step.id}`
        : step?.id || "goal";
  const voiceSrc = `/audio/arya/${lang}/${voiceKey}.mp3`;

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
        <AryaGuide key={`${lang}-${screen}-${replay}`} voiceSrc={voiceSrc} help={step?.help || c.ui.reviewHelp} lang={lang} enabled={voiceOn} onReplay={() => setReplay((value) => value + 1)} />

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
                  <ChoiceIcon value={option.value} fallbackIndex={index} />
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

type ChoiceIconKind = "growth" | "clock" | "bulb" | "eye" | "window" | "bag" | "calendar" | "phone" | "flow" | "chat" | "chart" | "people" | "heart" | "rocket" | "target" | "spark";

const CHOICE_ICON_KINDS: Record<string, ChoiceIconKind> = {
  customers: "growth", time: "clock", product: "bulb", clarity: "eye",
  website: "window", outdated: "window", shop: "bag", sales: "bag",
  booking: "calendar", bookings: "calendar", mobile: "phone",
  automation: "flow", disconnected: "flow", pipeline: "flow",
  receptionist: "chat", chatbot: "chat", enquiries: "chat", "always-on": "chat",
  agents: "people", crm: "people", scale: "people",
  dashboard: "chart", reporting: "chart", forecast: "chart", marketing: "chart", performance: "chart", future: "chart",
  trust: "heart", loyalty: "heart", experience: "heart",
  speed: "rocket", launch: "rocket", ready: "rocket",
  competitors: "target", market: "target", control: "target", accuracy: "target", attention: "target",
  platform: "window", saas: "window", internal: "chart", marketplace: "people",
  custom: "spark", unsure: "spark", missing: "spark", idea: "bulb", validate: "bulb",
};

function ChoiceIcon({ value, fallbackIndex }: { value: string; fallbackIndex: number }) {
  const kind = CHOICE_ICON_KINDS[value] || (["spark", "target", "flow", "chart"][fallbackIndex % 4] as ChoiceIconKind);
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.65, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <span className={`assistant-choice-icon assistant-choice-icon--${kind}`} aria-hidden="true">
    <svg viewBox="0 0 40 40">
      {kind === "growth" && <><path {...common} className="icon-main" d="M9 28l7-8 6 4 9-12" /><path {...common} className="icon-accent" d="M24 12h7v7" /><circle className="icon-dot" cx="9" cy="28" r="2.2" /></>}
      {kind === "clock" && <><circle {...common} className="icon-main" cx="20" cy="20" r="12" /><path {...common} className="icon-hand icon-hand--hour" d="M20 20V13" /><path {...common} className="icon-hand icon-hand--minute" d="M20 20l6 3" /><circle className="icon-dot" cx="20" cy="20" r="1.7" /></>}
      {kind === "bulb" && <><g className="icon-rays"><path {...common} d="M20 4v3M7.8 9l2.2 2.2M32.2 9L30 11.2M4 20h3M33 20h3" /></g><path {...common} className="icon-main icon-bulb" d="M27.5 20.1c0-4.3-3.4-7.7-7.5-7.7s-7.5 3.4-7.5 7.7c0 3 1.7 5 3.8 6.7.8.7 1.2 1.6 1.2 2.6h5c0-1 .4-1.9 1.2-2.6 2.1-1.7 3.8-3.7 3.8-6.7Z" /><path {...common} className="icon-accent" d="M17 33h6M17.7 29.5h4.6" /></>}
      {kind === "eye" && <><path {...common} className="icon-main" d="M5.5 20s5.2-8 14.5-8 14.5 8 14.5 8-5.2 8-14.5 8S5.5 20 5.5 20Z" /><circle {...common} className="icon-iris" cx="20" cy="20" r="4.5" /><circle className="icon-dot" cx="20" cy="20" r="1.8" /></>}
      {kind === "window" && <><rect {...common} className="icon-main" x="7" y="9" width="26" height="22" rx="4" /><path {...common} className="icon-accent" d="M7 15h26M12 12h.1M16 12h.1" /></>}
      {kind === "bag" && <><path {...common} className="icon-main" d="M9 15h22l-2 17H11L9 15Z" /><path {...common} className="icon-accent" d="M15 16v-3a5 5 0 0 1 10 0v3" /></>}
      {kind === "calendar" && <><rect {...common} className="icon-main" x="8" y="10" width="24" height="22" rx="4" /><path {...common} className="icon-accent" d="M8 17h24M14 7v6M26 7v6" /><path {...common} className="icon-mark" d="m15 25 3 3 7-7" /></>}
      {kind === "phone" && <><rect {...common} className="icon-main" x="13" y="6" width="14" height="28" rx="4" /><path {...common} className="icon-accent" d="M18 10h4M19 30h2" /></>}
      {kind === "flow" && <><circle {...common} className="icon-node" cx="9" cy="12" r="3" /><circle {...common} className="icon-node" cx="31" cy="20" r="3" /><circle {...common} className="icon-node" cx="9" cy="29" r="3" /><path {...common} className="icon-main" d="M12 12h5c5 0 2 8 7 8h4M12 29h6c4 0 2-7 7-7h3" /></>}
      {kind === "chat" && <><path {...common} className="icon-main" d="M7 10h20a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H17l-6 5v-5H7a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4Z" /><path {...common} className="icon-accent" d="M10 18h2M17 18h2M24 18h2" /></>}
      {kind === "chart" && <><path {...common} className="icon-main" d="M8 31V20M16 31V12M24 31V17M32 31V8" /><path {...common} className="icon-accent" d="m7 15 8-6 8 3 9-7" /></>}
      {kind === "people" && <><circle {...common} className="icon-main" cx="16" cy="14" r="5" /><path {...common} className="icon-main" d="M7 31c0-6 3.8-10 9-10s9 4 9 10" /><circle {...common} className="icon-accent" cx="28" cy="16" r="3.5" /><path {...common} className="icon-accent" d="M25 23c5-1 8 2 8 7" /></>}
      {kind === "heart" && <path {...common} className="icon-main icon-heart" d="M20 32S7 25 7 15.5C7 10 14 7 20 13c6-6 13-3 13 2.5C33 25 20 32 20 32Z" />}
      {kind === "rocket" && <><path {...common} className="icon-main icon-rocket" d="M16 25c-4-1-7 1-8 6 5-1 7-4 6-8m10 1c1 4-1 7-6 8 1-5 4-7 8-6M15 24C13 15 20 8 31 7c-1 11-8 18-17 16Z" /><circle {...common} className="icon-accent" cx="24" cy="14" r="2.5" /></>}
      {kind === "target" && <><circle {...common} className="icon-main" cx="20" cy="20" r="12" /><circle {...common} className="icon-accent" cx="20" cy="20" r="6" /><circle className="icon-dot" cx="20" cy="20" r="2" /></>}
      {kind === "spark" && <><path {...common} className="icon-main icon-spark" d="M20 5c1 8 5 12 13 13-8 1-12 5-13 13-1-8-5-12-13-13 8-1 12-5 13-13Z" /><path {...common} className="icon-accent" d="M31 6c.4 3 2 4.6 5 5-3 .4-4.6 2-5 5-.4-3-2-4.6-5-5 3-.4 4.6-2 5-5Z" /></>}
    </svg>
  </span>;
}

function AryaGuide({ voiceSrc, help, lang, enabled, onReplay }: { voiceSrc: string; help: string; lang: "en" | "el"; enabled: boolean; onReplay: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<AryaOrbHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    orbRef.current = createAryaOrb(mountRef.current);
    return () => orbRef.current?.destroy();
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (!enabled || typeof window === "undefined") {
      orbRef.current?.setState("idle");
      return;
    }
    const audio = new Audio(voiceSrc);
    audio.preload = "auto";
    audioRef.current = audio;
    audio.onplay = () => orbRef.current?.setState("speaking");
    audio.onended = () => orbRef.current?.setState("idle");
    audio.onerror = () => orbRef.current?.setState("idle");
    const timer = window.setTimeout(() => {
      void audio.play().catch(() => orbRef.current?.setState("idle"));
    }, 360);
    return () => {
      window.clearTimeout(timer);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      if (audioRef.current === audio) audioRef.current = null;
      orbRef.current?.setState("idle");
    };
  }, [enabled, voiceSrc]);

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
