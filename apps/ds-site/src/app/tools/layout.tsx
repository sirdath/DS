import type { Metadata } from "next";

/** Server-component wrapper so /tools can carry its own metadata: the page
 *  itself is a client component, which cannot export `metadata`.
 *
 *  Note this also becomes the fallback for /tools/[slug], which previously
 *  inherited the site-wide root title. A per-tool `generateMetadata` would be
 *  better still, but that is a separate change.
 *
 *  Next.js merges metadata shallowly, so `openGraph` / `twitter` declared here
 *  REPLACE the root layout's objects rather than extending them. The image,
 *  siteName and card type are repeated on purpose, without them the share card
 *  falls back to the first large <img> on the page (see the root layout note). */
export const metadata: Metadata = {
  title: "Tools · DS2",
  description:
    "Nine tools we run for you, each solving one problem well: competitor and review intelligence, site selection, an AI receptionist, collections, site audits and more. You subscribe, we run the machinery, the results land in your inbox.",
  alternates: { canonical: "/tools" },
  openGraph: {
    type: "website",
    url: "/tools",
    siteName: "DS2",
    title: "Tools · DS2",
    description:
      "Nine tools, different solutions. Productized services we run for you, with no dashboards to learn and no software to manage.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DS2, Digital Solutions Consulting, Athens · London" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tools · DS2",
    description:
      "Nine tools, different solutions. Productized services we run for you, with no dashboards to learn and no software to manage.",
    images: ["/og.png"],
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
