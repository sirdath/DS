"use client";
import { useT } from "./i18n";
import { ContactCTA } from "./contact-panel";
import { useOpenContact } from "./_site-chrome";

type Page = { id: string; eyebrow: string; title: string; body: string };

/** Founder visual config: portrait/place image + the logos that come with them.
 *  Logos render as text chips until the real logo files land in /founders/logos. */
const FOUNDERS: Record<string, { img: string; logos: string[] }> = {
  dimitris: { img: "/founders/london.png", logos: ["UCL", "Intelmatix"] },
  stelios: { img: "/founders/athens.png", logos: ["PwC", "Netherlands"] },
};

function FounderRow({ p, flip }: { p: Page; flip: boolean }) {
  const t = useT();
  const meta = FOUNDERS[p.id];
  if (!meta) return null;
  // Logos are brand names (kept as-is) except the country, which translates.
  const logos = meta.logos.map((l) => (l === "Netherlands" ? t.about.cityNetherlands : l));
  return (
    <article className={`abs-founder reveal${flip ? " abs-founder--flip" : ""}`}>
      <div className="abs-founder__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={meta.img} alt="" loading="lazy" />
      </div>
      <div className="abs-founder__body">
        <span className="abs-eyebrow">{p.eyebrow}</span>
        <h3 className="abs-founder__name">{p.title}</h3>
        <p className="abs-founder__bio">{p.body}</p>
        <div className="abs-founder__logos" aria-label={t.a11y.background}>
          {logos.map((l) => (
            <span className="abs-logo" key={l}>{l}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

/** About — bold Mission & Vision first (side-by-side), then the story (the gap,
 *  the two founders with their images + logos, and what DS2 is). Calm fade-up
 *  reveals only (the page chrome drives `.reveal`); no pinning or camera. */
export default function AboutStory() {
  const t = useT();
  const open = useOpenContact();
  const sb = t.about.scrollbook;
  const get = (id: string) => sb.find((p) => p.id === id)!;
  const mission = get("mission");
  const vision = get("vision");
  const gap = get("gap");

  return (
    <main className="abs">
      {/* Mission / Vision — side-by-side, bold, the first thing you read */}
      <section className="abs-mv wrap" aria-label={`${mission.eyebrow}, ${vision.eyebrow}`}>
        <article className="abs-mv__panel reveal">
          <span className="abs-mv__label">{mission.eyebrow}</span>
          <h1 className="abs-mv__statement">{mission.title}</h1>
          <p className="abs-mv__sub">{mission.body}</p>
        </article>
        <article className="abs-mv__panel reveal">
          <span className="abs-mv__label">{vision.eyebrow}</span>
          <h2 className="abs-mv__statement">{vision.title}</h2>
          <p className="abs-mv__sub">{vision.body}</p>
        </article>
      </section>

      {/* The gap */}
      <section className="abs-gap wrap reveal" aria-label={gap.eyebrow}>
        <span className="abs-eyebrow">{gap.eyebrow}</span>
        <h2 className="abs-gap__title">{gap.title}</h2>
        <p className="abs-gap__body">{gap.body}</p>
      </section>

      {/* Founders, each with their image + logos */}
      <section className="abs-founders wrap">
        <FounderRow p={get("dimitris")} flip={false} />
        <FounderRow p={get("stelios")} flip={true} />
      </section>

      {/* What DS2 is */}
      <section className="abs-ds2 wrap reveal" aria-label={get("ds2").eyebrow}>
        <span className="abs-eyebrow">{get("ds2").eyebrow}</span>
        <h2 className="abs-ds2__title">{get("ds2").title}</h2>
        <p className="abs-ds2__body">{get("ds2").body}</p>
        <ContactCTA label={t.cta.send} onOpen={open} />
      </section>
    </main>
  );
}
