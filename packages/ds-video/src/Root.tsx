import { Composition } from "remotion";
import { AntiConsultancyReel } from "./compositions/AntiConsultancyReel";

const FPS = 30;

// Compositions registry. Add new concepts as separate Composition entries —
// each can ship to its own render output and length cut.
export const Root: React.FC = () => {
  return (
    <>
      {/* C1 — Anti-Consultancy Reel (recommended v1, see docs/library/04) */}
      <Composition
        id="AntiConsultancyReel"
        component={AntiConsultancyReel}
        durationInFrames={60 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
