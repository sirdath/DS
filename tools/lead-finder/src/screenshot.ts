/** Capture a homepage screenshot via headless Chrome → PNG Buffer (or null on failure). */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileP = promisify(execFile);

const CHROME =
  process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

export async function screenshot(url: string, timeoutMs = 25000): Promise<Buffer | null> {
  const dir = await mkdtemp(join(tmpdir(), "ds2-shot-"));
  const out = join(dir, "shot.png");
  try {
    await execFileP(
      CHROME,
      [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--no-sandbox",
        "--force-device-scale-factor=1",
        "--window-size=1280,800",
        "--default-background-color=FFFFFFFF",
        "--virtual-time-budget=7000",
        `--screenshot=${out}`,
        url,
      ],
      { timeout: timeoutMs },
    );
    const buf = await readFile(out);
    return buf.length > 0 ? buf : null;
  } catch {
    return null;
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
