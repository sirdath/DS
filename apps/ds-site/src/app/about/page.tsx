"use client";
/* eslint-disable react/no-unescaped-entities */
import PageChrome, { useOpenContact } from "../_site-chrome";
import { ContactCTA } from "../contact-panel";
import { useT } from "../i18n";

function AboutBody() {
  const open = useOpenContact();
  const t = useT();
  const a = t.about;
  return (
    <section className="section section--first">
      <div className="wrap">
        <div className="section-head reveal">
          <div className="eyebrow">{a.eyebrow}</div>
          <h2 className="section-title">
            {a.title}<em>{a.titleEm}</em>{a.titleEnd}
          </h2>
          <p className="section-sub">{a.sub}</p>
        </div>

        <div className="about-blocks">
          {a.blocks.map((b) => (
            <article className="about-block reveal" key={b.k}>
              <div className="about-block-k">{b.k}</div>
              <p>{b.p}</p>
            </article>
          ))}
        </div>

        <div className="about-mv">
          <article className="about-mv-card reveal">
            <div className="about-mv-k">{a.missionK}</div>
            <p>{a.mission}</p>
          </article>
          <article className="about-mv-card reveal">
            <div className="about-mv-k">{a.visionK}</div>
            <p>{a.vision}</p>
          </article>
        </div>

        <div className="founder-photo reveal">
          <div className="about-cities">
            <figure className="about-city">
              <figcaption>{a.cityAthens}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/founders/athens.png" alt={a.cityAthens} />
            </figure>
            <figure className="about-city">
              <figcaption>{a.cityLondon}</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/founders/london.png" alt={a.cityLondon} />
            </figure>
          </div>
          <div className="founder-photo-cap">{a.citiesCap}</div>
        </div>

        <div className="about-coda reveal">
          <blockquote>{a.coda}</blockquote>
          <ContactCTA label={t.cta.send} onOpen={open} />
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <PageChrome>
      <AboutBody />
    </PageChrome>
  );
}
