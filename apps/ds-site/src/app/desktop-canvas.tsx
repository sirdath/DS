"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { DS2Mark } from "./ds2-mark";
import { useLang } from "./i18n";
import DesktopMailComposer from "./desktop-mail-composer";
import s from "./desktop-portal.module.css";

/**
 * The DS2 desktop itself: menu bar, wallpaper picker, desktop icons, draggable
 * windows and the Dock. Split out of desktop-portal.tsx, which now only owns
 * the scroll-driven 3D laptop that this gets composited onto -- the two halves
 * share nothing but the CSS module and the <DesktopCanvas> element, so keeping
 * them in one 794-line file was hiding a clean seam (CLAUDE.md rule 4).
 */

type AppId = "about" | "work" | "blog" | "tools" | "mail";
type LauncherId = AppId | "contact";
type WindowState = { open: boolean; x: number; y: number; z: number };
type WindowMap = Record<AppId, WindowState>;

const WALLPAPERS = [
  { id: "alien-horizon", name: "Horizon Moon", src: "/desktop/wallpapers/alien-horizon.webp" },
  { id: "noctilucent-sky", name: "Night Sky", src: "/desktop/wallpapers/noctilucent-sky.webp" },
] as const;

type WallpaperId = (typeof WALLPAPERS)[number]["id"];
const DEFAULT_WALLPAPER: WallpaperId = "alien-horizon";
const WALLPAPER_STORAGE_KEY = "ds2-desktop-wallpaper";

const APPS: Array<{ id: LauncherId; symbol: string }> = [
  { id: "about", symbol: "DS" },
  { id: "work", symbol: "◆" },
  { id: "blog", symbol: "✦" },
  { id: "tools", symbol: "⌘" },
  { id: "mail", symbol: "@" },
  { id: "contact", symbol: "" },
];

export const COPY = {
  en: {
    scroll: "Scroll to open",
    enter: "Enter the DS2 desktop",
    labels: { about: "About", work: "Work", blog: "Blogs", tools: "Tools", mail: "Mail", contact: "Contact" },
    aboutTitle: "Two founders. No layers.",
    aboutBody: "Strategy in Athens. Engineering in London. The people in the room are the people doing the work.",
    workTitle: "Selected work",
    workBody: "Products, platforms and experiments built to survive outside the pitch deck.",
    blogTitle: "Notes from the work",
    blogBody: "Practical writing on digital products, AI, data and the decisions that make projects expensive.",
    toolsTitle: "DS2 tools",
    toolsBody: "Small, focused software for research, operations and decision-making.",
    mailTitle: "New Message",
    subject: "Tell us what you are actually trying to do.",
    compose: "Start your brief",
    open: "Open",
    wallpaperTitle: "Wallpaper",
    wallpaperSubtitle: "Choose a DS2 desktop",
    // Screen-reader-only names for the scene's landmarks and icon-only buttons.
    // {app} is filled with the matching labels[] entry.
    statusLabel: "Desktop status",
    wallpaperChoose: "Choose desktop wallpaper",
    wallpapersLabel: "Desktop wallpapers",
    wallpaperClose: "Close wallpaper picker",
    dockLabel: "DS2 desktop apps",
    closeWindow: "Close {app}",
  },
  el: {
    scroll: "Κάντε scroll για να ανοίξει",
    enter: "Μπείτε στο DS2 desktop",
    labels: { about: "Σχετικά", work: "Έργα", blog: "Άρθρα", tools: "Εργαλεία", mail: "Mail", contact: "Επικοινωνία" },
    aboutTitle: "Δύο ιδρυτές. Χωρίς ενδιάμεσα επίπεδα.",
    aboutBody: "Στρατηγική στην Αθήνα. Engineering στο Λονδίνο. Οι άνθρωποι στη συνάντηση είναι και οι άνθρωποι που κάνουν τη δουλειά.",
    workTitle: "Επιλεγμένα έργα",
    workBody: "Προϊόντα, πλατφόρμες και πειράματα που λειτουργούν και έξω από το pitch deck.",
    blogTitle: "Σημειώσεις από τη δουλειά",
    blogBody: "Πρακτικά άρθρα για ψηφιακά προϊόντα, AI, data και τις αποφάσεις που κάνουν τα έργα ακριβά.",
    toolsTitle: "Εργαλεία DS2",
    toolsBody: "Μικρό και στοχευμένο software για έρευνα, λειτουργίες και λήψη αποφάσεων.",
    mailTitle: "Νέο Μήνυμα",
    subject: "Πείτε μας τι πραγματικά προσπαθείτε να κάνετε.",
    compose: "Ξεκινήστε το brief",
    open: "Άνοιγμα",
    wallpaperTitle: "Wallpaper",
    wallpaperSubtitle: "Επιλέξτε wallpaper DS2 desktop",
    statusLabel: "Κατάσταση συστήματος",
    wallpaperChoose: "Επιλογή wallpaper για το DS2 desktop",
    wallpapersLabel: "Wallpapers του DS2 desktop",
    wallpaperClose: "Κλείσιμο της επιλογής wallpaper",
    dockLabel: "Εφαρμογές του DS2 desktop",
    closeWindow: "Κλείσιμο «{app}»",
  },
} as const;

/**
 * The site's mobile breakpoint (the same 760px desktop-portal.module.css and
 * most of this app's CSS already use).
 *
 * Below it the desktop behaves the way a phone does: one app in front at a
 * time, the Dock switching between them. Two overlapping windows do not fit a
 * phone -- measured at 375x812, About and Work sat 40px apart at the same
 * left/right inset, so Work was completely covered by About and neither had
 * room for its copy. One front window instead gets the whole screen between
 * the menu bar and the Dock, which is what makes its text readable at full
 * size. Above the breakpoint nothing changes: windows open alongside each
 * other exactly as before.
 */
const COMPACT_QUERY = "(max-width: 760px)";

const INITIAL_WINDOWS: WindowMap = {
  about: { open: true, x: -255, y: -58, z: 5 },
  work: { open: true, x: 230, y: 84, z: 4 },
  blog: { open: false, x: 120, y: -80, z: 3 },
  tools: { open: false, x: -140, y: 88, z: 2 },
  mail: { open: false, x: 10, y: 12, z: 6 },
};

const APP_ICON_SRC: Record<AppId, string> = {
  about: "/desktop/icons/about-desktop-icon.png",
  work: "/desktop/icons/work-desktop-icon.png",
  blog: "/desktop/icons/blogs-desktop-icon.png",
  tools: "/desktop/icons/tools-desktop-icon.png",
  mail: "/desktop/icons/mail-desktop-icon.png",
};

function AppArtwork({ id }: { id: AppId }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={s.appArtwork} src={APP_ICON_SRC[id]} alt="" loading="lazy" />
  );
}

function AppGlyph({ app }: { app: { id: LauncherId; symbol: string } }) {
  return (
    <span className={`${s.appIcon} ${s[`appIcon_${app.id}`]}`}>
      {app.id === "contact" ? <span className={s.aryaOrbMark} aria-hidden="true" /> : <AppArtwork id={app.id} />}
    </span>
  );
}

function WindowContent({ id, onContact }: { id: AppId; onContact: () => void }) {
  const { lang } = useLang();
  const c = COPY[lang];

  if (id === "about") {
    return (
      <div className={s.windowCopy}>
        <span className={s.windowEyebrow}>DS2 / ATHENS + LONDON</span>
        <h3>{c.aboutTitle}</h3>
        <p>{c.aboutBody}</p>
        <div className={s.peopleStrip}><span>Dimitris<br /><small>Engineering + Data</small></span><span>Stelios<br /><small>Strategy + Consulting</small></span></div>
        <Link href="/about">{c.open} About ↗</Link>
      </div>
    );
  }

  if (id === "work") {
    return (
      <div className={s.windowCopy}>
        <span className={s.windowEyebrow}>SHIP / LEARN / IMPROVE</span>
        <h3>{c.workTitle}</h3>
        <p>{c.workBody}</p>
        <div className={s.fileList}><span>NeuroVault <b>AI memory</b></span><span>Panoptes <b>Research</b></span><span>Nodebook <b>Knowledge</b></span></div>
        <Link href="/portfolio">{c.open} Portfolio ↗</Link>
      </div>
    );
  }

  if (id === "blog") {
    return (
      <div className={s.windowCopy}>
        <span className={s.windowEyebrow}>FIELD NOTES</span>
        <h3>{c.blogTitle}</h3>
        <p>{c.blogBody}</p>
        <div className={s.noteCard}>The biggest cost is lack of knowledge.<small>5 min read</small></div>
        <Link href="/blog">{c.open} Blogs ↗</Link>
      </div>
    );
  }

  if (id === "tools") {
    return (
      <div className={s.windowCopy}>
        <span className={s.windowEyebrow}>WORKING SOFTWARE</span>
        <h3>{c.toolsTitle}</h3>
        <p>{c.toolsBody}</p>
        <div className={s.toolGrid}><span>Competitor Watch</span><span>Review Intelligence</span><span>Site Audit</span><span>AI Memory</span></div>
        <Link href="/tools">{c.open} Tools ↗</Link>
      </div>
    );
  }

  return <DesktopMailComposer onContact={onContact} />;
}

export default function DesktopCanvas({ active, onContact }: { active: boolean; onContact: () => void }) {
  const { lang } = useLang();
  const c = COPY[lang];
  const [windows, setWindows] = useState<WindowMap>(INITIAL_WINDOWS);
  const [wallpaperId, setWallpaperId] = useState<WallpaperId>(DEFAULT_WALLPAPER);
  const [wallpaperReady, setWallpaperReady] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);
  const [clockLabel, setClockLabel] = useState("LDN 00:00 / ATH 00:00");
  const [compact, setCompact] = useState(false);
  const zRef = useRef(10);
  // bringForward is called from event handlers that close over the render they
  // were created in, so the phone/desktop answer is read off a ref rather than
  // the state value -- the same trick desktop-portal.tsx's scroll loop uses to
  // read the editor.
  const compactRef = useRef(false);
  const dragRef = useRef<{ id: AppId; startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY);
    const sync = () => {
      compactRef.current = media.matches;
      setCompact(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  // Collapse to a single front window whenever the layout is (or becomes)
  // phone sized. The window kept is the highest-z open one, i.e. the one the
  // visitor last brought forward -- on first load that is About (z 5).
  useEffect(() => {
    if (!compact) return;
    setWindows((current) => {
      const open = (Object.keys(current) as AppId[]).filter((id) => current[id].open);
      if (open.length < 2) return current;
      const front = open.reduce((a, b) => (current[a].z >= current[b].z ? a : b));
      return Object.fromEntries(
        (Object.keys(current) as AppId[]).map((id) =>
          [id, id === front ? current[id] : { ...current[id], open: false }] as const,
        ),
      ) as WindowMap;
    });
  }, [compact]);

  useEffect(() => {
    const stored = window.localStorage.getItem(WALLPAPER_STORAGE_KEY);
    if (WALLPAPERS.some((wallpaper) => wallpaper.id === stored)) {
      setWallpaperId(stored as WallpaperId);
    }
    setWallpaperReady(true);
  }, []);

  // DS2 is Athens + London based (see CLAUDE.md), so the menu-bar clock shows
  // both, live -- set client-side only to avoid a server/client render mismatch
  // from the visitor's own clock.
  useEffect(() => {
    const cityTime = (timeZone: string) =>
      new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
    const tick = () => setClockLabel(`LDN ${cityTime("Europe/London")} / ATH ${cityTime("Europe/Athens")}`);
    tick();
    const id = window.setInterval(tick, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (wallpaperReady) window.localStorage.setItem(WALLPAPER_STORAGE_KEY, wallpaperId);
  }, [wallpaperId, wallpaperReady]);

  const bringForward = (id: AppId) => {
    const z = ++zRef.current;
    setWindows((current) => {
      const raised: WindowState = { ...current[id], open: true, z };
      if (!compactRef.current) return { ...current, [id]: raised };
      // Phone: opening an app replaces the one in front rather than stacking
      // on top of it, so the front window always has the whole screen.
      return Object.fromEntries(
        (Object.keys(current) as AppId[]).map((key) =>
          [key, key === id ? raised : { ...current[key], open: false }] as const,
        ),
      ) as WindowMap;
    });
  };

  const closeWindow = (id: AppId) => {
    setWindows((current) => ({ ...current, [id]: { ...current[id], open: false } }));
  };

  const launchApp = (id: LauncherId) => {
    if (id === "contact") {
      window.location.assign("/assistant/");
      return;
    }
    bringForward(id);
  };

  const startDrag = (id: AppId, event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const win = windows[id];
    dragRef.current = { id, startX: event.clientX, startY: event.clientY, originX: win.x, originY: win.y };
    bringForward(id);
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const x = drag.originX + event.clientX - drag.startX;
    const y = drag.originY + event.clientY - drag.startY;
    setWindows((current) => ({ ...current, [drag.id]: { ...current[drag.id], x, y } }));
  };

  const stopDrag = () => { dragRef.current = null; };
  const wallpaper = WALLPAPERS.find((item) => item.id === wallpaperId) ?? WALLPAPERS[0];
  const desktopStyle = { "--desktop-wallpaper": `url("${wallpaper.src}")` } as CSSProperties;

  return (
    <div className={s.desktop} style={desktopStyle} aria-hidden={!active}>
      <div className={s.desktopAura} aria-hidden="true" />
      <header className={s.menuBar}>
        <DS2Mark />
        <strong>DS2</strong>
        <nav><span>File</span><span>Edit</span><span>View</span><span>Go</span><span>Window</span><span>Help</span></nav>
        <div className={s.menuStatus} aria-label={c.statusLabel}>
          <button
            type="button"
            className={s.wallpaperMenuButton}
            onClick={() => setWallpaperPickerOpen((open) => !open)}
            aria-label={c.wallpaperChoose}
            aria-expanded={wallpaperPickerOpen}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5h15v13h-15zM6.7 16l3.7-4 2.6 2.5 2.2-2.1 2.4 3.6M16.7 8.5h.01" /></svg>
          </button>
          <span aria-hidden="true">◒</span><span aria-hidden="true">⌁</span><time>{clockLabel}</time>
        </div>
      </header>

      {wallpaperPickerOpen && (
        <section className={s.wallpaperPicker} aria-label={c.wallpapersLabel}>
          <header><div><strong>{c.wallpaperTitle}</strong><span>{c.wallpaperSubtitle}</span></div><button type="button" onClick={() => setWallpaperPickerOpen(false)} aria-label={c.wallpaperClose}>×</button></header>
          <div className={s.wallpaperGrid}>
            {WALLPAPERS.map((item) => (
              <button
                type="button"
                key={item.id}
                className={item.id === wallpaperId ? s.wallpaperSelected : undefined}
                onClick={() => setWallpaperId(item.id)}
                aria-pressed={item.id === wallpaperId}
              >
                <span style={{ backgroundImage: `url("${item.src}")` }}><i aria-hidden="true">✓</i></span>
                <strong>{item.name}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className={s.desktopIcons}>
        {APPS.map((app) => (
          <button type="button" key={app.id} onClick={() => launchApp(app.id)}>
            <AppGlyph app={app} />
            {c.labels[app.id]}
          </button>
        ))}
      </div>

      {(Object.keys(windows) as AppId[]).map((id) => {
        const win = windows[id];
        if (!win.open) return null;
        const style = { "--window-x": `${win.x}px`, "--window-y": `${win.y}px`, zIndex: win.z } as CSSProperties;
        return (
          <article className={`${s.window} ${s[`window_${id}`]}`} style={style} key={id} onPointerDown={() => bringForward(id)}>
            <header
              className={s.windowBar}
              onPointerDown={(event) => startDrag(id, event)}
              onPointerMove={moveDrag}
              onPointerUp={stopDrag}
              onPointerCancel={stopDrag}
            >
              <div className={s.traffic}><button type="button" aria-label={c.closeWindow.replace("{app}", c.labels[id])} onPointerDown={(e) => e.stopPropagation()} onClick={() => closeWindow(id)} /><i /><i /></div>
              <strong>{id === "mail" ? c.mailTitle : c.labels[id]}</strong>
              <span>{id === "blog" ? "BLOGS" : id.toUpperCase()}</span>
            </header>
            <WindowContent id={id} onContact={onContact} />
          </article>
        );
      })}

      <nav className={s.dock} aria-label={c.dockLabel}>
        {APPS.map((app) => (
          <button type="button" key={app.id} onClick={() => launchApp(app.id)} aria-label={c.labels[app.id]}>
            <AppGlyph app={app} />
            {app.id !== "contact" && windows[app.id].open && <i />}
          </button>
        ))}
      </nav>
    </div>
  );
}
