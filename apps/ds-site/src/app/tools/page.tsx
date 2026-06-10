"use client";
import Link from "next/link";
import PageChrome from "../_site-chrome";
import { useT } from "../i18n";
import { ToolMedia } from "./tool-media";

/** /tools — the DS2 tools storefront. Each card: demo film slot, name, tagline,
 *  status badge. Click through for the full page + pricing + interest CTA. */
function ToolsBody() {
  const t = useT();
  const T = t.tools;
  return (
    <main className="section section--first tools">
      <div className="wrap">
        <div className="section-head reveal">
          <div className="eyebrow">{T.eyebrow}</div>
          <h2 className="section-title">
            {T.title}<em>{T.titleEm}</em>
          </h2>
          <p className="section-sub">{T.sub}</p>
        </div>

        <div className="tools-grid">
          {T.items.map((tool) => (
            <Link key={tool.slug} className="tcard reveal" href={`/tools/${tool.slug}`}>
              <ToolMedia slug={tool.slug} name={tool.name} />
              <span className="tcard__row">
                <span className="tcard__name">{tool.name}</span>
                <span className={`tcard__status tcard__status--${tool.status}`}>
                  {tool.status === "early" ? T.statusEarly : T.statusSoon}
                </span>
              </span>
              <span className="tcard__tagline">{tool.tagline}</span>
              <span className="tcard__view">
                {T.view} <span aria-hidden="true">&rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ToolsPage() {
  return (
    <PageChrome>
      <ToolsBody />
    </PageChrome>
  );
}
