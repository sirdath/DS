"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from "react";
import { LangToggle, useLang } from "../i18n";
import { assistantCopy, type AssistantField, type AssistantOption, type AssistantStep, type GoalKey } from "./assistant-data";
import { createAryaOrb, type AryaOrbHandle } from "./arya-orb";
import TeamSizeQuestion from "./team-size-question";
import "./assistant.css";

type Answers = Record<string, string | string[]>;
const EMAIL = "ds2consulting.contact@gmail.com";
const STORAGE = "ds2-project-brief-v2";
const DETAILS_LIMIT = 1500;

type ValidationCue = "one" | "two" | "three" | "required" | "email";

interface SpeechRecognitionEventLike extends Event {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: { transcript: string };
    };
  };
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

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

/** Loose sanity check, not a strict RFC validator — this only exists to catch
 *  someone typing plain text into a website field, e.g. "not-a-valid-url".
 *  Bare domains without a scheme ("acme.com") are accepted by assuming https. */
function looksLikeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return /\.[a-z]{2,}$/i.test(new URL(withScheme).hostname);
  } catch {
    return false;
  }
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
    const { exact } = step.slider;
    if (exact) {
      // Exact-count sliders report the number itself, so the review screen and
      // the emailed brief read "7 people" rather than a band label.
      const raw = Number(answers[step.id] ?? exact.defaultValue);
      const count = Math.max(exact.min, Math.min(exact.max, Math.round(raw) || exact.defaultValue));
      if (count >= exact.max) return `${exact.overflowLabel} ${exact.personPlural}`;
      return `${count} ${count === 1 ? exact.personSingular : exact.personPlural}`;
    }
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
  // Must start at the same value the server rendered ("dark"), or the button's
  // icon mismatches between SSR and the client's first paint — a real,
  // findable bug: it forced React's hydration-mismatch recovery, which also
  // broke the click handler on the next render. The actual background/colours
  // never depended on this; those are set by the layout's pre-hydration script
  // straight onto <html>, so they stay flash-free regardless. This just
  // corrects the toggle's own icon/aria-pressed once, right after mount.
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    if (document.documentElement.getAttribute("data-assistant-theme") === "light") setTheme("light");
  }, []);
  const toggleTheme = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
    const applyTheme = () => {
      setTheme((current) => {
        const next = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-assistant-theme", next);
        try { localStorage.setItem("ds2-assistant-theme", next); } catch { /* private mode */ }
        return next;
      });
    };
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // A screen-wide wipe expanding from the click point, using the View
    // Transitions API: it snapshots the page before/after applyTheme() runs,
    // then this animates only the "new" snapshot growing in as a circle, so
    // the switch reads as one continuous sweep rather than a hard cut.
    if (reduceMotion || typeof document.startViewTransition !== "function") {
      applyTheme();
      return;
    }
    const x = event.clientX;
    const y = event.clientY;
    const transition = document.startViewTransition(applyTheme);
    void transition.ready.then(() => {
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y),
      );
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 620, easing: "cubic-bezier(.32,.72,0,1)", pseudoElement: "::view-transition-new(root)" },
      );
    });
  }, []);
  const [furthestScreen, setFurthestScreen] = useState(0);
  const [progressDrag, setProgressDrag] = useState(0);
  const [validationCue, setValidationCue] = useState<{ type: ValidationCue; nonce: number } | null>(null);
  const progressDragStart = useRef<number | null>(null);
  const suppressProgressClick = useRef(false);

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
    const numbered = (step: Omit<AssistantStep, "eyebrow">, number: string, labelEn: string, labelEl: string): AssistantStep => ({
      ...step,
      eyebrow: `${number} · ${lang === "el" ? labelEl : labelEn}`,
    });
    return [
      c.goal as AssistantStep,
      branch.services as AssistantStep,
      diagnosis,
      outcomes,
      numbered(c.common.team as Omit<AssistantStep, "eyebrow">, "05", "The people", "Οι άνθρωποι"),
      numbered(c.common.timing as Omit<AssistantStep, "eyebrow">, "06", "The pace", "Ο ρυθμός"),
      numbered(c.common.budget as Omit<AssistantStep, "eyebrow">, "07", "The investment", "Η επένδυση"),
      numbered(c.common.business as Omit<AssistantStep, "eyebrow">, "08", "Your business", "Η επιχείρηση"),
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
  const completedThrough = isReview ? steps.length : Math.min(steps.length, Math.max(visibleStep, furthestScreen + 1));
  // percent stays keyed to furthest-ever-reached: jumping back from the
  // review screen to fix an earlier answer shouldn't make the bar look like
  // it lost progress. "remaining" is keyed to visibleStep instead — it's
  // read alongside the current step number, so it needs to agree with it
  // ("Step 1 of 10" next to "0 remaining" was the inconsistency).
  const percent = Math.round((completedThrough / steps.length) * 100);
  const remaining = isReview ? 0 : Math.max(0, steps.length - visibleStep);

  useEffect(() => {
    try { setAnswers(JSON.parse(localStorage.getItem(STORAGE) || "{}")); } catch { /* clean start */ }
    try { setVoiceOn(localStorage.getItem(`${STORAGE}-voice`) !== "off"); } catch { /* voice stays on */ }
    // Restoring answers alone meant a reload (or an accidental refresh)
    // silently bounced you back to step 1 — everything you'd typed was still
    // there, but you had to click back through steps you'd already answered
    // to see it. furthestScreen is restored alongside screen so the progress
    // bar's "never looks like it regressed" behaviour survives the reload too.
    try {
      const savedScreen = Number(localStorage.getItem(`${STORAGE}-screen`));
      if (Number.isInteger(savedScreen) && savedScreen > 0) setScreen(savedScreen);
    } catch { /* clean start */ }
    try {
      const savedFurthest = Number(localStorage.getItem(`${STORAGE}-furthest`));
      if (Number.isInteger(savedFurthest) && savedFurthest > 0) setFurthestScreen(savedFurthest);
    } catch { /* clean start */ }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE, JSON.stringify(answers)); }, [answers]);
  useEffect(() => { localStorage.setItem(`${STORAGE}-voice`, voiceOn ? "on" : "off"); }, [voiceOn]);
  useEffect(() => { localStorage.setItem(`${STORAGE}-screen`, String(screen)); }, [screen]);
  useEffect(() => { localStorage.setItem(`${STORAGE}-furthest`, String(furthestScreen)); }, [furthestScreen]);
  useEffect(() => {
    setError("");
    setValidationCue(null);
  }, [screen, lang]);
  useEffect(() => { if (screen > steps.length) setScreen(steps.length); }, [screen, steps.length]);

  const setAnswer = (id: string, value: string | string[]) => {
    setError("");
    setValidationCue(null);
    setAnswers((current) => ({ ...current, [id]: value }));
  };

  const moveTo = useCallback((nextScreen: number) => {
    const destination = Math.max(0, Math.min(steps.length, nextScreen));
    setFurthestScreen((current) => Math.max(current, destination));
    setScreen(destination);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [steps.length]);

  const finishProgressDrag = (clientX: number) => {
    if (progressDragStart.current === null) return;
    const distance = clientX - progressDragStart.current;
    progressDragStart.current = null;
    setProgressDrag(0);
    suppressProgressClick.current = Math.abs(distance) >= 28;
    if (!suppressProgressClick.current) return;
    if (distance > 0 && screen > 0) moveTo(screen - 1);
    if (distance < 0 && screen < furthestScreen) moveTo(screen + 1);
  };

  const chooseOption = (currentStep: AssistantStep, option: AssistantOption) => {
    setError("");
    setValidationCue(null);
    const values = valueList(answers[currentStep.id]);
    if (currentStep.type === "single") {
      const changed = answers[currentStep.id] !== option.value;
      if (changed && currentStep.id === "goal") setFurthestScreen(0);
      if (changed && currentStep.id === "diagnosis" && furthestScreen > screen) setFurthestScreen(screen);
      setAnswers((current) => {
        const clean: Answers = { ...current, [currentStep.id]: option.value };
        if (currentStep.id === "goal" && current.goal !== option.value) {
          ["services", "diagnosis", "outcomes", "details"].forEach((key) => delete clean[key]);
        }
        if (currentStep.id === "diagnosis" && current.diagnosis !== option.value) delete clean.outcomes;
        return clean;
      });
      // Single-select auto-advances — one tap moves the brief forward, so it
      // feels effortless to start and keep going. (Back arrow still lets you change.)
      window.setTimeout(() => moveTo(screen + 1), 300);
      return;
    }
    const nextValues = values.includes(option.value)
      ? values.filter((item) => item !== option.value)
      : [...values, option.value];
    if (!values.includes(option.value) && currentStep.type === "limit" && values.length >= (currentStep.limit || 3)) return;
    if (currentStep.id === "services" && furthestScreen > screen) {
      setFurthestScreen(screen);
      setAnswers((current) => {
        const clean: Answers = { ...current, services: nextValues };
        delete clean.diagnosis;
        delete clean.outcomes;
        return clean;
      });
      return;
    }
    if (values.includes(option.value)) return setAnswer(currentStep.id, nextValues);
    setAnswer(currentStep.id, nextValues);
  };

  const validationIssue = (): ValidationCue | null => {
    if (!step || step.optional || step.type === "slider") return null;
    if (["multi", "single", "limit"].includes(step.type) && !valueList(answers[step.id]).length) {
      if ((step.limit || 1) >= 3) return "three";
      if ((step.limit || 1) === 2) return "two";
      return "one";
    }
    if (step.fields) {
      if (step.fields.some((field) => field.required && !String(answers[field.id] || "").trim())) return "required";
      if (step.fields.some((field) => field.type === "url" && !looksLikeUrl(String(answers[field.id] || "")))) return "required";
      if (step.id === "contact" && !/^\S+@\S+\.\S+$/.test(String(answers.email || ""))) return "email";
    }
    return null;
  };

  // "required"/"email" get their own copy — telling someone staring at empty
  // text boxes to "choose an answer" reads like it was written for the
  // button-choice steps, because it was.
  const ERROR_COPY: Record<ValidationCue, string> = {
    one: c.ui.error, two: c.ui.error, three: c.ui.error,
    required: c.ui.errorFields, email: c.ui.errorEmail,
  };

  const next = () => {
    const issue = validationIssue();
    if (issue) {
      setError(ERROR_COPY[issue]);
      setValidationCue({ type: issue, nonce: Date.now() });
      return;
    }
    setError("");
    setValidationCue(null);
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
    setFurthestScreen(0);
    localStorage.removeItem(STORAGE);
    localStorage.removeItem(`${STORAGE}-screen`);
    localStorage.removeItem(`${STORAGE}-furthest`);
  };

  const voiceKey = isReview
    ? "review"
    : step?.id === "goal"
      ? "goal"
      : step && ["services", "diagnosis", "outcomes", "details"].includes(step.id)
        ? `${goalKey}-${step.id}`
        : step?.id || "goal";
  const voiceSrc = `/audio/arya/${lang}/${voiceKey}.mp3`;
  const validationVoiceSrc = validationCue ? `/audio/arya/${lang}/validation-${validationCue.type}.mp3` : undefined;

  return (
    <main className="assistant-shell">
      <div className="assistant-aurora" aria-hidden="true"><i /><i /><i /></div>
      <header className="assistant-nav">
        <Link href="/" className="assistant-brand" aria-label={c.ui.close}><img src="/logos/ds2-white.png" alt="DS2" /></Link>
        <div className="assistant-progress" aria-label={`${c.ui.progress}: ${percent}%`}>
          <div className="assistant-progress__copy"><span>{c.ui.step} {visibleStep} / {steps.length}</span><strong>{percent}% {c.ui.complete}</strong><small>{remaining} {c.ui.remaining}</small></div>
          <div
            className={`assistant-progress__track${progressDragStart.current !== null ? " is-dragging" : ""}`}
            style={{ "--progress-drag": `${progressDrag}px` } as CSSProperties}
            onPointerDown={(event) => {
              progressDragStart.current = event.clientX;
              suppressProgressClick.current = false;
            }}
            onPointerMove={(event) => {
              if (progressDragStart.current === null) return;
              setProgressDrag(Math.max(-48, Math.min(48, event.clientX - progressDragStart.current)));
            }}
            onPointerUp={(event) => finishProgressDrag(event.clientX)}
            onPointerCancel={() => {
              progressDragStart.current = null;
              setProgressDrag(0);
            }}
          >
            <b style={{ width: `${percent}%` }} />
            {steps.map((item, index) => {
              const isCurrent = !isReview && index === screen;
              const isVisited = isReview || index <= furthestScreen;
              const canVisit = isVisited && !isCurrent;
              return <button
                type="button"
                key={`${item.id}-${index}`}
                className={`${isVisited ? "is-done" : "is-locked"}${isCurrent ? " is-current" : ""}`}
                disabled={!canVisit}
                aria-label={`${c.ui.step} ${index + 1}: ${item.title}`}
                title={canVisit ? item.title : undefined}
                onClick={() => {
                  if (suppressProgressClick.current) {
                    suppressProgressClick.current = false;
                    return;
                  }
                  if (canVisit) moveTo(index);
                }}
              />;
            })}
          </div>
        </div>
        <div className="assistant-nav__actions"><button type="button" className={`assistant-theme is-${theme}`} onClick={toggleTheme} aria-pressed={theme === "light"} aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}><i className="assistant-theme__icon assistant-theme__icon--moon" aria-hidden="true" /><i className="assistant-theme__icon assistant-theme__icon--sun" aria-hidden="true" /></button>{lang === "el" ? <button type="button" className="assistant-voice is-unavailable" aria-disabled="true" title="Η φωνή της Arya δεν είναι ακόμη διαθέσιμη στα Ελληνικά — English voice model only, for now"><span aria-hidden="true">◖×</span>Φωνή μη διαθέσιμη</button> : <button type="button" className={`assistant-voice${voiceOn ? " is-on" : ""}`} onClick={() => setVoiceOn((current) => !current)} aria-pressed={voiceOn}><span aria-hidden="true">{voiceOn ? "◖))" : "◖×"}</span>{voiceOn ? "Arya on" : "Arya off"}</button>}<LangToggle /></div>
      </header>

      <section className="assistant-stage">
        <div className="assistant-screen" key={`${lang}-${screen}`}>
          {step && <div className={`assistant-question assistant-question--${step.type} assistant-question--${step.id}`}>
            <header>
              <p>{step.eyebrow}</p>
              <h1>{step.title}</h1>
              <span className="assistant-help">{step.help}</span>
            </header>

            <AryaGuide key={`${lang}-${screen}-${replay}`} voiceSrc={voiceSrc} cueSrc={validationVoiceSrc} cueNonce={validationCue?.nonce} lang={lang} enabled={voiceOn} onReplay={() => setReplay((value) => value + 1)} />

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

            {step.slider?.exact
              ? <TeamSizeQuestion exact={step.slider.exact} value={Number(answers[step.id] ?? step.slider.exact.defaultValue)} onChange={(value) => setAnswer(step.id, String(value))} hint={c.ui.sliderHint} />
              : step.slider && <SliderQuestion step={step} value={Number(answers[step.id] ?? step.slider.defaultValue)} onChange={(value) => setAnswer(step.id, String(value))} hint={c.ui.sliderHint} />}

            {step.type === "textarea" && <DetailsInput lang={lang} value={String(answers.details || "")} onChange={(value) => setAnswer("details", value)} placeholder={step.placeholder || ""} />}

            {step.type === "limit" && <p className="assistant-count"><span>{valueList(answers[step.id]).length}</span> / {step.limit} {c.ui.selected}</p>}
          </div>}

          {isReview && <div className="assistant-review">
            <header><p>{c.ui.reviewEyebrow}</p><h1>{c.ui.reviewTitle}</h1><span>{c.ui.reviewHelp}</span></header>
            <AryaGuide key={`${lang}-${screen}-${replay}`} voiceSrc={voiceSrc} lang={lang} enabled={voiceOn} onReplay={() => setReplay((value) => value + 1)} />
            <div className="assistant-review__grid">{summary.map(([label, value], index) => <article key={label}><span>{String(index + 1).padStart(2, "0")}</span><button type="button" onClick={() => moveTo(index)}>{lang === "el" ? "Αλλαγή" : "Edit"}</button><h2>{label}</h2><p>{value}</p></article>)}</div>
          </div>}
        </div>
      </section>

      {error && <p className="assistant-error" role="alert">{error}</p>}
      <footer className="assistant-controls">
        {screen > 0 && <button type="button" className="assistant-arrow assistant-arrow--back" onClick={() => moveTo(screen - 1)} aria-label={c.ui.back} title={c.ui.back}><span aria-hidden="true">←</span></button>}
        {!isReview && <button type="button" className="assistant-arrow assistant-next" onClick={next} aria-label={screen === steps.length - 1 ? c.ui.review : c.ui.next} title={screen === steps.length - 1 ? c.ui.review : c.ui.next}><span aria-hidden="true">→</span></button>}
        {isReview && <div className="assistant-finish"><button type="button" onClick={reset}>{c.ui.reset}</button><button type="button" className="assistant-next" onClick={send}>{c.ui.send}</button></div>}
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
  conversion: "target", leads: "chat",
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
      {kind === "rocket" && <><g className="icon-rocket"><path {...common} className="icon-main" d="M16.5 25.5 14 32l6.5-2.5M14.5 23.5 8 21l2.5 6.5M14.7 25.3c1.2-7.7 6.8-14 16.8-17.3-.4 10.5-6.6 16-14.2 17.8l-2.6-.5Z" /><circle {...common} className="icon-accent" cx="24.5" cy="15" r="3" /><path {...common} className="icon-flame" d="M14.5 27.5c-3 .5-5 2-6 5 3-.5 5-1.8 6.8-4.7" /></g></>}
      {kind === "target" && <><circle {...common} className="icon-main" cx="20" cy="20" r="12" /><circle {...common} className="icon-accent" cx="20" cy="20" r="6" /><circle className="icon-dot" cx="20" cy="20" r="2" /></>}
      {kind === "spark" && <><path {...common} className="icon-main icon-spark" d="M20 5c1 8 5 12 13 13-8 1-12 5-13 13-1-8-5-12-13-13 8-1 12-5 13-13Z" /><path {...common} className="icon-accent" d="M31 6c.4 3 2 4.6 5 5-3 .4-4.6 2-5 5-.4-3-2-4.6-5-5 3-.4 4.6-2 5-5Z" /></>}
    </svg>
  </span>;
}

function AryaGuide({
  voiceSrc,
  cueSrc,
  cueNonce,
  lang,
  enabled,
  onReplay,
}: {
  voiceSrc: string;
  cueSrc?: string;
  cueNonce?: number;
  lang: "en" | "el";
  enabled: boolean;
  onReplay: () => void;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<AryaOrbHandle | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    orbRef.current = createAryaOrb(mountRef.current);
    return () => orbRef.current?.destroy();
  }, []);

  // Arya's recorded/model voice has no Greek pack yet — see AGENTS/handoff
  // notes. Rather than fall back to a browser TTS voice or ship no voice at
  // all silently, output audio is suppressed outright while lang is "el": the
  // orb never claims to be speaking, and switching back to English resumes
  // normally from the user's persisted enabled/disabled preference untouched.
  const audioSuppressed = lang === "el";

  useEffect(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (!enabled || audioSuppressed || typeof window === "undefined") {
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
  }, [enabled, voiceSrc, audioSuppressed]);

  useEffect(() => {
    if (!enabled || audioSuppressed || !cueSrc || !cueNonce || typeof window === "undefined") return;
    audioRef.current?.pause();
    const audio = new Audio(cueSrc);
    audioRef.current = audio;
    audio.onplay = () => orbRef.current?.setState("speaking");
    audio.onended = () => orbRef.current?.setState("idle");
    audio.onerror = () => orbRef.current?.setState("idle");
    void audio.play().catch(() => orbRef.current?.setState("idle"));
    return () => {
      audio.pause();
      if (audioRef.current === audio) audioRef.current = null;
    };
  }, [cueNonce, cueSrc, enabled, audioSuppressed]);

  return <aside className="arya-guide">
    <button type="button" className="arya-orb" onClick={onReplay} aria-label={lang === "el" ? "Επανάληψη ερώτησης" : "Repeat Arya’s question"} title={lang === "el" ? "Πατήστε για να ακούσετε την Arya" : "Click to hear Arya"}><span ref={mountRef} /></button>
  </aside>;
}

function SliderQuestion({ step, value, onChange, hint }: { step: AssistantStep; value: number; onChange: (value: number) => void; hint: string }) {
  const slider = step.slider!;
  const progress = ((value - slider.min) / Math.max(1, slider.max - slider.min)) * 100;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);

  // Same shape as the team crowd's fix: one wheel listener over the whole
  // component (visual + native input + ticks), not just the thin range
  // track, so scrolling over the constellation (step 6) or the investment
  // columns (step 7) also steps the value — previously only the input
  // itself, a few pixels tall, ever received wheel events.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let accumulated = 0;
    let lastStep = 0;
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      accumulated += delta;
      const threshold = event.deltaMode === 1 ? 1 : 12;
      const now = performance.now();
      if (Math.abs(accumulated) >= threshold && now - lastStep > 24) {
        const next = Number(rangeRef.current?.value ?? value) + Math.sign(accumulated);
        onChange(Math.max(slider.min, Math.min(slider.max, next)));
        accumulated = 0;
        lastStep = now;
      }
    };
    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => surface.removeEventListener("wheel", onWheel);
  }, [value, slider.min, slider.max, onChange]);

  // Drag/swipe on the scene visual itself, scoped there so it never fights
  // the native input's own thumb-drag or the tick buttons' clicks.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    let dragging = false;
    let accumulated = 0;
    let lastStep = 0;
    const STEP_PX = 26;
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      accumulated = 0;
      scene.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      accumulated += event.movementX;
      const now = performance.now();
      if (Math.abs(accumulated) >= STEP_PX && now - lastStep > 24) {
        const steps = Math.trunc(accumulated / STEP_PX);
        const next = Number(rangeRef.current?.value ?? value) + steps;
        onChange(Math.max(slider.min, Math.min(slider.max, next)));
        accumulated -= steps * STEP_PX;
        lastStep = now;
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      accumulated = 0;
      if (scene.hasPointerCapture(event.pointerId)) scene.releasePointerCapture(event.pointerId);
    };
    scene.addEventListener("pointerdown", onPointerDown);
    scene.addEventListener("pointermove", onPointerMove);
    scene.addEventListener("pointerup", onPointerUp);
    scene.addEventListener("pointercancel", onPointerUp);
    return () => {
      scene.removeEventListener("pointerdown", onPointerDown);
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerup", onPointerUp);
      scene.removeEventListener("pointercancel", onPointerUp);
    };
  }, [value, slider.min, slider.max, onChange]);

  return <div className="assistant-slider" style={{ "--range-progress": `${progress}%` } as CSSProperties} ref={surfaceRef}>
    <div className={`assistant-slider__scene assistant-slider__scene--${slider.scene}`} ref={sceneRef}>
      {slider.scene === "team" && <TeamScene value={value} />}
      {slider.scene === "budget" && <BudgetScene value={value} layers={slider.sceneLayers} />}
      {slider.scene === "timing" && <TimingScene value={value} labels={slider.labels} />}
      <div className="assistant-slider__reading"><span>{slider.labels[value]}</span><strong>{slider.values[value]}</strong></div>
    </div>
    <label><span>{hint}</span><input ref={rangeRef} type="range" min={slider.min} max={slider.max} step="1" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-valuetext={slider.values[value]} /></label>
    <div className="assistant-slider__tiers" role="group">
      {slider.values.map((_, index) => (
        <button
          type="button"
          key={index}
          aria-pressed={index === value}
          onClick={() => {
            onChange(index);
            rangeRef.current?.focus({ preventScroll: true });
          }}
        >
          {slider.labels[index]}
        </button>
      ))}
    </div>
  </div>;
}

function TeamScene({ value }: { value: number }) {
  const active = [1, 3, 6, 10, 15][value] || 1;
  return <div className="scene-team" data-level={value} aria-hidden="true">
    <div className="scene-team__room"><i /><i /><i /><b /></div>
    <div className="scene-team__table" />
    <div className="scene-team__people">{Array.from({ length: 15 }, (_, index) => <span className={index < active ? "is-active" : ""} style={{ "--person": index } as CSSProperties} key={index}><i /></span>)}</div>
  </div>;
}

const INVEST_LAYERS_FALLBACK = ["Discovery", "Foundation", "Experience", "Automation", "Scale", "Stewardship"] as const;

/** Investment scene: the approved hybrid of the delivery-layers and build-horizon
 *  prototypes. The stack gives the readable "what work this buys" structure; the
 *  per-layer fill and the milestone ruler give the horizon progression, so a wider
 *  range reads as more layers AND more of each layer, never as more money.
 *  "Not sure yet" is a deliberate survey state, not an empty one. */
function BudgetScene({ value, layers }: { value: number; layers?: readonly string[] }) {
  const names = layers && layers.length ? layers : INVEST_LAYERS_FALLBACK;
  const exploring = value === 0;
  return <div className="scene-invest" data-level={value} aria-hidden="true">
    <div className="scene-invest__cols">
      {names.map((name, index) => {
        // Nearest layers are fully in scope; the newest one is partially filled,
        // which is what makes the range read as progression rather than a step.
        const fill = exploring ? (index === 0 ? 34 : 0) : Math.max(0, Math.min(100, (value - index + 1) * 55));
        const state = exploring ? (index === 0 ? " is-explore" : "") : index <= value ? " is-on" : "";
        return <div className={`scene-invest__col${state}`} key={name} style={{ "--layer": index } as CSSProperties}>
          <span className="scene-invest__meter"><i style={{ height: `${fill}%` }} /></span>
          <em>{name}</em>
        </div>;
      })}
    </div>
  </div>;
}

/* Approved Step 6 visual: the depth-field constellation (prototype c01). Stars
   grow toward the nearest deadline, the traversed route lights, a soft bloom and
   halo mark the choice, and a spark travels from the first star to the selected
   one, slowing as the timeline lengthens. */
const ROUTE_POINTS = [[54, 168], [168, 104], [282, 146], [396, 66], [506, 118]] as const;
const ROUTE_RADII = [3.2, 4.2, 5.4, 6.8, 8.6] as const;
const ROUTE_SPARK_SECONDS = [5.6, 4.6, 3.6, 2.8, 2.0] as const;

function TimingScene({ value, labels }: { value: number; labels: readonly string[] }) {
  const sparkRef = useRef<SVGCircleElement>(null);
  const index = Math.max(0, Math.min(ROUTE_POINTS.length - 1, value));

  // Cumulative segment lengths so the spark lands exactly on a star rather than
  // at a fraction of the whole polyline, whose segments are not equal length.
  const { cumulative, pointAt } = useMemo(() => {
    const cum = [0];
    for (let i = 0; i < ROUTE_POINTS.length - 1; i += 1) {
      const [ax, ay] = ROUTE_POINTS[i]!;
      const [bx, by] = ROUTE_POINTS[i + 1]!;
      cum.push(cum[i]! + Math.hypot(bx - ax, by - ay));
    }
    const at = (distance: number) => {
      if (distance <= 0) return { x: ROUTE_POINTS[0]![0], y: ROUTE_POINTS[0]![1] };
      for (let i = 0; i < ROUTE_POINTS.length - 1; i += 1) {
        if (distance <= cum[i + 1]!) {
          const t = (distance - cum[i]!) / (cum[i + 1]! - cum[i]!);
          const [ax, ay] = ROUTE_POINTS[i]!;
          const [bx, by] = ROUTE_POINTS[i + 1]!;
          return { x: ax + (bx - ax) * t, y: ay + (by - ay) * t };
        }
      }
      const last = ROUTE_POINTS[ROUTE_POINTS.length - 1]!;
      return { x: last[0], y: last[1] };
    };
    return { cumulative: cum, pointAt: at };
  }, []);

  useEffect(() => {
    const spark = sparkRef.current;
    if (!spark) return;
    const end = cumulative[index] ?? 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const parked = pointAt(end);
      spark.setAttribute("cx", String(parked.x));
      spark.setAttribute("cy", String(parked.y));
      spark.style.opacity = index > 0 ? "1" : "0";
      return;
    }
    if (end <= 0) { spark.style.opacity = "0"; return; }
    const duration = (ROUTE_SPARK_SECONDS[index] ?? 4.6) * 1000;
    let start = 0;
    let raf = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const phase = ((now - start) % duration) / duration;
      const at = pointAt(end * phase);
      spark.setAttribute("cx", at.x.toFixed(2));
      spark.setAttribute("cy", at.y.toFixed(2));
      spark.style.opacity = String(0.35 + 0.65 * Math.sin(phase * Math.PI));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [index, cumulative, pointAt]);

  const here = ROUTE_POINTS[index]!;
  return <div className="scene-route" data-level={index} aria-hidden="true">
    <svg viewBox="0 0 560 224" preserveAspectRatio="xMidYMid meet">
      <defs><radialGradient id="ds2-route-bloom">
        <stop offset="0" stopColor="rgba(141,203,255,.18)" /><stop offset="1" stopColor="rgba(141,203,255,0)" />
      </radialGradient></defs>
      <g className="scene-route__dust">
        {Array.from({ length: 54 }, (_, i) => <circle key={i} cx={((i * 97) % 548) + 6} cy={((i * 53) % 212) + 6} r={i % 4 === 0 ? 1.4 : 0.75} />)}
      </g>
      <circle className="scene-route__bloom" cx={here[0]} cy={here[1]} r={58} fill="url(#ds2-route-bloom)" />
      <g className="scene-route__links">
        {ROUTE_POINTS.slice(0, -1).map((point, i) => <line key={i} x1={point[0]} y1={point[1]} x2={ROUTE_POINTS[i + 1]![0]} y2={ROUTE_POINTS[i + 1]![1]} className={i < index ? "is-on" : ""} />)}
      </g>
      <circle className="scene-route__halo" cx={here[0]} cy={here[1]} r={(ROUTE_RADII[index] ?? 5) + 13} />
      <g className="scene-route__stars">
        {ROUTE_POINTS.map((point, i) => <circle key={i} cx={point[0]} cy={point[1]} r={i === index ? (ROUTE_RADII[i] ?? 5) + 2.6 : ROUTE_RADII[i] ?? 5} className={`${i <= index ? "is-on" : ""}${i === index ? " is-here" : ""}`} style={{ opacity: i <= index ? 1 : 0.42 }} />)}
      </g>
      <g className="scene-route__caps">
        {ROUTE_POINTS.map((point, i) => <text key={i} x={point[0]} y={point[1] - ((ROUTE_RADII[i] ?? 5) + 22)} textAnchor="middle" className={i === index ? "is-here" : ""} style={{ opacity: i === index ? 1 : 0.55 }}>{labels[i] ?? ""}</text>)}
      </g>
      <circle className="scene-route__spark" ref={sparkRef} r={4.2} />
    </svg>
  </div>;
}

function Field({ field, value, onChange, ui }: { field: AssistantField; value: string; onChange: (value: string) => void; ui: { required: string; optional: string; choose: string } }) {
  // A filled required field switches from the pulsing "Required" pill to a
  // settled tick, so the form visibly tells you what is still outstanding.
  const filled = Boolean(String(value || "").trim());
  return <label className={field.required ? (filled ? "is-required is-filled" : "is-required") : "is-optional"}>
    <span>
      {field.label}
      {field.required
        ? <small className="assistant-req" data-filled={filled ? "1" : undefined}>
            <i aria-hidden="true" />{filled ? "✓" : ui.required}
          </small>
        : <small className="assistant-opt">{ui.optional}</small>}
    </span>
    {field.type === "select"
      ? <select required={field.required} value={value} onChange={(event) => onChange(event.target.value)}><option value="">{ui.choose}</option>{field.options?.map((option) => <option key={option}>{option}</option>)}</select>
      : <input type={field.type} required={field.required} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={field.id === "email" ? "email" : field.id === "name" ? "name" : "off"} />}
  </label>;
}

function DetailsInput({ lang, value, onChange, placeholder }: { lang: "en" | "el"; value: string; onChange: (value: string) => void; placeholder: string }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const browserWindow = typeof window === "undefined"
    ? undefined
    : window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  const supported = Boolean(browserWindow?.SpeechRecognition || browserWindow?.webkitSpeechRecognition);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const toggleDictation = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const Recognition = browserWindow?.SpeechRecognition || browserWindow?.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang === "el" ? "el-GR" : "en-US";
    const startingValue = value.trim();
    recognition.onresult = (event) => {
      let transcript = "";
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        const phrase = result?.[0]?.transcript;
        if (phrase) transcript += phrase;
      }
      onChange(`${startingValue}${startingValue && transcript ? " " : ""}${transcript}`.slice(0, DETAILS_LIMIT));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  return <label className="assistant-textarea">
    <span className="assistant-textarea__meta">
      <span>{lang === "el" ? "Προαιρετικό — γράψτε ή μιλήστε ελεύθερα" : "Optional — type or speak freely"}</span>
      <span>{value.length} / {DETAILS_LIMIT}</span>
    </span>
    <textarea maxLength={DETAILS_LIMIT} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    <button type="button" className={`assistant-dictate${listening ? " is-listening" : ""}`} onClick={toggleDictation} disabled={!supported} title={!supported ? (lang === "el" ? "Η υπαγόρευση δεν υποστηρίζεται σε αυτόν τον browser" : "Dictation is not supported in this browser") : undefined}>
      <span aria-hidden="true"><i /></span>
      {listening ? (lang === "el" ? "Ακούω…" : "Listening…") : (lang === "el" ? "Υπαγόρευση" : "Talk instead")}
    </button>
  </label>;
}
