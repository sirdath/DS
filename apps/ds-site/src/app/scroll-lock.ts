/** One shared, reference-counted page-scroll lock.
 *
 *  Three things on the site need the page to stop scrolling behind them: the
 *  entry preloader curtain, the contact panel and the mobile nav sheet. More
 *  than one can be open at once (minimise the contact panel, open the nav
 *  sheet, tap the panel's floating tab, and both are live), so when each one
 *  captured and restored its OWN "previous overflow" the second one to lock
 *  recorded "hidden" as the original page state. Whichever cleanup ran last
 *  then re-applied that "hidden" and the page stayed unscrollable until a
 *  reload. Escape made it reachable: both dialogs close in the same React
 *  commit, so the restore order is whatever order React flushes cleanups in,
 *  not the order the dialogs were opened.
 *
 *  Hence one lock, not three. The first holder records the real page state and
 *  applies the lock; the last holder to let go puts that state back. Holders in
 *  between change nothing, so order and count no longer matter.
 *
 *  Lock BOTH html and body: globals.css sets `html { overflow-x: clip }`, and a
 *  non-visible overflow on the root element stops the browser propagating a
 *  body-only `overflow: hidden` up to the viewport, so locking body alone does
 *  not actually stop the page scrolling.
 */

let holders = 0;
let savedHtmlOverflow = "";
let savedBodyOverflow = "";

/** Take a hold on the page-scroll lock, and get back the matching release.
 *
 *  Call the returned function from the effect cleanup. It is idempotent, so a
 *  holder that unlocks early (the preloader unlocks the moment it reveals the
 *  site, well before it unmounts) can call it again later without unbalancing
 *  the count. Acquire/release pairs are also safe under React StrictMode's
 *  dev-only mount → cleanup → mount, since each mount takes a fresh hold with
 *  its own release. */
export function acquireScrollLock(): () => void {
  if (holders === 0) {
    savedHtmlOverflow = document.documentElement.style.overflow;
    savedBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  holders += 1;

  let released = false;
  return function releaseScrollLock() {
    if (released) return;
    released = true;
    holders = Math.max(0, holders - 1);
    if (holders === 0) {
      document.documentElement.style.overflow = savedHtmlOverflow;
      document.body.style.overflow = savedBodyOverflow;
    }
  };
}
