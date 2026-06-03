"use client";
/**
 * Hero — cinematic 3D DS² logo.
 *
 * React port of the `logo-cinematic.html` Claude-Design handoff (extruded letter-
 * forms, ACES tone-mapping, warm key / cool rim lights, brushed-metal physical
 * material, 4 cinematic shot framings looping continuously over ~9.4s, with a
 * gentle yaw/pitch tumble underneath).
 *
 * Notes for future-Claude:
 * - Lazy-loads `three` + `RoomEnvironment` inside the effect (matches the OGL
 *   dynamic-import pattern used elsewhere in the hero), so the bundle stays
 *   light + the rest of the page renders before WebGL spins up.
 * - All GPU resources (geometries, material, PMREM, renderer) are disposed on
 *   unmount — this is a hero, but Next dev re-mounts on HMR so cleanup matters.
 * - The 3 SVG paths are the DS² letterforms (same source as the wordmark SVG
 *   that previously lived in `page.tsx`). Kept inline here to make the component
 *   self-contained.
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

type ShotFraming = {
  name: string;
  dur: number;
  from: { pos: [number, number, number]; tgt: [number, number, number] };
  to: { pos: [number, number, number]; tgt: [number, number, number] };
  fov: number;
};

const SHOTS: readonly ShotFraming[] = [
  { name: "A", dur: 3.0, from: { pos: [0, 0, 3.05], tgt: [0, 0, 0] },        to: { pos: [0, 0, 3.0],  tgt: [0, 0, 0] },        fov: 32 },
  { name: "B", dur: 2.0, from: { pos: [0.28, 0.12, 1.30], tgt: [0.30, 0.10, 0] }, to: { pos: [0.26, 0.11, 1.18], tgt: [0.30, 0.10, 0] }, fov: 26 },
  { name: "C", dur: 2.0, from: { pos: [-0.30, -0.12, 1.28], tgt: [-0.32, -0.10, 0] }, to: { pos: [-0.34, -0.12, 1.24], tgt: [-0.30, -0.10, 0] }, fov: 26 },
  { name: "D", dur: 2.4, from: { pos: [0.18, 0.10, 2.2], tgt: [0, 0, 0] },    to: { pos: [0, 0, 3.0],  tgt: [0, 0, 0] },        fov: 30 },
];
const TOTAL = SHOTS.reduce((s, sh) => s + sh.dur, 0);

const lerp3 = (a: readonly [number, number, number], b: readonly [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (t: number) => t * t * (3 - 2 * t);

export default function HeroCinematicLogo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let rafId = 0;
    let cleanupExtras: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      const { RoomEnvironment } = await import("three/examples/jsm/environments/RoomEnvironment.js");
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

      // Studio reflections.
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;

      const resize = () => {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", resize);

      // Sharp warm key (upper-left) + cool rim (lower-right behind) + low cool ambient.
      const key = new THREE.DirectionalLight(0xfff4e8, 3.0);
      key.position.set(-6, 7, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0x6f8cff, 1.6);
      rim.position.set(5, -3, -6);
      scene.add(rim);
      scene.add(new THREE.AmbientLight(0x223052, 0.25));

      // SVG path → THREE.Shape (M / L only; the trace data is line-only).
      const parseShape = (d: string, h: number) => {
        const tk = d.split(/\s+/).filter(Boolean);
        const s = new THREE.Shape();
        let i = 0;
        let started = false;
        while (i < tk.length) {
          const t = tk[i];
          if (t === "M" || t === "L") {
            const x = parseFloat(tk[i + 1] ?? "0");
            const y = h - parseFloat(tk[i + 2] ?? "0");
            if (t === "M" || !started) {
              s.moveTo(x, y);
              started = true;
            } else {
              s.lineTo(x, y);
            }
            i += 3;
          } else {
            i += 1;
          }
        }
        return s;
      };

      const depth = TRACE.height * 0.30;
      const extrudeSettings = {
        depth,
        bevelEnabled: true,
        bevelThickness: depth * 0.11,
        bevelSize: TRACE.height * 0.016,
        bevelSegments: 2,
        curveSegments: 10,
      };

      const material = new THREE.MeshPhysicalMaterial({
        color: 0x1A1A1E,
        metalness: 0.9,
        roughness: 0.25,
        clearcoat: 0.6,
        clearcoatRoughness: 0.3,
        envMapIntensity: 1.25,
      });

      const content = new THREE.Group();
      const geometries: Three.ExtrudeGeometry[] = [];
      TRACE.paths.forEach((d) => {
        const geo = new THREE.ExtrudeGeometry(parseShape(d, TRACE.height), extrudeSettings);
        geometries.push(geo);
        content.add(new THREE.Mesh(geo, material));
      });

      // Center the wordmark on the origin.
      const box = new THREE.Box3().setFromObject(content);
      const size = new THREE.Vector3();
      box.getSize(size);
      const ctr = new THREE.Vector3();
      box.getCenter(ctr);
      content.position.set(-ctr.x, -ctr.y, -ctr.z);

      const spin = new THREE.Group();
      spin.add(content);
      scene.add(spin);
      spin.scale.setScalar(1 / size.x); // normalize the logo to 1 unit wide

      resize();

      const start = performance.now();
      const tick = () => {
        const now = performance.now();
        const tg = ((now - start) / 1000) % TOTAL;

        // Continuous front-facing tumble underneath the shot cuts.
        const tsec = (now - start) / 1000;
        spin.rotation.y = Math.PI + Math.sin(tsec * 0.62) * ((32 * Math.PI) / 180);
        spin.rotation.x = Math.sin(tsec * 0.5) * ((8 * Math.PI) / 180);

        // Find the active shot + lerp.
        let acc = 0;
        let shot = SHOTS[0]!;
        let local = 0;
        for (const sh of SHOTS) {
          if (tg < acc + sh.dur) {
            shot = sh;
            local = (tg - acc) / sh.dur;
            break;
          }
          acc += sh.dur;
        }
        const e = smooth(local);
        const pos = lerp3(shot.from.pos, shot.to.pos, e);
        const tgt = lerp3(shot.from.tgt, shot.to.tgt, e);
        camera.position.set(pos[0], pos[1], pos[2]);
        camera.lookAt(tgt[0], tgt[1], tgt[2]);
        if (camera.fov !== shot.fov) {
          camera.fov = shot.fov;
          camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);
        rafId = requestAnimationFrame(tick);
      };
      tick();

      cleanupExtras = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resize);
        geometries.forEach((g) => g.dispose());
        material.dispose();
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
    <div className="hero-cinematic">
      <div className="hero-cinematic__bg" aria-hidden="true" />
      <canvas ref={canvasRef} className="hero-cinematic__canvas" aria-label="DS² logo" />
    </div>
  );
}
