"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "./i18n";

type Status = "idle" | "sending" | "sent" | "error";
type Thread = { id: number; sig: string };

function makeId(): string {
  // crypto.randomUUID only exists in secure contexts (https / localhost).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** The one call-to-action used everywhere on the site — opens the contact panel. */
export function ContactCTA({
  onOpen,
  label = "Send a message",
  size,
  className = "",
}: {
  onOpen: () => void;
  label?: string;
  size?: "sm";
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`cta${size === "sm" ? " cta--sm" : ""}${className ? ` ${className}` : ""}`}
      onClick={onOpen}
    >
      {label}
      <span className="cta__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 2 11 13" />
          <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
        </svg>
      </span>
    </button>
  );
}

export default function ContactPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const sessionId = useRef<string>("");
  const thread = useRef<Thread | null>(null);
  const hp = useRef<HTMLInputElement>(null); // honeypot (named "website" in the DOM)
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const P = useT().panel;

  if (open && !sessionId.current) sessionId.current = makeId();

  const locked = sent.length > 0;

  // Visible by default via CSS; GSAP only adds polish, never gates visibility.
  useEffect(() => {
    if (!open || minimized) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstFieldRef.current?.focus(), 120);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKey);

    let killed = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      import("gsap")
        .then(({ default: gsap }) => {
          if (killed || !overlayRef.current || !cardRef.current) return;
          gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: "power2.out" });
          gsap.fromTo(
            cardRef.current,
            { opacity: 0, y: 24, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: "power3.out" }
          );
        })
        .catch(() => {
          /* gsap optional — panel is already visible */
        });
    }

    return () => {
      killed = true;
      window.clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, minimized]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [sent, status]);

  if (!open) return null;

  async function send() {
    const n = name.trim();
    const em = email.trim();
    const msg = draft.trim();
    if (!n) {
      setError(P.errName);
      return;
    }
    if (!em) {
      setError(P.errEmail);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError(P.errEmailInvalid);
      return;
    }
    if (!msg) {
      setError(P.errMsg);
      return;
    }
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact/", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: n,
          email: em,
          message: msg,
          company: company.trim(),
          country: country.trim(),
          sessionId: sessionId.current,
          first: sent.length === 0,
          threadId: thread.current?.id,
          threadSig: thread.current?.sig,
          website: hp.current?.value ?? "",
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        threadId?: number;
        threadSig?: string;
      };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || P.errGeneric);
        return;
      }
      if (typeof data.threadId === "number" && data.threadSig) {
        thread.current = { id: data.threadId, sig: data.threadSig };
      }
      setSent((s) => [...s, msg]);
      setDraft("");
      setStatus("sent");
    } catch {
      setStatus("error");
      setError(P.errNetwork);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send();
    }
  }

  if (minimized) {
    return (
      <button type="button" className="cpanel-tab" onClick={() => setMinimized(false)} aria-label="Reopen your message to DS2">
        <span className="cpanel-tab-dot" />
        {P.tab}
      </button>
    );
  }

  return (
    <div
      className={`cpanel-overlay${maximized ? " cpanel-overlay--max" : ""}`}
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !maximized) onClose();
      }}
    >
      {maximized && (
        <div className="cpanel-logo-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/ds2-black.png" alt="DS2" />
        </div>
      )}
      <div
        className={`cpanel${maximized ? " cpanel--max" : ""}`}
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="Message DS2"
      >
        <div className="cpanel-bar">
          <div className="cpanel-lights">
            <button type="button" className="cpl cpl--red" aria-label="Close" title="Close" onClick={onClose} />
            <button
              type="button"
              className="cpl cpl--yellow"
              aria-label="Minimise"
              title="Minimise"
              onClick={() => setMinimized(true)}
            />
            <button
              type="button"
              className="cpl cpl--green"
              aria-label={maximized ? "Restore" : "Maximise"}
              title={maximized ? "Restore" : "Maximise"}
              onClick={() => setMaximized((m) => !m)}
            />
          </div>
          <div className="cpanel-bar-title">{P.title}</div>
          <button type="button" className="cpanel-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className="cpanel-body" ref={scrollRef}>
          {!maximized && (
            <div className="cpanel-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logos/ds2-black.png" alt="DS2" />
            </div>
          )}
          <div className="cpanel-intro">
            {locked ? (
              <>{P.introLockedPrefix}<strong>{name}</strong>{company ? <> · {company}</> : null}{email ? <> · {email}</> : null}{P.introLockedSuffix}</>
            ) : (
              <>{P.introUnlocked}</>
            )}
          </div>

          {!locked && (
            <div className="cpanel-fields">
              <input
                ref={firstFieldRef}
                className="cpanel-input"
                placeholder={P.phName}
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="cpanel-fields-row">
                <input
                  className="cpanel-input"
                  placeholder={P.phCompany}
                  value={company}
                  maxLength={100}
                  onChange={(e) => setCompany(e.target.value)}
                />
                <input
                  className="cpanel-input"
                  placeholder={P.phCountry}
                  value={country}
                  maxLength={64}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <input
                className="cpanel-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-required="true"
                placeholder={P.phEmail}
                value={email}
                maxLength={160}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          {sent.map((m, i) => (
            <div key={i} className="cpanel-bubble">{m}</div>
          ))}

          {locked && status === "sent" && (
            <div className="cpanel-ack" role="status" aria-live="polite">
              <span className="cpanel-ack-check" aria-hidden="true">✓</span>
              <span>{P.ackBase}{email ? P.ackWithEmail : P.ackNoEmail}.</span>
            </div>
          )}
        </div>

        {/* honeypot — off-screen; bots fill it, humans don't */}
        <input
          ref={hp}
          name="website"
          className="cpanel-hp"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <div className="cpanel-compose">
          <textarea
            className="cpanel-textarea"
            placeholder={locked ? P.composeLocked : P.composeUnlocked}
            value={draft}
            maxLength={2000}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="cpanel-send" onClick={() => void send()} disabled={status === "sending"}>
            {status === "sending" ? P.sending : P.send}
            <span className="cpanel-send-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div className="cpanel-foot">
          <span className={`cpanel-dot${status === "error" ? " err" : ""}`} />
          <span>
            {error
              ? error
              : status === "sent"
                ? P.footSent
                : P.footIdle}
          </span>
        </div>
      </div>
    </div>
  );
}
