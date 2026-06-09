"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useT, LangToggle } from "./i18n";
import { ContactCTA } from "./contact-panel";
import { DS2Mark } from "./ds2-mark";

/** Mobile-only nav: a hamburger that opens a full-screen sheet with the primary
 *  links, language toggle and contact CTA. The sheet is portalled to <body> so
 *  its `position: fixed` resolves against the viewport (the nav bar's
 *  backdrop-filter would otherwise become its containing block and clip it).
 *  Links reveal in a soft stagger. Hidden on desktop, where the inline nav shows. */
export function MobileMenu({ onContact }: { onContact: () => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Lock body scroll + close on Escape while the sheet is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  const links = [
    { href: "/", label: t.footer.home },
    { href: "/about", label: t.nav.about },
    { href: "/portfolio", label: t.nav.portfolio },
  ];

  const sheet = (
    <div
      className={`nav-sheet${open ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
    >
      <div className="nav-sheet__bar">
        <Link href="/" className="nav-sheet__mark" aria-label={t.a11y.home} onClick={close}>
          <DS2Mark className="nav-mark-svg" />
        </Link>
        <button type="button" className="nav-sheet__close" aria-label={t.a11y.closeMenu} onClick={close}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="nav-sheet__inner">
        <span className="nav-sheet__eyebrow">{t.footer.navLabel}</span>

        <nav className="nav-sheet__links" aria-label={t.footer.navLabel}>
          {links.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              className="nav-sheet__link"
              onClick={close}
              style={{ transitionDelay: open ? `${110 + i * 60}ms` : "0ms" }}
            >
              <span className="nav-sheet__num">{`0${i + 1}`}</span>
              <span className="nav-sheet__label">{l.label}</span>
              <span className="nav-sheet__arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M9 7h8v8" />
                </svg>
              </span>
            </Link>
          ))}
        </nav>

        <div
          className="nav-sheet__foot"
          style={{ transitionDelay: open ? `${110 + links.length * 60}ms` : "0ms" }}
        >
          <p className="nav-sheet__cue">{t.footer.headline}</p>
          <ContactCTA
            className="nav-sheet__cta"
            label={t.cta.send}
            onOpen={() => { close(); onContact(); }}
          />
          <div className="nav-sheet__meta">
            <LangToggle />
            <span className="nav-sheet__place">{t.footer.locations}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="nav-mobile">
      <button
        type="button"
        className={`nav-burger${open ? " is-open" : ""}`}
        aria-label={open ? t.a11y.closeMenu : t.a11y.openMenu}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span /><span /><span />
      </button>

      {mounted ? createPortal(sheet, document.body) : null}
    </div>
  );
}
