"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import ContactPanel, { ContactCTA } from "./contact-panel";
import { useT, LangToggle } from "./i18n";
import { DS2Mark } from "./ds2-mark";

const ContactCtx = createContext<() => void>(() => {});
/** Open the shared contact panel from anywhere inside a PageChrome. */
export const useOpenContact = () => useContext(ContactCtx);

/** Shared nav + footer + contact panel for the sub-pages (About, Portfolio).
 *  The homepage has its own chrome; this keeps the lighter pages consistent
 *  without touching it. Elements with class `reveal` fade up on scroll. */
export default function PageChrome({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const t = useT();

  useEffect(() => {
    let cancelled = false;
    const disposers: Array<() => void> = [];
    (async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
      els.forEach((el) => {
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () =>
            gsap.fromTo(
              el,
              { autoAlpha: 0, y: 22 },
              { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }
            ),
        });
        disposers.push(() => st.kill());
      });
    })();
    return () => {
      cancelled = true;
      disposers.forEach((d) => d());
    };
  }, []);

  return (
    <ContactCtx.Provider value={() => setChatOpen(true)}>
      <nav className="top">
        <div className="nav-inner">
          <Link href="/" className="nav-mark" aria-label="DS2 — home">
            <DS2Mark className="nav-mark-svg" />
          </Link>
          <div className="nav-right">
            <ul className="nav-links">
              <li><Link href="/portfolio">{t.nav.portfolio}</Link></li>
              <li><Link href="/about">{t.nav.about}</Link></li>
            </ul>
            <LangToggle />
            <ContactCTA size="sm" label={t.cta.send} onOpen={() => setChatOpen(true)} />
          </div>
        </div>
      </nav>

      {children}

      <footer>
        <div>{t.footer.copyright}</div>
        <ul className="links">
          <li><Link href="/about">{t.footer.about}</Link></li>
          <li><Link href="/portfolio">{t.footer.portfolio}</Link></li>
          <li><Link href="/#services">{t.footer.services}</Link></li>
        </ul>
      </footer>

      <ContactPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </ContactCtx.Provider>
  );
}
