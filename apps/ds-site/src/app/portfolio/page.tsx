"use client";
/* eslint-disable react/no-unescaped-entities */
import PageChrome, { useOpenContact } from "../_site-chrome";
import { ContactCTA } from "../contact-panel";

function PortfolioBody() {
  const open = useOpenContact();
  return (
    <section className="section section--first">
      <div className="wrap">
        <div className="section-head reveal">
          <div className="eyebrow">Selected work</div>
          <h2 className="section-title">
            A few engagements, <em>told straight.</em>
          </h2>
          <p className="section-sub">
            Early work, named where the client is happy to be. We say what we did, and what we did not.
          </p>
        </div>

        <div className="cases">
          <article className="case reveal">
            <div className="case-media" aria-hidden="true">
              <span>Preview coming soon</span>
            </div>
            <div className="case-body">
              <div className="case-meta">Medical exam prep · UK · Consulting</div>
              <h3 className="case-title">
                A leading UK platform helping doctors prepare for their exams.
              </h3>
              <p className="case-text">
                We ran the technical consulting end to end on the decisions that mattered. Which
                stack to build on, which roles to hire and in what order, and we helped them find
                the people. Alongside the advice we produced a high quality design prototype of
                their site, to give them real leverage on build quotes and a stronger direction for
                the UI.
              </p>
              <ul className="case-list">
                <li>Stack and architecture guidance</li>
                <li>Hiring plan and sourcing support</li>
                <li>High-quality design prototype for pricing leverage and UI direction</li>
              </ul>
            </div>
          </article>
        </div>

        <div className="about-coda reveal">
          <blockquote>
            If you want a second senior opinion before you commit, that is exactly where we are useful.
          </blockquote>
          <ContactCTA onOpen={open} />
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
