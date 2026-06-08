import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

/**
 * Sound design for "Brief → Shipped" — ElevenLabs (text-to-SFX), user-approved.
 *
 * Only the sounds generated so far are wired. Beats that need a sound we don't
 * have yet (transitions, AI send/reply, riser, deploy impact, logo) stay SILENT
 * on purpose — we add them as the files arrive. No placeholder sounds.
 *
 * Frames map to the timeline constants in BriefToShipped.tsx (30fps, 1050 total).
 */

const SFX = {
  type: "type.mp3", // soft mechanical keyboard (~0.9s)
  click: "click.mp3", // soft premium UI click (trimmed, ~0.18s)
  confirm: "confirm.mp3", // clean minimal success chime (~2s)
} as const;

type Sfx = keyof typeof SFX;
interface Cue {
  at: number;
  sfx: Sfx;
  vol: number;
}

const CUES: Cue[] = [
  // ── typing ──────────────────────────────────────────────────────────
  { at: 14, sfx: "type", vol: 0.5 }, // brief
  { at: 270, sfx: "type", vol: 0.44 }, // code
  { at: 301, sfx: "type", vol: 0.44 }, // code (extend to cover the scene)

  // ── structure blocks snapping in ────────────────────────────────────
  { at: 150, sfx: "click", vol: 0.46 },
  { at: 164, sfx: "click", vol: 0.42 },
  { at: 188, sfx: "click", vol: 0.42 },

  // ── code → UI reveals ───────────────────────────────────────────────
  { at: 288, sfx: "click", vol: 0.34 }, // headline lands
  { at: 312, sfx: "click", vol: 0.32 }, // card row

  // ── AI source chips ─────────────────────────────────────────────────
  { at: 564, sfx: "click", vol: 0.3 },
  { at: 571, sfx: "click", vol: 0.3 },
  { at: 578, sfx: "click", vol: 0.3 },

  // ── Lighthouse → 100 ────────────────────────────────────────────────
  { at: 712, sfx: "confirm", vol: 0.6 },

  // ── deploy log ticks ────────────────────────────────────────────────
  { at: 836, sfx: "click", vol: 0.3 },
  { at: 845, sfx: "click", vol: 0.3 },
  { at: 854, sfx: "click", vol: 0.3 },

  // ── awaiting files (silent until generated) ─────────────────────────
  // whoosh      → 132, 268, 464, 656, 806   (scene transitions)
  // send        → 472, 810                  (AI send · URL → live)
  // notify      → 496                       (AI reply arrives)
  // riser       → 664                       (Lighthouse dial filling)
  // impact      → 814, 938                  (shipped · logo sting)
  // whoosh-soft → 892                       (closing line)
];

export const SfxTrack: React.FC = () => (
  <>
    {CUES.map((c, i) => (
      <Sequence key={`${c.sfx}-${c.at}-${i}`} from={c.at} layout="none" name={`sfx:${c.sfx}@${c.at}`}>
        <Audio src={staticFile(`sfx/${SFX[c.sfx]}`)} volume={c.vol} />
      </Sequence>
    ))}
  </>
);
