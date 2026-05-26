/**
 * Tech fingerprinting — infer the libraries/frameworks a site uses from its HTML
 * + headers, and flag the legacy ones. Old packages are one of the clearest
 * "this site is dated" tells, and they're concrete talking points for a pitch.
 *
 * Returns the detected stack (for the report) plus weighted Signals for the
 * legacy/obsolete pieces.
 */
import type { Signal } from "./types.js";

export interface Fingerprint {
  tech: string[]; // everything detected (modern + legacy), for the report
  signals: Signal[]; // legacy items only, weighted
}

export function fingerprint(html: string, headers: Headers | null, generator: string | null): Fingerprint {
  const tech = new Set<string>();
  const signals: Signal[] = [];
  const add = (label: string) => tech.add(label);
  const flag = (label: string, tag: string, detail: string, weight: number) => {
    tech.add(label);
    signals.push({ tag, detail, weight });
  };
  const xPoweredBy = headers?.get("x-powered-by") ?? "";
  const aspNet = headers?.get("x-aspnet-version") ?? "";

  // ── jQuery (+ version) ──
  const jq = html.match(/jquery[-.](\d+)\.(\d+)(?:\.\d+)?(?:\.min)?\.js/i);
  if (jq) {
    const major = Number(jq[1]);
    const minor = Number(jq[2]);
    if (major < 2) flag(`jQuery ${major}.${minor}`, "tech-old-jquery", `Ancient jQuery (${major}.${minor}) — pre-2016`, 7);
    else if (major === 2) flag(`jQuery 2.x`, "tech-old-jquery", "Old jQuery 2.x", 4);
    else add(`jQuery ${major}.x`);
  }
  if (/jquery-migrate/i.test(html)) flag("jQuery Migrate", "tech-jquery-migrate", "Loads jQuery Migrate (props up legacy jQuery code)", 3);

  // ── Bootstrap (v2/v3 are clearly dated) ──
  const bs = html.match(/bootstrap\s+v?(\d+)\.(\d+)/i) || html.match(/bootstrap[-.](\d+)\.(\d+)/i);
  if (bs) {
    const major = Number(bs[1]);
    if (major <= 3) flag(`Bootstrap ${major}`, "tech-old-bootstrap", `Bootstrap ${major} (pre-2018 grid; not modern-responsive)`, 7);
    else add(`Bootstrap ${major}`);
  } else if (/bootstrap(?:\.min)?\.(?:css|js)/i.test(html)) {
    add("Bootstrap");
  }

  // ── Genuinely obsolete JS libraries ──
  if (/mootools/i.test(html)) flag("MooTools", "tech-obsolete-lib", "Uses MooTools — abandoned ~2010", 9);
  if (/prototype(?:\.min)?\.js/i.test(html)) flag("Prototype.js", "tech-obsolete-lib", "Uses Prototype.js — long dead", 9);
  if (/scriptaculous/i.test(html)) flag("script.aculo.us", "tech-obsolete-lib", "Uses script.aculo.us — ~2008 era", 9);
  if (/yui(?:-min)?\.js|yui\.yahooapis\.com/i.test(html)) flag("YUI", "tech-obsolete-lib", "Uses Yahoo YUI — discontinued 2014", 8);
  if (/swfobject/i.test(html)) flag("SWFObject", "tech-obsolete-lib", "SWFObject (Flash embedding) — Flash is dead", 8);

  // ── AngularJS 1.x (legacy) vs modern Angular ──
  if (/angular(?:\.min)?\.js/i.test(html) && !/@angular|zone\.js/i.test(html)) {
    flag("AngularJS 1.x", "tech-angularjs", "AngularJS 1.x — end-of-life since 2022", 7);
  }

  // ── Icon/asset era ──
  if (/font-?awesome[^"']*?4\.\d/i.test(html) || (/fa-/.test(html) && /font-?awesome/i.test(html) && !/\b(fas|far|fal|fab)\b/.test(html))) {
    flag("Font Awesome 4", "tech-old-fontawesome", "Font Awesome 4 (pre-2017 icon set)", 3);
  }

  // ── Analytics era ──
  if (/google-analytics\.com\/(ga|urchin)\.js|_gaq\.push/i.test(html)) {
    flag("Legacy Google Analytics (ga.js)", "tech-legacy-analytics", "Uses ga.js/urchin — Google killed it; site untouched for years", 6);
  } else if (/gtag\(|googletagmanager\.com\/gtag|analytics\.js/i.test(html)) {
    add("Google Analytics (modern)");
  }

  // ── Server-side era from headers / markup ──
  if (/__VIEWSTATE/i.test(html) || /\.aspx?(\?|"|')/i.test(html)) flag("ASP.NET WebForms", "tech-webforms", "ASP.NET WebForms (__VIEWSTATE) — legacy stack", 8);
  if (/php\/[45]\./i.test(xPoweredBy)) flag(`PHP ${xPoweredBy.match(/php\/([\d.]+)/i)?.[1] ?? ""}`.trim(), "tech-old-php", `End-of-life PHP (${xPoweredBy})`, 6);
  if (aspNet && /^[12]\./.test(aspNet)) flag(`ASP.NET ${aspNet}`, "tech-old-aspnet", `Old ASP.NET runtime (${aspNet})`, 5);

  // ── CMS / builders ──
  if (/wp-content|wp-includes/i.test(html)) {
    const wp = (generator ?? "").match(/wordpress\s*([\d.]+)/i);
    if (wp && Number(wp[1]?.split(".")[0]) < 5) flag(`WordPress ${wp[1]}`, "tech-old-wordpress", `Old WordPress ${wp[1]}`, 6);
    else add(wp ? `WordPress ${wp[1]}` : "WordPress");
  }
  if (/joomla/i.test(html) || /joomla/i.test(generator ?? "")) add("Joomla");
  if (/Drupal\.settings|sites\/all\/(modules|themes)/.test(html)) add("Drupal");

  // ── Modern frameworks (informational — good to know the baseline) ──
  if (/__NEXT_DATA__|\/_next\/static/.test(html)) add("Next.js");
  else if (/data-reactroot|react-dom|React\.createElement/.test(html)) add("React");
  if (/__NUXT__/.test(html)) add("Nuxt");
  else if (/data-v-[0-9a-f]{6,8}|vue(?:\.min)?\.js/i.test(html)) add("Vue");
  if (/__sveltekit|svelte-/i.test(html)) add("Svelte");
  if (/cdn\.shopify\.com|Shopify\./i.test(html)) add("Shopify");
  if (/static\.wixstatic\.com|wix\.com/i.test(html)) add("Wix");
  if (/squarespace/i.test(html)) add("Squarespace");
  if (/assets\.webflow\.com|webflow/i.test(html)) add("Webflow");

  return { tech: [...tech], signals };
}
