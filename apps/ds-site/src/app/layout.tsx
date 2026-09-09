import type { Metadata, Viewport } from "next";
import { Inter, Orbitron, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "./themes.css";
import "./schemes.css";
import { LanguageProvider } from "./i18n";
import ScrollAffordance from "./scroll-affordance";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["500", "600", "700"],
  display: "swap",
});

/** The mono stacks across the stylesheets asked for "IBM Plex Mono" but nothing
 *  ever loaded it, so every visitor without it installed silently got their OS
 *  monospace instead. Weights are the three the stylesheets actually use (400,
 *  600, 700) — IBM Plex Mono is a static family on Google Fonts, so each weight
 *  is a separate file and asking for more than we use is wasted bytes. */
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  // Without metadataBase + an og:image, link scrapers (WhatsApp, iMessage,
  // LinkedIn) fell back to the first large <img> on the page — which was the
  // Nodebook portfolio screenshot. Every share preview must carry the DS2 card.
  metadataBase: new URL("https://www.ds2-consulting.com"),
  title: "DS2, Digital Solutions Consulting",
  description:
    "A senior team for strategy, engineering, and applied AI. Athens and London.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "DS2",
    title: "DS2, Digital Solutions Consulting",
    description:
      "A senior team for strategy, engineering, and applied AI. Athens and London.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DS2 — Digital Solutions Consulting, Athens · London" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DS2, Digital Solutions Consulting",
    description:
      "A senior team for strategy, engineering, and applied AI. Athens and London.",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon-180.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050607",
};

/** Sets the colour scheme / glass look on <body> before hydration, so the page
 *  never flashes the default theme first.
 *
 *  `?scheme=` and `?glass=` come from the URL (and `ds2-glass` from
 *  localStorage), so every value is checked against the real set defined in
 *  schemes.css (body[data-scheme="…"]) and hero-glass-logo.tsx (GlassId) before
 *  it reaches the DOM — a crafted link can no longer render the site in a
 *  half-broken theme. Anything unknown falls back to the defaults.
 *  Keep these two lists in sync with those files. */
const SCHEME_SCRIPT =
  "(function(){var S=['mono','obsidian','azure','emerald'],G=['smoked','frosted','obsidian'];" +
  "function pick(list,v,fb){return list.indexOf(v)>-1?v:fb}" +
  "try{var q=new URLSearchParams(location.search);" +
  "document.body.setAttribute('data-scheme',pick(S,q.get('scheme'),'mono'));" +
  "document.body.setAttribute('data-glass',pick(G,q.get('glass')||localStorage.getItem('ds2-glass'),'smoked'));" +
  "if(localStorage.getItem('ds-theme')==='light')document.documentElement.setAttribute('data-theme','light');}" +
  "catch(e){document.body.setAttribute('data-scheme','mono');document.body.setAttribute('data-glass','smoked');}})();";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning on <html>: the /assistant route sets
  // data-assistant-theme via an inline script before hydration (no-flash
  // theme). Without it, React treats the server/client attribute diff as a
  // mismatch and strips the attribute back out right after hydrating.
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      {/* data-logo sets the hero logo treatment; data-scheme drives the colour scheme. */}
      <body data-logo="gradient" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: SCHEME_SCRIPT }} />
        <LanguageProvider>{children}</LanguageProvider>
        {/* Draggable overlay scroll thumb. The native scrollbar is hidden
            site-wide, so this restores the one affordance that removal took
            away. It has no copy, so it sits outside LanguageProvider. */}
        <ScrollAffordance />
      </body>
    </html>
  );
}
