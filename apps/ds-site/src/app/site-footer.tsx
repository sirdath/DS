"use client";
import Link from "next/link";
import { useT } from "./i18n";
import { DS2Mark } from "./ds2-mark";
import { ContactCTA } from "./contact-panel";

/** Reimagined footer: a big brand statement, a slowly self-rotating DS2 mark
 *  (CSS 3D coin-flip — double-sided so the wordmark reads on both faces),
 *  a navigation column, and a "get in touch" column. Shared by the home page
 *  and the sub-page chrome. */
export default function SiteFooter({ onContact }: { onContact: () => void }) {
  const t = useT();
  return (
    <footer data-surface="ink" className="site-footer">
      <div className="wrap sf-grid">
        <div className="sf-lead">
          <div className="sf-spin" aria-hidden="true">
            <div className="sf-spin__inner">
              <DS2Mark className="sf-spin__face sf-spin__front" />
              <DS2Mark className="sf-spin__face sf-spin__back" />
            </div>
          </div>
        </div>

        <nav className="sf-col" aria-label={t.footer.navLabel}>
          <div className="sf-label">{t.footer.navLabel}</div>
          <Link className="sf-link" href="/#top">{t.footer.home}</Link>
          <Link className="sf-link" href="/#services">{t.footer.services}</Link>
          <Link className="sf-link" href="/portfolio">{t.footer.portfolio}</Link>
          <Link className="sf-link" href="/about">{t.footer.about}</Link>
        </nav>

        <div className="sf-col sf-reach">
          <div className="sf-label">{t.footer.reachLabel}</div>
          <a className="sf-email" href={`mailto:${t.footer.email}`}>{t.footer.email}</a>
          <div className="sf-label sf-based">{t.footer.basedLabel}</div>
          <div className="sf-locations">{t.footer.locations}</div>
          <ContactCTA size="sm" label={t.cta.send} onOpen={onContact} className="sf-cta" />
        </div>
      </div>
      <div className="wrap sf-bottom">{t.footer.copyright}</div>
    </footer>
  );
}
