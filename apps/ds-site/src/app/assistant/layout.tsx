import type { Metadata } from "next";

/** This layout is also where /assistant gets its metadata: the page itself is a
 *  client component, which cannot export `metadata`.
 *
 *  Next.js merges metadata shallowly, so `openGraph` / `twitter` declared here
 *  REPLACE the root layout's objects rather than extending them. The image,
 *  siteName and card type are repeated on purpose, without them the share card
 *  falls back to the first large <img> on the page (see the root layout note). */
export const metadata: Metadata = {
  title: "Start your brief · DS2",
  description:
    "Tell us what would make the biggest difference right now and we will shape it into a project brief in a few minutes. You review a clear summary of the opportunity before anything is sent.",
  alternates: { canonical: "/assistant" },
  openGraph: {
    type: "website",
    url: "/assistant",
    siteName: "DS2",
    title: "Start your brief · DS2",
    description:
      "How can we help you? A short guided brief that turns your goal, timing and budget into something we can respond to properly.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DS2, Digital Solutions Consulting, Athens · London" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Start your brief · DS2",
    description:
      "How can we help you? A short guided brief that turns your goal, timing and budget into something we can respond to properly.",
    images: ["/og.png"],
  },
};

/** Sets the persisted theme on <html> before hydration, so the assistant never
 *  flashes dark-then-light (or vice versa) on load. Scoped to this route only:
 *  the attribute name is assistant-specific and no other route reads it. */
const NO_FLASH_SCRIPT = `(function(){try{
  var v=localStorage.getItem("ds2-assistant-theme");
  if(v!=="light"&&v!=="dark"){v=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";}
  document.documentElement.setAttribute("data-assistant-theme",v);
}catch(e){}})();`;

export default function AssistantLayout({ children }: { children: React.ReactNode }) {
  return <>
    <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
    {children}
  </>;
}
