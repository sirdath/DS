import { Composition } from "remotion";
import { AntiConsultancyReel } from "./compositions/AntiConsultancyReel";
import { DS2BrandReel } from "./compositions/DS2BrandReel";
import { BriefToShipped } from "./compositions/BriefToShipped";

const FPS = 30;

// Compositions registry. Add new concepts as separate Composition entries —
// each can ship to its own render output and length cut.
export const Root: React.FC = () => {
  return (
    <>
      {/* C3 — Brief → Shipped (35s capability reel: web + AI + engineering as craft) */}
      <Composition
        id="BriefToShipped"
        component={BriefToShipped}
        durationInFrames={35 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* C1 — Anti-Consultancy Reel (recommended v1, see docs/library/04) */}
      <Composition
        id="AntiConsultancyReel"
        component={AntiConsultancyReel}
        durationInFrames={60 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
      {/* C2 — DS2 Brand Reel (26s identity promo, dark/periwinkle/smoke) */}
      <Composition
        id="DS2BrandReel"
        component={DS2BrandReel}
        durationInFrames={26 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
      />
    </>
  );
};
