"use client";
/**
 * Lightweight in-page i18n for the DS2 marketing site.
 * - Language lives in a client context, persisted to a cookie.
 * - First visit auto-detects Greek browsers (navigator.language === "el…").
 * - No route changes: the EN/ΕΛ toggle swaps copy in place.
 *
 * Strings live in i18n-dict.ts. Components read them via useT().
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { dict, type Lang } from "./i18n-dict";

const COOKIE = "ds2_lang";
const YEAR = 60 * 60 * 24 * 365;

interface LangCtxValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const LangCtx = createContext<LangCtxValue>({ lang: "en", setLang: () => {} });

export const useLang = () => useContext(LangCtx);
/** Returns the dictionary for the active language. */
export const useT = () => dict[useLang().lang];

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]!) : null;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Server + first client render are always "en" so hydration matches; the
  // effect below corrects to the saved / detected language right after mount.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = readCookie(COOKIE);
    let initial: Lang = "en";
    if (saved === "en" || saved === "el") {
      initial = saved;
    } else if (
      typeof navigator !== "undefined" &&
      navigator.language?.toLowerCase().startsWith("el")
    ) {
      initial = "el";
    }
    if (initial !== "en") setLangState(initial);
    document.documentElement.lang = initial;
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    document.cookie = `${COOKIE}=${l}; path=/; max-age=${YEAR}; samesite=lax`;
  }, []);

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

/** EN / ΕΛ switch used in the nav. */
export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`lang-toggle${className ? ` ${className}` : ""}`} role="group" aria-label={dict[lang].a11y.language}>
      <button
        type="button"
        className={`lang-opt${lang === "en" ? " is-active" : ""}`}
        aria-pressed={lang === "en"}
        onClick={() => setLang("en")}
      >
        EN
      </button>
      <span className="lang-sep" aria-hidden="true">/</span>
      <button
        type="button"
        className={`lang-opt${lang === "el" ? " is-active" : ""}`}
        aria-pressed={lang === "el"}
        onClick={() => setLang("el")}
      >
        ΕΛ
      </button>
    </div>
  );
}
