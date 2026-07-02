"use client";
import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import ContactPanel, { ContactCTA } from "./contact-panel";
import { useT, LangToggle } from "./i18n";
import { DS2Mark } from "./ds2-mark";
import SiteFooter from "./site-footer";
import { MobileMenu } from "./mobile-menu";

const ContactCtx = createContext<(draft?: string) => void>(() => {});
/** Open the shared contact panel from anywhere inside a PageChrome; pass a
 *  string to prefill the message (e.g. "I'm interested in Competitor Watch"). */
export const useOpenContact = () => useContext(ContactCtx);

/** Shared nav + footer + contact panel for the sub-pages (About, Portfolio).
 *  The homepage has its own chrome; this keeps the lighter pages consistent
 *  without touching it. Elements with class `reveal` fade up on scroll. */
export default function PageChrome({ children }: { children: ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const openContact = (draft?: string) => {
    if (draft) setChatDraft(draft);
    setChatOpen(true);
  };
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
    <ContactCtx.Provider value={openContact}>
      <nav className="top nav--solid">
        <div className="nav-inner">
          <Link href="/" className="nav-mark" aria-label={t.a11y.home}>
            <DS2Mark className="nav-mark-svg" />
          </Link>
          <div className="nav-right">
            <ul className="nav-links">
              <li><Link className="nav-roll" href="/about"><span data-text={t.nav.about}>{t.nav.about}</span></Link></li>
              <li><Link className="nav-roll" href="/tools"><span data-text={t.nav.tools}>{t.nav.tools}</span></Link></li>
              <li><Link className="nav-roll" href="/portfolio"><span data-text={t.nav.portfolio}>{t.nav.portfolio}</span></Link></li>
              <li><Link className="nav-roll" href="/blog"><span data-text={t.nav.blog}>{t.nav.blog}</span></Link></li>
            </ul>
            <LangToggle />
            <ContactCTA size="sm" label={t.cta.send} onOpen={() => openContact()} />
            <MobileMenu onContact={() => openContact()} />
          </div>
        </div>
      </nav>

      {children}

      <SiteFooter onContact={() => openContact()} />

      <ContactPanel open={chatOpen} onClose={() => setChatOpen(false)} initialDraft={chatDraft} />
    </ContactCtx.Provider>
  );
}
