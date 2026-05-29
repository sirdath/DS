import { Config } from "@remotion/cli/config";

// Marketing-video render settings.
// Keep these stable; per-composition overrides go in src/Root.tsx.
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(1); // safe default on a laptop — bump to (cores - 2) on the M5
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
