"use client";
/* eslint-disable react/no-unescaped-entities */
import PageChrome, { useOpenContact } from "../_site-chrome";
import { ContactCTA } from "../contact-panel";

function AboutBody() {
  const open = useOpenContact();
  return (
    <section className="section section--first">
      <div className="wrap">
        <div className="section-head reveal">
          <div className="eyebrow">About us</div>
          <h2 className="section-title">
            Two founders from Athens, building what the city was <em>missing.</em>
          </h2>
          <p className="section-sub">
            We grew up here, around technology. We kept seeing the same gap. That is why DS2 exists.
          </p>
        </div>

        <div className="about-blocks">
          <article className="about-block reveal">
            <div className="about-block-k">01 · Where we come from</div>
            <p>
              We are both from Athens, and we have been close to technology since we were young.
              Building things, breaking them, understanding how they work. That exposure shaped how
              we think long before it became a job.
            </p>
          </article>
          <article className="about-block reveal">
            <div className="about-block-k">02 · What we kept seeing</div>
            <p>
              Athens moves slower on technology than it should, and that gap compounds. Left alone it
              becomes a real disadvantage for the businesses here, not in some distant future but in
              the next few years.
            </p>
          </article>
          <article className="about-block reveal">
            <div className="about-block-k">03 · Why DS2</div>
            <p>
              So we decided to help, concretely. There are many small and medium businesses doing
              serious work with tools that hold them back. We want to help them get better day by
              day, product by product. Raise the technical literacy. Remove the bottlenecks. Help in
              as many ways as we usefully can.
            </p>
          </article>
          <article className="about-block reveal">
            <div className="about-block-k">04 · The standard we hold</div>
            <p>
              Our work is premium and we keep the quality high, on purpose. A lot of that comes from
              working in London, inside a more advanced and more organised working culture. We took
              what works there and brought it home, without the bloat.
            </p>
          </article>
        </div>

        <div className="founder-photo reveal">
          <div className="founder-photo-inner" role="img" aria-label="Photo of the two co-founders, coming soon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ph-logo ph-logo--lg" src="/logos/ds2-logo.png" alt="" />
            <span className="founder-photo-tag">Photo coming soon</span>
          </div>
          <div className="founder-photo-cap">Dimitris and Stelios, co-founders · Athens</div>
        </div>

        <div className="about-coda reveal">
          <blockquote>
            We work best when we can be honest early, even if that means challenging the initial idea.
          </blockquote>
          <ContactCTA onOpen={open} />
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
