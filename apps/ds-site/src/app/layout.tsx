import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "./i18n";
import LogoStyleSwitcher from "./logo-style-switcher";

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
  title: "DS2 — Digital Solutions Consulting",
  description:
    "A senior team for strategy, engineering, and applied AI. Athens and London.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body>
        <LanguageProvider>{children}</LanguageProvider>
        <LogoStyleSwitcher />
      </body>
    </html>
  );
}
