import type { Metadata } from "next";

/** Server-component wrapper so /portfolio can carry its own metadata: the page
 *  itself is a client component, which cannot export `metadata`.
 *
 *  Next.js merges metadata shallowly, so `openGraph` / `twitter` declared here
 *  REPLACE the root layout's objects rather than extending them. The image,
 *  siteName and card type are repeated on purpose, without them the share card
 *  falls back to the first large <img> on the page (see the root layout note). */
export const metadata: Metadata = {
  title: "Projects · DS2",
  description:
    "Projects that make the value visible. Real client work sits beside ready-to-tailor concept directions, and the label always tells you which is which.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    type: "website",
    url: "/portfolio",
    siteName: "DS2",
    title: "Projects · DS2",
    description:
      "Websites, products and ready-to-tailor directions we have built. Real client work and concept work, always labelled so you know which is which.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "DS2, Digital Solutions Consulting, Athens · London" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects · DS2",
    description:
      "Websites, products and ready-to-tailor directions we have built. Real client work and concept work, always labelled so you know which is which.",
    images: ["/og.png"],
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
