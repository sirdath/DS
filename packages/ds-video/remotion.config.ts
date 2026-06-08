import { Config } from "@remotion/cli/config";
import { existsSync } from "node:fs";

// Marketing-video render settings.
// Keep these stable; per-composition overrides go in src/Root.tsx.
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// 4+ races the Chrome page-pool on this machine ("Visited …/index.html but got
// no response" at getPool). 3 is the verified ceiling here; drop to 1 if a
// render ever fails to launch its pool.
Config.setConcurrency(3);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");

// Use system Google Chrome for rendering. The auto-downloaded chrome-headless-shell
// doesn't persist reliably on this machine (and CLI-downloaded binaries get
// Gatekeeper-quarantined), which hangs renders. System Chrome avoids both.
// Override with REMOTION_BROWSER=/path/to/chrome if needed.
const browser = process.env.REMOTION_BROWSER ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
if (existsSync(browser)) {
  Config.setBrowserExecutable(browser);
}
