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

          <article className="case reveal">
            <div className="case-media case-media--graph" aria-hidden="true">
              <svg className="case-graph" viewBox="0 0 440 210" fill="none" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="ecgGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>
                <g className="case-ecg-grid">
                  <line x1="0" y1="70" x2="440" y2="70" />
                  <line x1="0" y1="105" x2="440" y2="105" />
                  <line x1="0" y1="140" x2="440" y2="140" />
                  <line x1="73" y1="0" x2="73" y2="210" />
                  <line x1="147" y1="0" x2="147" y2="210" />
                  <line x1="220" y1="0" x2="220" y2="210" />
                  <line x1="293" y1="0" x2="293" y2="210" />
                  <line x1="367" y1="0" x2="367" y2="210" />
                </g>
                <path
                  className="case-ecg-line"
                  d="M0 120 L70 120 L78 112 L86 120 L96 120 L100 128 L108 55 L116 140 L122 120 L135 120 L150 108 L165 120 L235 120 L243 112 L251 120 L261 120 L265 128 L273 55 L281 140 L287 120 L300 120 L315 108 L330 120 L440 120"
                />
                <circle cx="108" cy="55" r="13" fill="url(#ecgGlow)" />
                <circle className="case-ecg-dot" cx="108" cy="55" r="3.5" />
              </svg>
            </div>
            <div className="case-body">
              <CaseText index={2} />
            </div>
          </article>

          <article className="case reveal">
            <div className="case-media case-media--graph" aria-hidden="true">
              <svg className="case-graph" viewBox="0 0 440 210" fill="none" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <radialGradient id="cgGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                </defs>
                <g className="cg-edges" strokeLinecap="round">
                  <line className="cg-edge" x1="40" y1="150" x2="75" y2="150" />
                  <line className="cg-edge" x1="40" y1="150" x2="95" y2="90" />
                  <line className="cg-edge" x1="95" y1="90" x2="130" y2="55" />
                  <line className="cg-edge" x1="95" y1="90" x2="200" y2="110" />
                  <line className="cg-edge" x1="130" y1="55" x2="200" y2="110" />
                  <line className="cg-edge" x1="130" y1="55" x2="175" y2="40" />
                  <line className="cg-edge" x1="200" y1="110" x2="150" y2="160" />
                  <line className="cg-edge" x1="200" y1="110" x2="250" y2="55" />
                  <line className="cg-edge" x1="200" y1="110" x2="320" y2="100" />
                  <line className="cg-edge" x1="200" y1="110" x2="175" y2="40" />
                  <line className="cg-edge" x1="150" y1="160" x2="270" y2="160" />
                  <line className="cg-edge" x1="250" y1="55" x2="320" y2="100" />
                  <line className="cg-edge" x1="250" y1="55" x2="300" y2="40" />
                  <line className="cg-edge" x1="320" y1="100" x2="360" y2="150" />
                  <line className="cg-edge" x1="320" y1="100" x2="390" y2="70" />
                  <line className="cg-edge" x1="360" y1="150" x2="410" y2="130" />
                  <line className="cg-edge" x1="390" y1="70" x2="410" y2="130" />
                  <line className="cg-edge" x1="270" y1="160" x2="230" y2="165" />
                </g>
                <g className="cg-nodes">
                  <circle className="cg-node" cx="40" cy="150" r="3" />
                  <circle className="cg-node" cx="75" cy="150" r="2.5" />
                  <circle className="cg-node" cx="95" cy="90" r="4" />
                  <circle className="cg-node" cx="130" cy="55" r="3" />
                  <circle className="cg-node" cx="175" cy="40" r="2.5" />
                  <circle className="cg-node" cx="150" cy="160" r="3" />
                  <circle className="cg-node" cx="250" cy="55" r="3" />
                  <circle className="cg-node" cx="300" cy="40" r="2.5" />
                  <circle className="cg-node" cx="270" cy="160" r="3" />
                  <circle className="cg-node" cx="230" cy="165" r="2.5" />
                  <circle className="cg-node" cx="320" cy="100" r="4" />
                  <circle className="cg-node" cx="360" cy="150" r="3" />
                  <circle className="cg-node" cx="390" cy="70" r="3" />
                  <circle className="cg-node" cx="410" cy="130" r="2.5" />
                  <circle cx="200" cy="110" r="14" fill="url(#cgGlow)" />
                  <circle className="cg-hub" cx="200" cy="110" r="5" />
                </g>
              </svg>
            </div>
            <div className="case-body">
              <CaseText index={3} />
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
