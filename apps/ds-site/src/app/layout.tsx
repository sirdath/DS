import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import "./themes.css";
import "./schemes.css";
import { LanguageProvider } from "./i18n";

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

export const metadata: Metadata = {
  title: "DS2, Digital Solutions Consulting",
  description:
    "A senior team for strategy, engineering, and applied AI. Athens and London.",
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      {/* data-logo sets the hero logo treatment; data-scheme drives the colour scheme. */}
      <body data-logo="gradient" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var q=new URLSearchParams(location.search);var s=q.get('scheme')||'mono';document.body.setAttribute('data-scheme',s);var g=q.get('glass')||localStorage.getItem('ds2-glass')||'smoked';document.body.setAttribute('data-glass',g);if(localStorage.getItem('ds-theme')==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){document.body.setAttribute('data-scheme','mono');document.body.setAttribute('data-glass','smoked');}})();",
          }}
        />
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
