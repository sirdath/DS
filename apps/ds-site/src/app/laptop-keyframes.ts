/**
 * The hand-tuned keyframe track for the laptop hero (#desktop-experience).
 *
 * The scroll arc used to be procedural: two smoothstep windows, one swinging
 * the lid open over progress 0.12-0.5 and one dollying the camera in over
 * 0.6-0.86, with the resting turn/pan fading out against the first. That gave
 * no way to say what the laptop should look like *partway* through, and its
 * 0.12 lead-in meant the first 12% of the section scrolled with nothing moving.
 *
 * It is now four poses the site owner sets by hand in the pose editor, joined
 * by plain linear interpolation. Motion therefore starts the instant progress
 * leaves 0, and every frame between two keyframes is exactly on the straight
 * line between them -- deliberately not eased. Do not reintroduce smoothstep
 * between keyframes: "make the movement linear" is the requirement, not a bug.
 *
 * This module is deliberately free of any three.js import. desktop-portal.tsx
 * loads laptop-3d.ts through a dynamic import() so three.js stays out of the
 * main bundle, and the editor needs the same defaults the scene ships with, so
 * the shared data lives here where both can import it statically.
 */

/**
 * One hand-tuned frame of the arc.
 *
 * - zoom: 0 = the wide "closed laptop" framing, 1 = the tight framing the
 *   screen morph hands over from. Drives camera position, FOV and aim together.
 * - offsetX / offsetY: pan as a fraction of the visible frame, + moves the
 *   laptop right / up.
 * - scale: 1 = the shipped framing, >1 pulls the camera in so the laptop
 *   renders bigger.
 * - rotationX / rotationY: degrees of extra rotation about the world horizontal
 *   and vertical axes, taken about the closed-pose centre.
 * - lidDeg: the lid angle, 0 = the model's authored open pose, 110 = shut flat
 *   onto the keyboard.
 */
export type LaptopPose = {
  zoom: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  rotationX: number;
  rotationY: number;
  lidDeg: number;
};

/**
 * Where desktop-portal.tsx starts morphing the screen content from the
 * rendered glass into the full-viewport desktop overlay (its `flatten` window
 * opens here). The last keyframe sits exactly on it: it is the last frame the
 * 3D pose is fully in charge of.
 */
export const MORPH_START = 0.86;

/**
 * The four keyframes' fixed scroll positions: the resting frame, then the
 * span up to the morph split into three equal segments. Computed rather than
 * written out so they stay exactly equidistant if MORPH_START ever moves.
 */
export const KEYFRAME_PROGRESS: readonly number[] = [
  0,
  MORPH_START / 3,
  (MORPH_START * 2) / 3,
  MORPH_START,
];

export const KEYFRAME_LABELS: ReadonlyArray<{ short: string; title: string }> = [
  { short: "Rest", title: "Resting frame, before any scrolling" },
  { short: "Third", title: "One third of the way to the morph" },
  { short: "Two thirds", title: "Two thirds of the way to the morph" },
  { short: "Morph", title: "Last frame before the screen morphs" },
];

/**
 * Shipped defaults: the site owner's own finalized poses.
 *
 * Every one of these four was set by hand in the pose editor and pasted back
 * verbatim. They are the arc as signed off, not a computed starting point to
 * refine, so do not recompute, round or "tidy" them.
 *
 * What the numbers do. Across KF0-KF2 the lid swings from 87deg (nearly shut)
 * to the model's fully open pose while the laptop holds a fixed turn and sits
 * low in frame (offsetY -0.2, dipping to -0.25). KF2-KF3 then leaves the lid
 * alone and dollies the camera in instead (zoom 0 to 1), lifting the pan back
 * to centre and squaring the turn off from 6deg to 2deg, so the laptop is
 * nearly face-on by the time the screen morph takes over at MORPH_START.
 *
 * rotationY stays at 6deg for the first two thirds by explicit request: the
 * laptop stays turned while it opens, rather than straightening out early the
 * way the old entry-fade made it do.
 */
export const DEFAULT_KEYFRAMES: readonly LaptopPose[] = [
  { zoom: 0, offsetX: 0, offsetY: -0.2, scale: 1, rotationX: 0, rotationY: 6, lidDeg: 87 },    // KF0 @ 0 -- Resting frame
  { zoom: 0, offsetX: 0, offsetY: -0.2, scale: 1, rotationX: 0, rotationY: 6, lidDeg: 51.5 },  // KF1 @ 0.2867 -- One third to the morph
  { zoom: 0, offsetX: 0, offsetY: -0.25, scale: 1, rotationX: 0, rotationY: 6, lidDeg: 0 },    // KF2 @ 0.5733 -- Two thirds to the morph
  { zoom: 1, offsetX: 0, offsetY: 0, scale: 1, rotationX: 0, rotationY: 2, lidDeg: 0 },        // KF3 @ 0.86 -- Last frame before the morph
];

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/**
 * The pose at any scroll position, by linear interpolation between the two
 * keyframes that bracket it. Before the first keyframe and after the last, the
 * nearest keyframe is held exactly -- past MORPH_START the screen morph owns
 * the frame, so the 3D pose simply stops where KF3 left it.
 */
export function poseAt(keyframes: readonly LaptopPose[], progress: number): LaptopPose {
  const last = KEYFRAME_PROGRESS.length - 1;
  const first = keyframes[0]!;
  if (progress <= KEYFRAME_PROGRESS[0]!) return first;
  if (progress >= KEYFRAME_PROGRESS[last]!) return keyframes[last]!;

  let index = 0;
  while (index < last - 1 && progress >= KEYFRAME_PROGRESS[index + 1]!) index += 1;
  const from = KEYFRAME_PROGRESS[index]!;
  const to = KEYFRAME_PROGRESS[index + 1]!;
  const t = clamp((progress - from) / (to - from));
  const a = keyframes[index]!;
  const b = keyframes[index + 1]!;
  const mix = (start: number, end: number) => start + (end - start) * t;

  return {
    zoom: mix(a.zoom, b.zoom),
    offsetX: mix(a.offsetX, b.offsetX),
    offsetY: mix(a.offsetY, b.offsetY),
    scale: mix(a.scale, b.scale),
    rotationX: mix(a.rotationX, b.rotationX),
    rotationY: mix(a.rotationY, b.rotationY),
    lidDeg: mix(a.lidDeg, b.lidDeg),
  };
}
