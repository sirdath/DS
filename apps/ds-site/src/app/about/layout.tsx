import type { Metadata } from "next";

/** Server-component wrapper so /about can carry its own metadata: the page
 *  itself is a client component, which cannot export `metadata`.
 *
 *  Next.js merges metadata shallowly, so `openGraph` / `twitter` declared here
 *  REPLACE the root layout's objects rather than extending them. The image,
 *  siteName and card type are repeated on purpose, without them the share card
 *  falls back to the first large <img> on the page (see the root layout note). */
export const metadata: Metadata = {
  title: "About · DS2",
  description:
    "Dimitris leads engineering and data from London, Stelios leads consulting and strategy from Athens. We started DS2 to close the gap between businesses doing serious work and the outdated tools holding them back.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: "/about",
    siteName: "DS2",
    title: "About · DS2",
    description:
      "Two founders, two disciplines. Engineering depth from London, consulting discipline from Athens, and why we think the gap between good businesses and their tools is worth closing.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DS2, Digital Solutions Consulting, Athens · London" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About · DS2",
    description:
      "Two founders, two disciplines. Engineering depth from London, consulting discipline from Athens, and why we think the gap between good businesses and their tools is worth closing.",
    images: ["/og.png"],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
