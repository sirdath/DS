"use client";
import { useT } from "./i18n";

type Page = { id: string; eyebrow: string; title: string; body: string };

/** Founder visual config: portrait/place image + the logos that come with them.
 *  A logo with `img` renders as the real mark on a chip matching its baked
 *  background (`bg`); without `img` it stays a text chip. */
type FounderLogo = { label: string; img?: string; bg?: "light" | "dark" };
const FOUNDERS: Record<string, { img: string; logos: FounderLogo[] }> = {
  dimitris: {
    img: "/founders/london.webp",
    logos: [],
  },
  stelios: {
    img: "/founders/athens.webp",
    logos: [],
  },
};

function FounderRow({ p, flip }: { p: Page; flip: boolean }) {
  const t = useT();
  const meta = FOUNDERS[p.id];
  if (!meta) return null;
  // Logos are brand names (kept as-is) except the country, which translates.
  const logos = meta.logos.map((l) =>
    l.label === "Netherlands" ? { ...l, label: t.about.cityNetherlands } : l,
  );
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
          {logos.map((l) =>
            l.img ? (
              <span className={`abs-logo abs-logo--img abs-logo--${l.bg ?? "dark"}`} key={l.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.img} alt={l.label} loading="lazy" />
              </span>
            ) : (
              <span className="abs-logo" key={l.label}>{l.label}</span>
            ),
          )}
        </div>
      </div>
    </article>
  );
}

/** About — bold Mission & Vision first (side-by-side), then the story (the gap,
 *  the two founders with their images + logos, and what DS2 is). Calm fade-up
 *  reveals only (the page chrome drives `.reveal`); no pinning or camera. */
// Hidden for now, not deleted -- flip back on whenever Mission/Vision should
// lead the page again. While it's off, "the gap" becomes the first section,
// so its title takes over as the page's <h1> (a page should have exactly one).
const SHOW_MISSION_VISION = false;

export default function AboutStory() {
  const t = useT();
  const sb = t.about.scrollbook;
  const get = (id: string) => sb.find((p) => p.id === id)!;
  const mission = get("mission");
  const vision = get("vision");
  const gap = get("gap");
  const ds2 = get("ds2");
  const GapTitle = SHOW_MISSION_VISION ? "h2" : "h1";

  return (
    <main className="abs">
      {/* Mission / Vision — side-by-side, bold, the first thing you read */}
      {SHOW_MISSION_VISION && (
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
      )}

      {/* The gap */}
      <section
        className={`abs-gap wrap reveal${SHOW_MISSION_VISION ? "" : " abs-gap--first"}`}
        aria-label={gap.eyebrow}
      >
        <span className="abs-eyebrow">{gap.eyebrow}</span>
        <GapTitle className="abs-gap__title">{gap.title}</GapTitle>
        <p className="abs-gap__body">{gap.body}</p>
      </section>

      {/* Founders, each with their image + logos */}
      <section className="abs-founders wrap">
        <FounderRow p={get("dimitris")} flip={false} />
        <FounderRow p={get("stelios")} flip={true} />
      </section>

      {/* What DS2 is */}
      <section className="abs-ds2 wrap reveal" aria-label={ds2.eyebrow}>
        <span className="abs-eyebrow">{ds2.eyebrow}</span>
        <h2 className="abs-ds2__title">{ds2.title}</h2>
        <p className="abs-ds2__body">{ds2.body}</p>
      </section>
    </main>
  );
}
