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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ph-logo" src="/logos/ds2-logo.png" alt="" />
              <span>Preview coming soon</span>
            </div>
            <div className="case-body">
              <span className="case-tag">Websites</span>
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

          <article className="case reveal">
            <div className="case-media" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ph-logo" src="/logos/ds2-logo.png" alt="" />
              <span>Preview coming soon</span>
            </div>
            <div className="case-body">
              <span className="case-tag">Data solutions</span>
              <div className="case-meta">Geospatial · Data science</div>
              <h3 className="case-title">
                A geospatial node network from two million points of interest.
              </h3>
              <p className="case-text">
                A data and AI company handed us a dataset of around two million points of interest.
                We turned it into a geospatial network of nodes they could use directly inside one
                of their production products.
              </p>
              <ul className="case-list">
                <li>Ingested and cleaned roughly 2M POIs</li>
                <li>Built a connected geospatial node network</li>
                <li>Delivered for use inside their live product</li>
              </ul>
            </div>
          </article>

          <article className="case reveal">
            <div className="case-media" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ph-logo" src="/logos/ds2-logo.png" alt="" />
              <span>Preview coming soon</span>
            </div>
            <div className="case-body">
              <span className="case-tag">Websites</span>
              <div className="case-meta">SaaS · Product build</div>
              <h3 className="case-title">A SaaS for building portfolios.</h3>
              <p className="case-text">
                The client wanted to launch a product that lets people build portfolios. We took it
                from idea to a working SaaS: the application itself and the site around it.
              </p>
              <ul className="case-list">
                <li>Product and UX build</li>
                <li>Full SaaS application</li>
                <li>Marketing site around the product</li>
              </ul>
              <a className="case-link" href="https://dataportfolio.co.uk" target="_blank" rel="noopener noreferrer">
                dataportfolio.co.uk ↗
              </a>
            </div>
          </article>

          <article className="case reveal">
            <div className="case-media" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="ph-logo" src="/logos/ds2-logo.png" alt="" />
              <span>Preview coming soon</span>
            </div>
            <div className="case-body">
              <span className="case-tag">Websites</span>
              <div className="case-meta">Website · SEO · Google Ads</div>
              <h3 className="case-title">A focused marketing site, built to be found.</h3>
              <p className="case-text">
                We designed and built the site end to end, then made sure it would actually get
                traffic: technical and on-page SEO, plus a Google Ads account set up and launched so
                it started reaching people from day one.
              </p>
              <ul className="case-list">
                <li>Website design and build</li>
                <li>Technical and on-page SEO</li>
                <li>Google Ads setup and launch</li>
              </ul>
              <a className="case-link" href="https://globalteamplans.com" target="_blank" rel="noopener noreferrer">
                globalteamplans.com ↗
              </a>
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
