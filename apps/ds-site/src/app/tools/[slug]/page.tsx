"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import PageChrome, { useOpenContact } from "../../_site-chrome";
import { useT } from "../../i18n";
import { ToolMedia, ToolIcon } from "../tool-media";

/** /tools/[slug] — one tool's page: demo film, what it does, who it's for,
 *  what you receive, pricing (shown or "on a call") and the interest CTA that
 *  opens the contact panel with a prefilled draft. */
function ToolBody() {
  const t = useT();
  const T = t.tools;
  const open = useOpenContact();
  const { slug } = useParams<{ slug: string }>();
  const tool = T.items.find((it) => it.slug === slug);

  if (!tool) {
    return (
      <main className="section section--first tools">
      <div className="tools-beams" aria-hidden="true" />
        <div className="wrap">
          <Link className="tdetail__back" href="/tools">&larr; {T.backAll}</Link>
        </div>
      </main>
    );
  }

  const interested = () => open(T.interestDraft.replace("{tool}", `${tool.name} (${tool.role})`));

  return (
    <main className="section section--first tools tdetail">
      <div className="wrap">
        <Link className="tdetail__back reveal" href="/tools">&larr; {T.backAll}</Link>

        <div className="tdetail__hero reveal">
          <div className="tdetail__intro">
            <div className="tdetail__top">
              <span className="tdetail__ic" aria-hidden="true"><ToolIcon slug={tool.slug} /></span>
              <span className={`tcard__status tcard__status--${tool.status}`}>
                {tool.status === "early" ? T.statusEarly : T.statusSoon}
              </span>
            </div>
            <div className="tdetail__role">{tool.role}</div>
            <h1 className="tdetail__name">{tool.name}</h1>
            <p className="tdetail__tagline">{tool.tagline}</p>
            <p className="tdetail__desc">{tool.desc}</p>
            <div className="tdetail__cta-row">
              <button type="button" className="cta" onClick={interested}>
                {T.interestCta}
                <span className="cta__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22l-4-9-9-4 20-7Z" />
                  </svg>
                </span>
              </button>
              <span className="tdetail__price">{tool.priceNote}</span>
            </div>
          </div>
          <ToolMedia slug={tool.slug} name={tool.name} mode="video" />
        </div>

        <section className="troi reveal" aria-label={T.roiLabel}>
          <h2 className="tdetail__label">{T.roiLabel}</h2>
          <div className="troi__stats">
            {tool.stats.map((st) => (
              <div className="troi__stat" key={st.label}>
                <span className="troi__value">{st.value}</span>
                <span className="troi__slabel">{st.label}</span>
              </div>
            ))}
          </div>
          <p className="troi__body">{tool.roiBody}</p>
        </section>

        <div className="tdetail__grid reveal">
          <section className="tdetail__features" aria-label={T.featuresLabel}>
            <h2 className="tdetail__label">{T.featuresLabel}</h2>
            <ul>
              {tool.features.map((f) => (
                <li key={f.name}>
                  <span className="tdetail__fname">{f.name}</span>
                  <span className="tdetail__fdetail">{f.detail}</span>
                </li>
              ))}
            </ul>
          </section>

          <aside className="tdetail__facts">
            <div className="tdetail__fact">
              <h3 className="tdetail__label">{T.audienceLabel}</h3>
              <p>{tool.audience}</p>
            </div>
            <div className="tdetail__fact">
              <h3 className="tdetail__label">{T.deliverableLabel}</h3>
              <p>{tool.deliverable}</p>
            </div>
            <div className="tdetail__fact">
              <h3 className="tdetail__label">{T.pricingLabel}</h3>
              <p>{tool.priceNote}</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function ToolPage() {
  return (
    <PageChrome>
      <ToolBody />
    </PageChrome>
  );
}
