"use client";
import Link from "next/link";
import { useT } from "./i18n";
import { DS2Mark } from "./ds2-mark";
import { ContactCTA } from "./contact-panel";

/** Footer: a brand statement + primary CTA on the left, a navigation column and a
 *  "get in touch" column on the right, and a bottom bar with the slowly
 *  self-rotating DS2 mark (CSS 3D coin-flip) beside the copyright. Shared by the
 *  home page and the sub-page chrome. */
export default function SiteFooter({ onContact }: { onContact: () => void }) {
  const t = useT();
  return (
    <footer data-surface="ink" className="site-footer">
      <div className="wrap sf-top">
        <div className="sf-lead">
          <p className="sf-headline">{t.footer.headline}</p>
          <ContactCTA label={t.cta.send} onOpen={onContact} className="sf-cta" />
        </div>

        <nav className="sf-col" aria-label={t.footer.navLabel}>
          <div className="sf-label">{t.footer.navLabel}</div>
          <Link className="sf-link" href="/#top">{t.footer.home}</Link>
          <Link className="sf-link" href="/#services">{t.footer.services}</Link>
          <Link className="sf-link" href="/tools">{t.footer.tools}</Link>
          <Link className="sf-link" href="/portfolio">{t.footer.portfolio}</Link>
          <Link className="sf-link" href="/about">{t.footer.about}</Link>
        </nav>

        <div className="sf-col sf-reach">
          <div className="sf-label">{t.footer.reachLabel}</div>
          <a className="sf-email" href={`mailto:${t.footer.email}`}>{t.footer.email}</a>
          <div className="sf-place">
            <span className="sf-label sf-based">{t.footer.basedLabel}</span>
            <span className="sf-locations">{t.footer.locations}</span>
          </div>
        </div>
      </div>

      <div className="wrap sf-bottom">
        <div className="sf-spin" aria-hidden="true">
          <div className="sf-spin__inner">
            <DS2Mark className="sf-spin__face sf-spin__front" />
            <DS2Mark className="sf-spin__face sf-spin__back" />
          </div>
        </div>
        <span className="sf-copy">{t.footer.copyright}</span>
      </div>
    </footer>
  );
}
