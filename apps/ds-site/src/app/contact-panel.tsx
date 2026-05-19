"use client";
import { useEffect, useRef, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";
type Thread = { id: number; sig: string };

function makeId(): string {
  // crypto.randomUUID only exists in secure contexts (https / localhost).
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
  const sessionId = useRef<string>("");
  const thread = useRef<Thread | null>(null);
  const hp = useRef<HTMLInputElement>(null); // honeypot (named "website" in the DOM)
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  if (open && !sessionId.current) sessionId.current = makeId();

  const locked = sent.length > 0;

  // Visible by default via CSS; GSAP only adds polish, never gates visibility.
  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [sent, status]);

  if (!open) return null;

  async function send() {
    const n = name.trim();
    const msg = draft.trim();
    if (!n) {
      setError("Add your name first.");
      return;
    }
    if (!msg) {
      setError("Write a message first.");
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
          email: email.trim(),
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
        setError(data.error || "Something went wrong. Try again.");
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
      setError("Couldn't reach us. Check your connection and retry.");
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div
      className="cpanel-overlay"
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cpanel" ref={cardRef} role="dialog" aria-modal="true" aria-label="Message DS2">
        <div className="cpanel-bar">
          <div className="cpanel-lights"><span /><span /><span /></div>
          <div className="cpanel-bar-title">Message DS2</div>
          <button type="button" className="cpanel-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>

        <div className="cpanel-body" ref={scrollRef}>
          <div className="cpanel-intro">
            {locked ? (
              <>Talking to <strong>{name}</strong>{company ? <> · {company}</> : null}{email ? <> · {email}</> : null}. We read every message.</>
            ) : (
              <>No forms, no login. Tell us what you{"’"}re trying to do and it lands straight with the two of us.</>
            )}
          </div>

          {!locked && (
            <div className="cpanel-fields">
              <input
                ref={firstFieldRef}
                className="cpanel-input"
                placeholder="Your name"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="cpanel-fields-row">
                <input
                  className="cpanel-input"
                  placeholder="Company (optional)"
                  value={company}
                  maxLength={100}
                  onChange={(e) => setCompany(e.target.value)}
                />
                <input
                  className="cpanel-input"
                  placeholder="Where you're based (optional)"
                  value={country}
                  maxLength={64}
                  onChange={(e) => setCountry(e.target.value)}
                />
              </div>
              <input
                className="cpanel-input"
                placeholder="Email (optional, so we can reply)"
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
            <div className="cpanel-ack">
              Delivered to DS2{email ? " · we’ll reply by email" : " · add an email above if you’d like a reply"}.
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
            placeholder={locked ? "Add another message…" : "What are you trying to build?"}
            value={draft}
            maxLength={2000}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button type="button" className="cpanel-send" onClick={() => void send()} disabled={status === "sending"}>
            {status === "sending" ? "Sending…" : "Send"}
            <span className="cpanel-send-arrow" aria-hidden="true">→</span>
          </button>
        </div>

        <div className="cpanel-foot">
          <span className={`cpanel-dot${status === "error" ? " err" : ""}`} />
          <span>
            {error
              ? error
              : status === "sent"
                ? "Sent · Athens / London"
                : "Athens / London · usually same-day"}
          </span>
        </div>
      </div>
    </div>
  );
}
