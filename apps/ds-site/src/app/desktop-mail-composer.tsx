"use client";

import { useEffect, useRef } from "react";
import { useLang, useT } from "./i18n";
import s from "./desktop-portal.module.css";

/**
 * The Mail window inside the DS2 desktop: a macOS compose sheet that types its
 * own subject and body out character by character, then hands off to the real
 * contact flow. Split out of desktop-canvas.tsx because the typewriter effect
 * is a self-contained concern (its own effect, its own escaping and caret
 * handling) that has nothing to do with the window manager around it.
 */
export default function DesktopMailComposer({ onContact }: { onContact: () => void }) {
  const { lang } = useLang();
  const c = useT().contact;
  const subjectRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const subject = subjectRef.current;
    const body = bodyRef.current;
    if (!subject || !body) return;
    let cancelled = false;
    let timer = 0;
    subject.innerHTML = "";
    body.innerHTML = "";

    const escapeHTML = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const setHTML = (element: Element, value: string, caret = false) => {
      const html = value
        .split(/(<\/?hl>)/)
        .map((part) => part === "<hl>" ? '<span class="hl">' : part === "</hl>" ? "</span>" : escapeHTML(part))
        .join("");
      element.innerHTML = `${html}${caret ? '<span class="caret"></span>' : ""}`;
    };
    const typeInto = async (element: Element, value: string, speed: number) => {
      let output = "";
      for (let index = 0; index < value.length; index += 1) {
        if (cancelled) return;
        const remaining = value.slice(index);
        if (remaining.startsWith("<hl>")) { output += "<hl>"; index += 3; continue; }
        if (remaining.startsWith("</hl>")) { output += "</hl>"; index += 4; continue; }
        const character = value[index] ?? "";
        output += character;
        setHTML(element, output, true);
        let delay = speed + Math.random() * 6;
        if (character === "," || character === "." || character === "?") delay += 34;
        if (character === " ") delay = speed * .5;
        await new Promise((resolve) => window.setTimeout(resolve, delay));
      }
      setHTML(element, output, true);
    };

    const start = async () => {
      if (statusRef.current) statusRef.current.textContent = c.statusDrafting;
      await typeInto(subject, c.draftSubject, 9);
      if (cancelled) return;
      setHTML(subject, c.draftSubject);
      let previous: HTMLParagraphElement | null = null;
      for (const paragraph of c.draftBody) {
        if (!paragraph || cancelled) continue;
        if (previous) previous.innerHTML = previous.innerHTML.replace(/<span class="caret"><\/span>/, "");
        const paragraphElement = document.createElement("p");
        body.appendChild(paragraphElement);
        await typeInto(paragraphElement, paragraph, 6);
        previous = paragraphElement;
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      if (!cancelled && statusRef.current) statusRef.current.textContent = c.statusReady;
    };

    timer = window.setTimeout(() => { void start(); }, 260);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [c]);

  return (
    <div className={s.mailComposer}>
      <div className="compose-toolbar">
        <span className="toolbar-btn" title={c.tools.attach}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8L13.7 4.7a3.5 3.5 0 0 1 5 5L9.9 18.5a1.5 1.5 0 0 1-2.1-2.1L16 8.2" /></svg></span>
        <span className="toolbar-btn" title={c.tools.format}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z" /></svg></span>
        <span className="toolbar-btn" title={c.tools.image}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9.5" r="1.5" /><path d="M21 15l-5-5L5 20" /></svg></span>
        <span className="toolbar-divider" />
        <span className="toolbar-btn" title={c.tools.sign}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17c4-1 6-9 9-9s4 8 9 9" /><path d="M3 21h18" /></svg></span>
        <span className="toolbar-btn" title={c.tools.stationery}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 13h6M9 17h4" /></svg></span>
        <span className={s.toolbarSpacer} />
        <button type="button" className="toolbar-btn" title={c.tools.send} onClick={onContact} aria-label={c.tools.send}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13" /><path d="m22 2-7 20-4-9-9-4 20-7Z" /></svg></button>
      </div>
      <div className="compose-headers">
        <div className="row"><span className="label">{c.from}</span><span className="value">you@yourcompany.com</span></div>
        <div className="row"><span className="label">{c.to}</span><span className="value"><span className="pill">ds2consulting.contact@gmail.com</span></span></div>
        <div className="row"><span className="label">{c.subject}</span><span className="value" ref={subjectRef} /></div>
      </div>
      <div className="compose-body" ref={bodyRef} />
      <div className="compose-footer">
        <div className="compose-foot-meta"><span className="dot" /><span ref={statusRef} aria-live="polite">{c.statusDrafting}</span></div>
        <button type="button" className={s.mailSend} onClick={onContact}>
          {lang === "el" ? "Γράψτε μας" : "Write to DS2"}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></svg>
        </button>
      </div>
    </div>
  );
}
