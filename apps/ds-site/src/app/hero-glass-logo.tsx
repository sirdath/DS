"use client";
/**
 * Hero — DS2 black-glass logo.
 *
 * React port of the `DS2 Glass Logo.html` Claude-Design handoff: the DS2 letter-
 * forms are extruded into 3D and wrapped in a black-glass MeshPhysicalMaterial
 * (transmission + dispersion + clearcoat) inside a canvas-generated studio
 * environment (vertical "window" panes drive the crisp glass reflections). A
 * line-draw → colour-flood → materialise intro plays once, then a continuous
 * camera tumble across four shot framings.
 *
 * Notes for future-Claude:
 * - Sibling of `hero-cinematic-logo.tsx`; same structure (lazy `import("three")`
 *   inside the effect, full GPU disposal on unmount). This one reproduces the
 *   *glass* study rather than the brushed-metal one.
 * - The 3 SVG paths are the DS2 letterforms — kept inline to keep the component
 *   self-contained, matching the cinematic sibling. (Worth extracting both to a
 *   shared `ds2-trace.ts` later; deliberately not refactoring the sibling here.)
 * - `prefers-reduced-motion` → renders one static framing, no rAF loop.
 * - Requires three >= r163 for `dispersion` (project is on r184).
 */

import { useEffect, useRef } from "react";
import type * as Three from "three";

const TRACE = {
  width: 1136,
  height: 285,
  paths: [
    "M 18 10 L 25 10 L 32 10 L 39 10 L 46 10 L 53 10 L 60 10 L 67 10 L 74 10 L 81 10 L 88 10 L 95 10 L 102 10 L 109 10 L 116 10 L 123 10 L 130 10 L 137 10 L 144 10 L 151 10 L 158 10 L 165 10 L 172 10 L 179 10 L 186 10 L 193 10 L 200 10 L 207 10 L 214 10 L 221 10 L 228 10 L 235 10 L 242 10 L 249 10 L 256 10 L 263 10 L 270 10 L 277 10 L 284 10 L 291 11 L 298 12 L 305 14 L 312 16 L 319 19 L 326 23 L 333 28 L 340 33 L 347 40 L 353 47 L 358 54 L 362 61 L 366 68 L 368 75 L 371 82 L 373 89 L 374 96 L 375 103 L 375 110 L 375 117 L 375 124 L 375 131 L 375 138 L 375 145 L 375 152 L 375 159 L 375 166 L 375 173 L 375 180 L 374 187 L 373 194 L 371 201 L 369 208 L 367 215 L 363 222 L 359 229 L 354 236 L 348 243 L 341 250 L 334 255 L 327 260 L 320 264 L 313 267 L 306 269 L 299 271 L 292 272 L 285 273 L 278 273 L 271 273 L 264 273 L 257 273 L 250 273 L 243 273 L 236 273 L 229 273 L 222 273 L 215 273 L 208 273 L 201 273 L 194 273 L 187 273 L 180 273 L 173 273 L 166 273 L 159 273 L 152 273 L 145 273 L 138 273 L 131 273 L 124 273 L 117 273 L 110 273 L 103 273 L 96 273 L 89 273 L 82 273 L 75 273 L 68 273 L 61 273 L 54 273 L 47 273 L 40 273 L 33 273 L 26 273 L 19 273 L 12 269 L 10 262 L 10 255 L 10 248 L 10 241 L 10 234 L 10 227 L 10 220 L 14 213 L 21 211 L 28 211 L 35 211 L 42 211 L 49 211 L 56 211 L 63 211 L 70 211 L 77 211 L 84 211 L 91 211 L 98 211 L 105 211 L 112 211 L 119 211 L 126 211 L 133 211 L 140 211 L 147 211 L 154 211 L 161 211 L 168 211 L 175 211 L 182 211 L 189 211 L 196 211 L 203 211 L 210 211 L 217 211 L 224 211 L 231 211 L 238 211 L 245 211 L 252 211 L 259 211 L 266 211 L 273 211 L 280 209 L 287 206 L 294 202 L 301 195 L 306 188 L 308 181 L 310 174 L 310 167 L 310 160 L 310 153 L 310 146 L 310 139 L 310 132 L 310 125 L 310 118 L 310 111 L 310 104 L 308 97 L 305 90 L 300 83 L 294 77 L 287 72 L 280 70 L 273 69 L 266 69 L 259 69 L 252 69 L 245 69 L 238 69 L 231 69 L 224 69 L 217 69 L 210 69 L 203 69 L 196 69 L 189 69 L 182 69 L 175 69 L 168 69 L 161 69 L 154 69 L 147 69 L 140 69 L 133 69 L 126 69 L 119 69 L 112 69 L 105 69 L 98 69 L 91 69 L 84 69 L 77 69 L 70 69 L 63 69 L 56 69 L 49 69 L 42 69 L 35 69 L 28 69 L 21 69 L 14 67 L 10 60 L 10 53 L 10 46 L 10 39 L 10 32 L 10 25 L 10 18 L 15 11 Z",
    "M 466 10 L 475 10 L 484 10 L 493 10 L 502 10 L 511 10 L 520 10 L 529 10 L 538 10 L 547 10 L 556 10 L 565 10 L 574 10 L 583 10 L 592 10 L 601 10 L 610 10 L 619 10 L 628 10 L 637 10 L 646 10 L 655 10 L 664 10 L 673 10 L 682 10 L 691 10 L 700 10 L 709 10 L 718 10 L 727 10 L 736 10 L 744 17 L 744 26 L 744 35 L 744 44 L 744 53 L 743 62 L 735 69 L 726 69 L 717 69 L 708 69 L 699 69 L 690 69 L 681 69 L 672 69 L 663 69 L 654 69 L 645 69 L 636 69 L 627 69 L 618 69 L 609 69 L 600 69 L 591 69 L 582 69 L 573 69 L 564 69 L 555 69 L 546 69 L 537 69 L 528 69 L 519 69 L 510 69 L 501 69 L 492 69 L 483 69 L 474 70 L 465 75 L 459 84 L 459 93 L 464 102 L 473 109 L 482 111 L 491 111 L 500 111 L 509 111 L 518 111 L 527 111 L 536 111 L 545 111 L 554 111 L 563 111 L 572 111 L 581 111 L 590 111 L 599 111 L 608 111 L 617 111 L 626 111 L 635 111 L 644 111 L 653 111 L 662 111 L 671 111 L 680 111 L 689 112 L 698 114 L 707 116 L 716 120 L 725 125 L 734 132 L 742 141 L 748 150 L 753 159 L 756 168 L 759 177 L 760 186 L 760 195 L 759 204 L 758 213 L 755 222 L 752 231 L 746 240 L 739 249 L 730 257 L 721 263 L 712 267 L 703 271 L 694 272 L 685 273 L 676 273 L 667 273 L 658 273 L 649 273 L 640 273 L 631 273 L 622 273 L 613 273 L 604 273 L 595 273 L 586 273 L 577 273 L 568 273 L 559 273 L 550 273 L 541 273 L 532 273 L 523 273 L 514 273 L 505 273 L 496 273 L 487 273 L 478 273 L 469 273 L 460 273 L 451 273 L 442 273 L 433 273 L 424 273 L 415 273 L 406 273 L 397 270 L 394 261 L 394 252 L 394 243 L 394 234 L 394 225 L 396 216 L 405 211 L 414 211 L 423 211 L 432 211 L 441 211 L 450 211 L 459 211 L 468 211 L 477 211 L 486 211 L 495 211 L 504 211 L 513 211 L 522 211 L 531 211 L 540 211 L 549 211 L 558 211 L 567 211 L 576 211 L 585 211 L 594 211 L 603 211 L 612 211 L 621 211 L 630 211 L 639 211 L 648 211 L 657 211 L 666 211 L 675 211 L 684 210 L 693 205 L 698 196 L 697 187 L 690 178 L 681 176 L 672 175 L 663 175 L 654 175 L 645 175 L 636 175 L 627 175 L 618 175 L 609 175 L 600 175 L 591 175 L 582 175 L 573 175 L 564 175 L 555 175 L 546 175 L 537 175 L 528 175 L 519 175 L 510 175 L 501 175 L 492 175 L 483 175 L 474 174 L 465 173 L 456 170 L 447 167 L 438 162 L 429 156 L 420 149 L 412 140 L 406 131 L 401 122 L 398 113 L 396 104 L 394 95 L 394 86 L 395 77 L 396 68 L 399 59 L 404 50 L 410 41 L 418 32 L 427 25 L 436 19 L 445 15 L 454 12 L 463 11 Z",
    "M 800 10 L 809 10 L 818 10 L 827 10 L 836 10 L 845 10 L 854 10 L 863 10 L 872 10 L 881 10 L 890 10 L 899 10 L 908 10 L 917 10 L 926 10 L 935 10 L 944 10 L 953 10 L 962 10 L 971 10 L 980 10 L 989 10 L 998 10 L 1007 10 L 1016 10 L 1025 10 L 1034 10 L 1043 10 L 1052 10 L 1061 11 L 1070 13 L 1079 16 L 1088 20 L 1097 26 L 1106 34 L 1113 43 L 1119 52 L 1123 61 L 1126 70 L 1127 79 L 1128 88 L 1128 97 L 1127 106 L 1124 115 L 1121 124 L 1117 133 L 1112 142 L 1104 151 L 1095 159 L 1086 165 L 1077 169 L 1068 172 L 1059 174 L 1050 175 L 1041 175 L 1032 175 L 1023 175 L 1014 175 L 1005 175 L 996 175 L 987 175 L 978 175 L 969 175 L 960 175 L 951 175 L 942 175 L 933 175 L 924 175 L 915 175 L 906 175 L 897 175 L 888 175 L 879 175 L 870 175 L 861 176 L 852 182 L 845 191 L 841 200 L 838 209 L 846 211 L 855 211 L 864 211 L 873 211 L 882 211 L 891 211 L 900 211 L 909 211 L 918 211 L 927 211 L 936 211 L 945 211 L 954 211 L 963 211 L 972 211 L 981 211 L 990 211 L 999 211 L 1008 211 L 1017 211 L 1026 211 L 1035 211 L 1044 211 L 1053 211 L 1062 211 L 1071 211 L 1080 211 L 1089 211 L 1098 211 L 1107 211 L 1116 211 L 1125 215 L 1127 224 L 1127 233 L 1127 242 L 1127 251 L 1127 260 L 1125 269 L 1116 273 L 1107 273 L 1098 273 L 1089 273 L 1080 273 L 1071 273 L 1062 273 L 1053 273 L 1044 273 L 1035 273 L 1026 273 L 1017 273 L 1008 273 L 999 273 L 990 273 L 981 273 L 972 273 L 963 273 L 954 273 L 945 273 L 936 273 L 927 273 L 918 273 L 909 273 L 900 273 L 891 273 L 882 273 L 873 273 L 864 273 L 855 273 L 846 273 L 837 273 L 828 273 L 819 273 L 810 273 L 801 273 L 792 273 L 783 273 L 776 266 L 775 257 L 775 248 L 775 239 L 775 230 L 775 221 L 775 212 L 775 203 L 776 194 L 778 185 L 781 176 L 784 167 L 790 158 L 796 149 L 804 140 L 813 132 L 822 126 L 831 121 L 840 117 L 849 114 L 858 112 L 867 111 L 876 111 L 885 111 L 894 111 L 903 111 L 912 111 L 921 111 L 930 111 L 939 111 L 948 111 L 957 111 L 966 111 L 975 111 L 984 111 L 993 111 L 1002 111 L 1011 111 L 1020 111 L 1029 111 L 1038 111 L 1047 110 L 1056 107 L 1064 99 L 1066 90 L 1064 81 L 1056 73 L 1047 70 L 1038 69 L 1029 69 L 1020 69 L 1011 69 L 1002 69 L 993 69 L 984 69 L 975 69 L 966 69 L 957 69 L 948 69 L 939 69 L 930 69 L 921 69 L 912 69 L 903 69 L 894 69 L 885 69 L 876 69 L 867 69 L 858 69 L 849 69 L 840 69 L 831 69 L 822 69 L 813 69 L 804 69 L 795 66 L 792 57 L 792 48 L 792 39 L 792 30 L 792 21 L 796 12 Z",
  ],
} as const;

// Periwinkle glass — matches the navbar DS2 mark (#6D5DD3). Lower transmission than the
// black-glass study so the purple body reads clearly while keeping a glossy clearcoat.
const LOOK = {
  color: 0x6d5dd3, transmission: 0.45, roughness: 0.06, ior: 1.5, thickness: 0.6,
  clearcoat: 1.0, clearcoatRoughness: 0.04, attenuationColor: 0x6d5dd3, attenuationDistance: 1.4,
  envMapIntensity: 1.8, metalness: 0.0, specularIntensity: 1.0, dispersion: 1.6, exposure: 1.05,
} as const;
const ENV_STOPS: readonly (readonly [number, string])[] = [
  [0, "#e7ecf4"], [0.42, "#efe6d4"], [0.72, "#e8d8bb"], [1, "#d4c09c"],
];
const DEG = Math.PI / 180;
const INTRO_DRAW = 1500;
const INTRO_FLOOD = 1100;
const INTRO = INTRO_DRAW + INTRO_FLOOD;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// Motion — anchored idle: one bounded damped mouse-tilt + a gentle breathe, camera locked.
const LERP = 0.08;
const TILT_MAX = 9 * DEG;
const BOB_AMP = 0.045;
const BOB_OMEGA = 0.16 * 2 * Math.PI;
// Fit-to-width: resting camera distance + max fraction of the viewport width the
// logo may span. On portrait/narrow screens the logo is scaled down to fit (it
// would otherwise overflow and clip, since the camera FOV is vertical).
const CAM_DIST = 3.0;
const FILL = 0.78;

// Three switchable dark-glass looks (try via the Glass pill / ?glass=).
type GlassId = "smoked" | "frosted" | "obsidian";
type GlassPreset = {
  transmission: number; thickness: number; attenuationDistance: number; roughness: number;
  clearcoatRoughness: number; dispersion: number; envMapIntensity: number; exposure: number;
  iridescence: number; iridescenceIOR: number; iridescenceThicknessRange: [number, number];
  darkEnv: boolean; coreDarken: number;
};
const GLASS: Record<GlassId, GlassPreset> = {
  // Real refractive glass; tinted by absorption (deep core, luminous edges).
  smoked:   { transmission: 0.95, thickness: 1.6, attenuationDistance: 0.45, roughness: 0.07, clearcoatRoughness: 0.04, dispersion: 1.0, envMapIntensity: 1.25, exposure: 0.98, iridescence: 0, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 400], darkEnv: false, coreDarken: 0 },
  // Sandblasted: the refraction blurs to a soft inner glow under a glossy clearcoat.
  frosted:  { transmission: 0.9,  thickness: 1.5, attenuationDistance: 0.5,  roughness: 0.28, clearcoatRoughness: 0.06, dispersion: 0.4, envMapIntensity: 1.15, exposure: 0.97, iridescence: 0, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 400], darkEnv: false, coreDarken: 0.22 },
  // Near-black body + dark studio env w/ crisp panes + a whisper of iridescence.
  obsidian: { transmission: 0.92, thickness: 1.7, attenuationDistance: 0.35, roughness: 0.08, clearcoatRoughness: 0.04, dispersion: 0.9, envMapIntensity: 1.3,  exposure: 0.95, iridescence: 0.35, iridescenceIOR: 1.25, iridescenceThicknessRange: [120, 360], darkEnv: true, coreDarken: 0.5 },
};

// Nebula cloud backdrop — domain-warped flow noise, airy white + soft periwinkle.
// Screen-space (gl_FragCoord); palette hardcoded sRGB (material is toneMapped:false).
const CLOUD_VERTEX = /* glsl */ `
  void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const CLOUD_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uBase;   // near-white base
  uniform vec3  uTint;   // accent
  uniform vec3  uTint2;  // soft accent
  float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vnoise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p){
    float v = 0.0, a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 6; i++){ v += a * vnoise(p); p = m * p; a *= 0.5; }
    return v;
  }
  void main(){
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = vec2(uv.x * aspect, uv.y) * 2.2;
    float t = uTime * 0.05;
    vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.5));
    vec2 r = vec2(fbm(p + 4.0 * q + vec2(1.7, 9.2) + t * 0.7), fbm(p + 4.0 * q + vec2(8.3, 2.8)));
    float f = fbm(p + 4.0 * r);
    float smoke = clamp(f * f * 1.15 - 0.06, 0.0, 1.0);
    vec3 c = mix(uBase, uTint2, smoke * 0.6);
    c = mix(c, uTint, clamp(dot(r, r) * 0.30, 0.0, 0.30));
    c = mix(c, uBase, 0.20);
    gl_FragColor = vec4(c, 1.0);
  }
`;

export default function HeroGlassLogo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let rafId = 0;
    let cleanupExtras: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      // Colours come from the active scheme's --hero-* tokens (fallback: periwinkle).
      const css = getComputedStyle(document.body);
      const cssVar = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
      const hexRgb = (hex: string): [number, number, number] => {
        const h = hex.replace("#", "").trim();
        const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
        const n = parseInt(full, 16);
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
      };
      const heroLogo = cssVar("--hero-logo", "#6d5dd3");
      const heroBase = cssVar("--hero-base", "#ffffff");
      const heroTint = cssVar("--hero-tint", "#6d5dd3");
      const heroTint2 = cssVar("--hero-tint2", "#9990f1");
      const heroTrace = cssVar("--hero-trace", "#4a3f9e");
      const heroLogoCore = cssVar("--hero-logo-core", heroLogo);
      const glassId = (document.body.getAttribute("data-glass") as GlassId) || "smoked";
      const preset = GLASS[glassId] ?? GLASS.smoked;

      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = preset.exposure;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();

      // Studio environment: warm gradient + bright vertical "window" panes → the
      // crisp soft-edged reflections that read as polished glass.
      const makeEnv = (): Three.CanvasTexture => {
        const c = document.createElement("canvas");
        c.width = 1024;
        c.height = 512;
        const x = c.getContext("2d");
        if (!x) throw new Error("2D context unavailable");
        const stops: readonly (readonly [number, string])[] = preset.darkEnv
          ? [[0, "#1c1f29"], [0.5, "#0c0e15"], [1, "#05060a"]]
          : ENV_STOPS;
        const g = x.createLinearGradient(0, 0, 0, 512);
        stops.forEach((s) => g.addColorStop(s[0], s[1]));
        x.fillStyle = g;
        x.fillRect(0, 0, 1024, 512);
        const pane = (cx: number, w: number, a: number) => {
          const gg = x.createLinearGradient(cx - w, 0, cx + w, 0);
          gg.addColorStop(0, "rgba(255,255,255,0)");
          gg.addColorStop(0.5, `rgba(255,255,255,${a})`);
          gg.addColorStop(1, "rgba(255,255,255,0)");
          x.fillStyle = gg;
          x.fillRect(cx - w, 40, w * 2, 300);
        };
        if (preset.darkEnv) {
          pane(300, 44, 1.0); pane(470, 24, 0.85); pane(720, 56, 1.0);
        } else {
          pane(300, 55, 0.9); pane(470, 30, 0.6); pane(720, 70, 0.8);
        }
        const t = new THREE.CanvasTexture(c);
        t.mapping = THREE.EquirectangularReflectionMapping;
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
      };

      const envTex = makeEnv();
      const env = pmrem.fromEquirectangular(envTex).texture;
      scene.environment = env; // reflections

      // Nebula cloud backdrop — screen-filling plane behind the logo; the glass refracts it.
      const cloudUniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uBase: { value: new THREE.Vector3(...hexRgb(heroBase)) },
        uTint: { value: new THREE.Vector3(...hexRgb(heroTint)) },
        uTint2: { value: new THREE.Vector3(...hexRgb(heroTint2)) },
      };
      const cloudGeo = new THREE.PlaneGeometry(60, 34);
      const cloudMat = new THREE.ShaderMaterial({
        uniforms: cloudUniforms,
        vertexShader: CLOUD_VERTEX,
        fragmentShader: CLOUD_FRAGMENT,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      });
      const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
      cloudMesh.position.set(0, 0, -6);
      cloudMesh.renderOrder = -1;
      scene.add(cloudMesh);

      const resize = () => {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const pr = renderer.getPixelRatio();
        cloudUniforms.uResolution.value.set(w * pr, h * pr);
        // Scale the logo to fit the visible width with margin. On wide screens this
        // resolves to the design size (1 unit); on portrait it shrinks so nothing clips.
        const visW = 2 * Math.tan((32 * DEG) / 2) * CAM_DIST * camera.aspect;
        spin.scale.setScalar(Math.min(1, visW * FILL) / size.x);
      };
      window.addEventListener("resize", resize);

      // Damped tilt toward the cursor — the only idle gesture beyond a gentle bob.
      const finePointer = window.matchMedia?.("(pointer: fine)").matches ?? true;
      let tiltX = 0, tiltY = 0, targetTX = 0, targetTY = 0;
      const onMove = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        targetTY = ((e.clientX - r.left) / r.width - 0.5) * 2 * TILT_MAX;
        targetTX = ((e.clientY - r.top) / r.height - 0.5) * 2 * TILT_MAX;
      };
      const onLeave = () => { targetTX = 0; targetTY = 0; };
      if (finePointer) {
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerleave", onLeave);
      }

      // Crisp edge specular + a back light so the glass body glows.
      const key = new THREE.DirectionalLight(0xffffff, preset.darkEnv ? 1.1 : 1.6);
      key.position.set(-5, 6, 4);
      const rim = new THREE.DirectionalLight(0xcfe0ff, preset.darkEnv ? 1.6 : 1.3);
      rim.position.set(5, -3, -6);
      const back = new THREE.DirectionalLight(0xffffff, preset.darkEnv ? 1.0 : 1.4);
      back.position.set(0, 2, -7);
      scene.add(key, rim, back);

      // Glass material.
      const material = new THREE.MeshPhysicalMaterial({ transparent: false });
      material.ior = LOOK.ior;
      material.clearcoat = LOOK.clearcoat;
      material.metalness = LOOK.metalness;
      material.specularIntensity = LOOK.specularIntensity;
      // Per-preset glass look (smoked / frosted / obsidian).
      material.transmission = preset.transmission;
      material.thickness = preset.thickness;
      material.attenuationDistance = preset.attenuationDistance;
      material.roughness = preset.roughness;
      material.clearcoatRoughness = preset.clearcoatRoughness;
      material.dispersion = preset.dispersion;
      material.envMapIntensity = preset.envMapIntensity;
      material.iridescence = preset.iridescence;
      material.iridescenceIOR = preset.iridescenceIOR;
      material.iridescenceThicknessRange = preset.iridescenceThicknessRange;
      // Decoupled colour: luminous surface tint + a deeper/darker absorption core
      // (Beer-Lambert) → dense dark glass body with glowing edges, not flat paint.
      material.color.set(heroLogo);
      const core = new THREE.Color(heroLogoCore);
      if (preset.coreDarken > 0) core.lerp(new THREE.Color(0x000000), preset.coreDarken * 0.5);
      material.attenuationColor.copy(core);
      material.needsUpdate = true;

      // SVG path → THREE.Shape (M / L only; X negated to match the trace orientation).
      const parseShape = (d: string, h: number) => {
        const tk = d.split(/\s+/).filter(Boolean);
        const s = new THREE.Shape();
        let i = 0;
        let started = false;
        while (i < tk.length) {
          const t = tk[i];
          if (t === "M" || t === "L") {
            const px = -parseFloat(tk[i + 1] ?? "0");
            const py = h - parseFloat(tk[i + 2] ?? "0");
            if (t === "M" || !started) {
              s.moveTo(px, py);
              started = true;
            } else {
              s.lineTo(px, py);
            }
            i += 3;
          } else {
            i += 1;
          }
        }
        return s;
      };

      const depth = TRACE.height * 0.3;
      const extrudeSettings = {
        depth,
        bevelEnabled: true,
        bevelThickness: depth * 0.12,
        bevelSize: TRACE.height * 0.018,
        bevelSegments: 3,
        curveSegments: 12,
      };

      const content = new THREE.Group();
      const geometries: Three.ExtrudeGeometry[] = [];
      TRACE.paths.forEach((d) => {
        const geo = new THREE.ExtrudeGeometry(parseShape(d, TRACE.height), extrudeSettings);
        geometries.push(geo);
        content.add(new THREE.Mesh(geo, material));
      });

      const box = new THREE.Box3().setFromObject(content);
      const size = new THREE.Vector3();
      box.getSize(size);
      const ctr = new THREE.Vector3();
      box.getCenter(ctr);
      content.position.set(-ctr.x, -ctr.y, -ctr.z);

      const spin = new THREE.Group();
      spin.add(content);
      scene.add(spin);
      spin.scale.setScalar(1 / size.x);
      resize();

      // Intro: line draw-on (front-facing) → colour flood → glass materialises.
      const parsePts = (d: string, h: number, z: number): number[] => {
        const tk = d.split(/\s+/).filter(Boolean);
        const pts: number[] = [];
        let i = 0;
        while (i < tk.length) {
          const t = tk[i];
          if (t === "M" || t === "L") {
            pts.push(-parseFloat(tk[i + 1] ?? "0"), h - parseFloat(tk[i + 2] ?? "0"), z);
            i += 3;
          } else {
            i += 1;
          }
        }
        return pts;
      };
      const FLOOD = new THREE.Color(heroTrace);
      const lineGroup = new THREE.Group();
      const lineGeoms: Three.BufferGeometry[] = [];
      const lineMats: Three.LineBasicMaterial[] = [];
      const lineSegs: { line: Three.Line; count: number }[] = [];
      TRACE.paths.forEach((d) => {
        const arr = new Float32Array(parsePts(d, TRACE.height, depth * 0.5 + TRACE.height * 0.004));
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
        g.setDrawRange(0, 0);
        const lm = new THREE.LineBasicMaterial({ color: FLOOD, transparent: true, opacity: 0.95 });
        const line = new THREE.Line(g, lm);
        lineGroup.add(line);
        lineGeoms.push(g);
        lineMats.push(lm);
        lineSegs.push({ line, count: arr.length / 3 });
      });
      content.add(lineGroup);

      const meshes = content.children.filter((m): m is Three.Mesh => (m as Three.Mesh).isMesh);
      meshes.forEach((m) => {
        m.visible = false;
        m.scale.z = 0.001;
      });
      material.emissive = new THREE.Color(0x000000);
      material.emissiveIntensity = 0;

      // Reduced motion → skip the intro + tumble, render one clean framing.
      if (reduceMotion) {
        lineGroup.visible = false;
        meshes.forEach((m) => {
          m.visible = true;
          m.scale.z = 1;
        });
        spin.rotation.set(0, Math.PI, 0);
        camera.position.set(0, 0, 3.05);
        camera.lookAt(0, 0, 0);
        cloudUniforms.uTime.value = 8.0;
        renderer.render(scene, camera);
      } else {
        let introDone = false;
        let introEnd = performance.now();
        const start = performance.now();

        const frame = () => {
          const now = performance.now();
          const el = now - start;
          cloudUniforms.uTime.value = el / 1000;

          if (!introDone) {
            camera.position.set(0, 0, 3.15);
            camera.lookAt(0, 0, 0);
            if (camera.fov !== 32) {
              camera.fov = 32;
              camera.updateProjectionMatrix();
            }
            spin.rotation.set(0, Math.PI, 0);
            if (el < INTRO_DRAW) {
              const p = easeOut(el / INTRO_DRAW);
              lineSegs.forEach((s, idx) => {
                const a = idx / lineSegs.length;
                const b = (idx + 1) / lineSegs.length;
                const lp = Math.max(0, Math.min(1, (p - a) / (b - a)));
                s.line.geometry.setDrawRange(0, Math.floor(lp * s.count));
              });
            } else if (el < INTRO) {
              const fp = (el - INTRO_DRAW) / INTRO_FLOOD;
              lineSegs.forEach((s) => {
                s.line.geometry.setDrawRange(0, s.count);
                (s.line.material as Three.LineBasicMaterial).opacity = 0.95 * (1 - fp);
              });
              meshes.forEach((m) => {
                m.visible = true;
                m.scale.z = 0.001 + 0.999 * easeOut(fp);
              });
              material.emissive.copy(FLOOD);
              material.emissiveIntensity = Math.sin(fp * Math.PI) * 0.6;
            } else {
              introDone = true;
              introEnd = now;
              lineGroup.visible = false;
              meshes.forEach((m) => {
                m.visible = true;
                m.scale.z = 1;
              });
              material.emissiveIntensity = 0;
            }
            renderer.render(scene, camera);
            rafId = requestAnimationFrame(frame);
            return;
          }

          const tsec = (now - introEnd) / 1000;
          // Anchored breathing + damped mouse-tilt. Rests AT the readable front pose
          // (Math.PI = correct orientation for the negated-X extrude); camera locked.
          if (!finePointer) targetTY = Math.sin(tsec * 0.18) * TILT_MAX * 0.5; // touch auto-drift
          tiltY += (targetTY - tiltY) * LERP;
          tiltX += (targetTX - tiltX) * LERP;
          const bob = Math.sin(tsec * BOB_OMEGA);
          spin.rotation.y = Math.PI + tiltY;
          spin.rotation.x = tiltX + bob * (1.2 * DEG);
          spin.rotation.z = 0;
          spin.position.x = 0;
          spin.position.y = bob * BOB_AMP;
          if (camera.fov !== 32) {
            camera.fov = 32;
            camera.updateProjectionMatrix();
          }
          camera.position.set(0, 0, 3.0);
          camera.lookAt(0, 0, 0);
          renderer.render(scene, camera);
          rafId = requestAnimationFrame(frame);
        };
        frame();
      }

      cleanupExtras = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerleave", onLeave);
        geometries.forEach((g) => g.dispose());
        lineGeoms.forEach((g) => g.dispose());
        lineMats.forEach((m) => m.dispose());
        material.dispose();
        cloudGeo.dispose();
        cloudMat.dispose();
        envTex.dispose();
        env.dispose();
        pmrem.dispose();
        renderer.dispose();
      };
    })();

    return () => {
      disposed = true;
      cleanupExtras?.();
    };
  }, []);

  return (
    <div className="hero-glass">
      <canvas ref={canvasRef} className="hero-glass__canvas" aria-label="DS2 glass logo" />
    </div>
  );
}
