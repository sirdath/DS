import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DEFAULT_KEYFRAMES, type LaptopPose, poseAt } from "./laptop-keyframes";

export type ScreenPoint = [number, number];
export type ScreenQuad = [ScreenPoint, ScreenPoint, ScreenPoint, ScreenPoint];

export interface LaptopSceneController {
  render(progress: number): ScreenQuad;
  resize(): void;
  /**
   * Dev-only hand-tuning channel. The in-page pose editor swaps the whole
   * four-pose track for the one it is currently editing, so what renders while
   * the panel is open is exactly what those keyframes would ship as -- at any
   * progress, not just the resting frame. Null, which is every production
   * render, restores DEFAULT_KEYFRAMES.
   */
  setEditorKeyframes(keyframes: readonly LaptopPose[] | null): void;
  dispose(): void;
}

const MODEL_URL = "/laptop/scene.gltf";

// The convention each keyframe's lidDeg is expressed in: 0deg is the model's
// own authored "open for display" pose, measured on this model as the glass
// standing 110deg off the deck (its panel leans ~20deg back from vertical);
// 110deg is therefore fully closed, tipped forward flat onto the keyboard, and
// positive rotation about the hinge's local X is that forward direction. The
// resting frame's 87deg is already cracked open rather than fully shut.

// Empirically measured, not derived: at the resting pose the rendered top
// edge sloped ~0.2deg down to the right (perspective on the turned, panned
// laptop, not a bug -- see the comment at the render() call site). Tune by
// eye if the keyframes change enough to shift it; sign flips the direction.
const LEVEL_CORRECTION_DEG = -0.22;

const DEGENERATE_QUAD: ScreenQuad = [[0, 0], [0, 0], [0, 0], [0, 0]];

/**
 * The four world-space corners of a flat display mesh, in ScreenQuad order
 * (top-left, top-right, bottom-right, bottom-left).
 *
 * Deliberately not a bounding box. The glass is a flat rectangle, but nothing
 * in the model is axis-aligned to it: the authored pose has the lid open at
 * ~110deg, so the panel sits at ~20deg inside every box you can take of it, in
 * the mesh's own local space as much as in world space. Measured on this
 * model, the panel's local box is 34.4 x 7.6 x 20.9 for a rectangle that is
 * really 34.4 x 22.3 — so reading corners off a box face put the top edge 7.6
 * units in front of the real one, and the HTML overlay sheared off the glass
 * the moment the lid moved. Fitting the plane the mesh actually lies in gives
 * the true rectangle at any lid angle.
 */
function screenQuadWorld(mesh: THREE.Mesh): THREE.Vector3[] | null {
  const position = mesh.geometry.getAttribute("position");
  const normals = mesh.geometry.getAttribute("normal");
  if (!position || !normals || position.count < 3) return null;

  const normal = new THREE.Vector3();
  const sample = new THREE.Vector3();
  for (let index = 0; index < normals.count; index += 1) {
    normal.add(sample.fromBufferAttribute(normals, index));
  }
  if (normal.lengthSq() < 1e-6) return null; // not a single-facing flat panel
  normal.normalize();

  // Any two in-plane axes will do; the rectangle is recovered from the extents
  // along them, not from the choice of axes.
  const seed = Math.abs(normal.x) > 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const axisU = seed.addScaledVector(normal, -seed.dot(normal)).normalize();
  const axisV = new THREE.Vector3().crossVectors(normal, axisU);

  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  let sumW = 0;
  for (let index = 0; index < position.count; index += 1) {
    sample.fromBufferAttribute(position, index);
    const u = sample.dot(axisU);
    const v = sample.dot(axisV);
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
    sumW += sample.dot(normal);
  }
  const w = sumW / position.count;
  const at = (u: number, v: number) =>
    new THREE.Vector3()
      .addScaledVector(axisU, u)
      .addScaledVector(axisV, v)
      .addScaledVector(normal, w)
      .applyMatrix4(mesh.matrixWorld);

  // Ordering is resolved once, in the authored open pose, where the lid stands
  // upright: world +Y is up and world +X is right. From then on the corners
  // ride the hinge as a rigid set, so the order stays valid at every angle.
  const corners = [at(minU, minV), at(minU, maxV), at(maxU, minV), at(maxU, maxV)].sort((a, b) => b.y - a.y);
  const [topLeft, topRight] = corners.slice(0, 2).sort((a, b) => a.x - b.x);
  const [bottomLeft, bottomRight] = corners.slice(2).sort((a, b) => a.x - b.x);
  if (!topLeft || !topRight || !bottomLeft || !bottomRight) return null;
  return [topLeft, topRight, bottomRight, bottomLeft];
}

export function createLaptopScene(canvas: HTMLCanvasElement): LaptopSceneController {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.05, 400);

  scene.add(new THREE.HemisphereLight(0xa9c8f5, 0x080a0d, 1.15));
  const keyLight = new THREE.DirectionalLight(0xc6ddff, 5.3);
  keyLight.position.set(-30, 45, 48);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  // DirectionalLightShadow defaults its camera to a 10x10 unit box centered on
  // the light's target (the origin), which is a fraction of this model's ~54
  // unit span. Everything outside that box never self-shadows, and the model
  // surfaces that do sit inside it (trackpad, lid) got a low-resolution shadow
  // map stretched over a tiny area -- the "square shadow" artifact seen there.
  // Widened to comfortably cover the whole model regardless of pose.
  keyLight.shadow.camera.left = -35;
  keyLight.shadow.camera.right = 35;
  keyLight.shadow.camera.top = 35;
  keyLight.shadow.camera.bottom = -35;
  keyLight.shadow.camera.near = 10;
  keyLight.shadow.camera.far = 150;
  keyLight.shadow.camera.updateProjectionMatrix();
  keyLight.shadow.normalBias = 0.05;
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0x76b9ff, 3.8);
  rim.position.set(34, 21, -27);
  scene.add(rim);
  const warm = new THREE.PointLight(0xff85ae, 1800, 80, 2);
  warm.position.set(-28, 9, 19);
  scene.add(warm);

  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 40),
    new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.55 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.1;
  shadow.receiveShadow = true;
  scene.add(shadow);

  let pivot: THREE.Object3D | null = null;
  // The whole laptop, plus the transform it was loaded with. The editor's
  // rotation composes onto these rather than replacing them, so restoring the
  // originals is exact rather than "close to zero".
  let modelRoot: THREE.Object3D | null = null;
  const modelBasePosition = new THREE.Vector3();
  const modelBaseQuaternion = new THREE.Quaternion();
  let editorKeyframes: readonly LaptopPose[] | null = null;
  let orientationApplied = false;
  let screenCornersLocal: THREE.Vector3[] | null = null;
  let modelCenter = new THREE.Vector3(0, 10.8, -4.5);
  let modelSizeLength = 54;
  // The open-pose bounding box (above) isn't a useful reference for framing
  // the CLOSED laptop — its center sits roughly at screen height, well above
  // where a shut laptop actually is. Framing the opening establishing shot
  // with it pointed the camera at empty space below the whole model, which
  // rendered as a blank canvas at low scroll progress. The base's own box is
  // a much closer stand-in for "closed laptop" (lid folds flat against it).
  let closedCenter = new THREE.Vector3(0, -0.35, 0);
  let closedSizeLength = 43;
  // The scroll-driven animation loop (in desktop-portal.tsx) settles and
  // stops itself within well under a second of the last scroll event — long
  // before an ~11MB model finishes fetching and parsing. Without this, a
  // visitor who scrolls to this section and then pauses (to read the quote,
  // say) sees a blank canvas indefinitely: nothing re-renders once the model
  // becomes ready, because nothing tells the stopped loop to wake up.
  // Re-rendering once here, the instant load finishes, fixes that regardless
  // of whether the user happens to be actively scrolling at that moment.
  let lastProgress = 0;

  const loader = new GLTFLoader();
  loader.load(MODEL_URL, (gltf) => {
    const root = gltf.scene;
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    scene.add(root);
    modelRoot = root;
    modelBasePosition.copy(root.position);
    modelBaseQuaternion.copy(root.quaternion);

    // Find the base/lid split: a node with 3 children where one subtree has
    // far more meshes than the others (the base, keyboard/deck detail) and a
    // second has a meaningful but smaller count (the lid/screen assembly).
    // Verified against this specific model: base=44 meshes, lid=17, plus one
    // empty placeholder node with 0.
    let baseNode: THREE.Object3D | null = null;
    let lidNode: THREE.Object3D | null = null;
    root.traverse((obj) => {
      if (baseNode || obj.children.length !== 3) return;
      const counts = obj.children.map((child) => {
        let n = 0;
        child.traverse((o) => { if ((o as THREE.Mesh).isMesh) n += 1; });
        return n;
      });
      const maxIdx = counts.indexOf(Math.max(...counts));
      const midIdx = counts.findIndex((n, i) => i !== maxIdx && n > 5);
      if ((counts[maxIdx] ?? 0) > 20 && midIdx >= 0) {
        baseNode = obj.children[maxIdx] ?? null;
        lidNode = obj.children[midIdx] ?? null;
      }
    });

    if (!baseNode || !lidNode) return; // model structure didn't match — leave scene empty rather than throw

    const baseBox = new THREE.Box3().setFromObject(baseNode);
    const lidBox = new THREE.Box3().setFromObject(lidNode);
    const fullBox = new THREE.Box3().setFromObject(root);

    modelCenter = fullBox.getCenter(new THREE.Vector3());
    modelSizeLength = fullBox.getSize(new THREE.Vector3()).length();
    closedCenter = baseBox.getCenter(new THREE.Vector3());
    closedSizeLength = baseBox.getSize(new THREE.Vector3()).length();

    // Hinge = the seam where the base's back edge meets the lid, at the
    // base's top surface. Re-pivoting (rather than rotating the lid node
    // directly, which has no transform of its own and would spin around
    // world origin) is what makes this an actual hinge instead of the lid
    // orbiting through the base.
    //
    // The three boxes above are WORLD boxes (Box3.setFromObject always is),
    // but Object3D.position is read in the PARENT's space, and this glTF's
    // lid parent carries the exporter's Z-up -> Y-up rotation. Feeding world
    // numbers straight into .position therefore mapped (y, z) -> (-z, y) and
    // parked the hinge ~12 units above the deck instead of on it, so the lid
    // swung through the base on the way open. Converting through the parent
    // is what keeps the pivot on the seam.
    const lidParent = (lidNode as THREE.Object3D).parent;
    if (!lidParent) return;
    const hingePivot = new THREE.Group();
    lidParent.add(hingePivot);
    lidParent.updateWorldMatrix(true, false);
    hingePivot.position.copy(
      lidParent.worldToLocal(
        new THREE.Vector3((lidBox.min.x + lidBox.max.x) / 2, baseBox.max.y, baseBox.min.z),
      ),
    );
    hingePivot.attach(lidNode);
    pivot = hingePivot;

    // The screen surface: the one mesh in the lid whose material carries an
    // emissive map (the glowing display), identified by its texture rather
    // than a name, since Sketchfab's auto-export node names are opaque
    // hashes with no semantic meaning.
    let screenMesh: THREE.Mesh | null = null;
    (lidNode as THREE.Object3D).traverse((obj) => {
      if (screenMesh) return;
      const mesh = obj as THREE.Mesh;
      const material = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mesh.isMesh && material?.emissiveMap) screenMesh = mesh;
    });

    const worldCorners = screenMesh ? screenQuadWorld(screenMesh) : null;
    if (worldCorners) screenCornersLocal = worldCorners.map((p) => hingePivot.worldToLocal(p));

    render(lastProgress);
  });

  const resize = () => {
    const width = Math.max(1, canvas.clientWidth || window.innerWidth);
    const height = Math.max(1, canvas.clientHeight || window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  /**
   * Rotates the whole laptop about the closed-pose centre by composing an extra
   * rotation onto the transform the model loaded with. Rotating about that point
   * (rather than the root's own origin) keeps the laptop in frame as it turns.
   *
   * For an extra rotation R about world point P, the world transform of a local
   * point p goes from W(p) to R * (W(p) - P) + P, which is exactly a root
   * quaternion of R∘Rbase and a root position of R * (Tbase - P) + P. Scale
   * survives because Object3D composes as T * R * S, so S stays on the inside.
   */
  const applyModelOrientation = (rotationXDeg: number, rotationYDeg: number) => {
    if (!modelRoot) return;
    if (rotationXDeg === 0 && rotationYDeg === 0) {
      if (!orientationApplied) return; // most frames past the opening window: never touched
      modelRoot.position.copy(modelBasePosition);
      modelRoot.quaternion.copy(modelBaseQuaternion);
      orientationApplied = false;
      return;
    }
    const extra = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(THREE.MathUtils.degToRad(rotationXDeg), THREE.MathUtils.degToRad(rotationYDeg), 0, "YXZ"),
    );
    modelRoot.quaternion.copy(modelBaseQuaternion).premultiply(extra);
    modelRoot.position.copy(modelBasePosition).sub(closedCenter).applyQuaternion(extra).add(closedCenter);
    orientationApplied = true;
  };

  const render = (progress: number): ScreenQuad => {
    lastProgress = progress;

    if (!pivot) {
      renderer.render(scene, camera);
      return DEGENERATE_QUAD;
    }

    // Every value the arc needs, read off the keyframe track: linear between
    // the two keyframes bracketing this progress, held flat outside them.
    const pose = poseAt(editorKeyframes ?? DEFAULT_KEYFRAMES, progress);

    pivot.rotation.x = THREE.MathUtils.degToRad(pose.lidDeg);
    applyModelOrientation(pose.rotationX, pose.rotationY);

    const portrait = camera.aspect < 0.78;
    // Camera sits twice as far from the laptop at every stage of the arc, which
    // renders it at roughly half its previous on-screen size throughout the
    // scroll animation (the screen quad and hinge motion are both downstream
    // of this and scale with it automatically).
    const FRAME_SCALE = 2;

    // Phone framing. Horizontal coverage at a fixed camera distance is
    // proportional to the viewport aspect, and a portrait phone is a fraction
    // of the ~16:10 frame this arc was authored in: measured at 375x812
    // (aspect 0.46), the laptop rendered ~55% wider than the viewport, so the
    // lid, keyboard and trackpad all ran off both edges -- and the HTML screen
    // overlay, which is projected onto the panel's own corners, was cropped
    // with it, which is why the About window on the glass showed as a fragment
    // of cut-off text rather than a window.
    //
    // Pulling the camera back by FRAMING_ASPECT / aspect restores exactly the
    // horizontal coverage the arc was framed with; NARROW_FILL then keeps a
    // phone's laptop deliberately a little wider than the viewport rather than
    // fully inside it, which is the framing this section's CSS fallback laptop
    // has always used on mobile (width: 116vw). Written as max(1, ...) so it is
    // an exact no-op -- not merely a small correction -- at every aspect at or
    // above 0.64, which covers every desktop, laptop and typical tablet
    // viewport. A handful of narrower small-tablet/large-phablet sizes (e.g.
    // 600x960, aspect 0.625) fall just under that line and get a small,
    // continuous pullback (~2% at 0.625) rather than a true no-op -- expected,
    // not a bug, and imperceptible at that magnitude.
    const FRAMING_ASPECT = 1.6;
    const NARROW_FILL = 0.4;
    const narrowFit = Math.max(1, (FRAMING_ASPECT / camera.aspect) * NARROW_FILL);
    // The pose's scale composes with FRAME_SCALE instead of replacing it: a
    // bigger scale pulls the camera in, so the laptop grows on screen.
    //
    // It has to divide BOTH ends of the blend below. It used to divide only
    // closedDist, which meant its effect faded out as `zoom` weighted the blend
    // toward endPos -- fine when the only tunable frame was the resting one at
    // zoom 0, but it would have made the new Zoom control silently do nothing
    // on the later keyframes, where the camera is mostly or entirely at the
    // open end.
    const frameScale = (FRAME_SCALE * narrowFit) / Math.max(0.05, pose.scale);
    const closedDist = closedSizeLength * frameScale;
    const dist = modelSizeLength * frameScale;
    const startPos = new THREE.Vector3(
      closedCenter.x + closedDist * 0.1,
      closedCenter.y + closedDist * 0.32,
      closedCenter.z + closedDist * (portrait ? 1.0 : 0.85),
    );
    const endPos = new THREE.Vector3(modelCenter.x + dist * 0.02, modelCenter.y + dist * 0.16, modelCenter.z + dist * (portrait ? 0.62 : 0.5));
    camera.position.lerpVectors(startPos, endPos, pose.zoom);
    camera.fov = THREE.MathUtils.lerp(33, portrait ? 27 : 24, pose.zoom);
    camera.updateProjectionMatrix();

    const lookStart = closedCenter.clone();
    const lookEnd = new THREE.Vector3(modelCenter.x, modelCenter.y + modelSizeLength * 0.08, modelCenter.z);
    const look = lookStart.lerp(lookEnd, pose.zoom);
    camera.lookAt(look);

    const panX = pose.offsetX;
    const panY = pose.offsetY;
    if (panX !== 0 || panY !== 0) {
      // A pure sideways/upward pan of the camera (no re-aim), which translates
      // the rendered image by the same fraction of the frame in the opposite
      // direction, so +offsetX reads as "the laptop moved right".
      const viewDistance = camera.position.distanceTo(look);
      const viewHeight = 2 * viewDistance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
      const viewWidth = viewHeight * camera.aspect;
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
      const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
      camera.position.addScaledVector(right, -panX * viewWidth);
      camera.position.addScaledVector(up, -panY * viewHeight);
    }

    // The turn (rotationY) plus the vertical pan (offsetY) leave the laptop's
    // level edges reading as very slightly sloped under perspective -- the
    // same reason a level table edge looks faintly diagonal in an off-angle
    // photo. Not a stray rotationX (every keyframe holds it at 0) or camera
    // roll elsewhere in this function; this is the one deliberate counter-roll,
    // small enough to correct that without being a rotation anyone would
    // consciously notice on its own.
    camera.rotateZ(THREE.MathUtils.degToRad(LEVEL_CORRECTION_DEG));

    pivot.updateMatrixWorld(true);
    renderer.render(scene, camera);

    if (!screenCornersLocal) return DEGENERATE_QUAD;

    const width = Math.max(1, canvas.clientWidth || window.innerWidth);
    const height = Math.max(1, canvas.clientHeight || window.innerHeight);
    return screenCornersLocal.map((point) => {
      const projected = point.clone().applyMatrix4(pivot!.matrixWorld).project(camera);
      return [(projected.x * 0.5 + 0.5) * width, (-projected.y * 0.5 + 0.5) * height] as ScreenPoint;
    }) as ScreenQuad;
  };

  resize();
  render(0);

  return {
    render,
    resize,
    setEditorKeyframes(keyframes: readonly LaptopPose[] | null) {
      editorKeyframes = keyframes;
    },
    dispose() {
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach((material) => {
          const std = material as THREE.MeshStandardMaterial;
          [std.map, std.normalMap, std.metalnessMap, std.roughnessMap, std.emissiveMap, std.aoMap].forEach((tex) => tex?.dispose());
          material.dispose();
        });
      });
      renderer.dispose();
    },
  };
}
