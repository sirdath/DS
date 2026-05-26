"use client";
/* eslint-disable react/no-unescaped-entities */
import PageChrome, { useOpenContact } from "../_site-chrome";
import { ContactCTA } from "../contact-panel";
import { useT } from "../i18n";

function CaseText({ index }: { index: number }) {
  const p = useT().portfolio.cases[index];
  if (!p) return null;
  return (
    <>
      <span className="case-tag">{p.tag}</span>
      <div className="case-meta">{p.meta}</div>
      <h3 className="case-title">{p.title}</h3>
      <p className="case-text">{p.text}</p>
      <ul className="case-list">
        {p.list.map((li) => <li key={li}>{li}</li>)}
      </ul>
    </>
  );
}

function PortfolioBody() {
  const open = useOpenContact();
  const t = useT();
  const p = t.portfolio;
  return (
    <section className="section section--first">
      <div className="wrap">
        <div className="section-head reveal">
          <div className="eyebrow">{p.eyebrow}</div>
          <h2 className="section-title">
            {p.title}<em>{p.titleEm}</em>
          </h2>
          <p className="section-sub">{p.sub}</p>
        </div>

        <div className="cases">
          <article className="case reveal">
            <div className="case-media case-media--shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="case-shot" src="/portfolio/globalteamplans.png" alt="Screenshot of the GlobalTeamPlans website" />
            </div>
            <div className="case-body">
              <CaseText index={0} />
              <a className="case-link" href="https://globalteamplans.com" target="_blank" rel="noopener noreferrer">
                globalteamplans.com ↗
              </a>
            </div>
          </article>

          <article className="case reveal">
            <div className="case-media case-media--shot">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="case-shot" src="/portfolio/dataportfolio.png" alt="Screenshot of the dataportfolio.co.uk website" />
            </div>
            <div className="case-body">
              <CaseText index={1} />
              <a className="case-link" href="https://dataportfolio.co.uk" target="_blank" rel="noopener noreferrer">
                dataportfolio.co.uk ↗
              </a>
            </div>
          </article>

        </div>

        <div className="about-coda reveal">
          <blockquote>{p.coda}</blockquote>
          <ContactCTA label={t.cta.send} onOpen={open} />
        </div>
      </div>
    </section>
  );
}

export default function PortfolioPage() {
  return (
    <PageChrome>
      <PortfolioBody />
    </PageChrome>
  );
}
