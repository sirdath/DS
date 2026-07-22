import * as THREE from "three";

export type AryaOrbState = "idle" | "speaking" | "processing";
export type AryaOrbHandle = { setState: (state: AryaOrbState) => void; destroy: () => void };

const vertexShader = `
varying vec3 vN;
varying vec3 vP;
void main() {
  vN = normalize(normalMatrix * normal);
  vP = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const fragmentShader = `
precision highp float;
varying vec3 vN;
varying vec3 vP;
uniform float u_time, u_energy, u_ribbon, u_bright, u_cool, u_amp;

const vec3 IV_LIGHT = vec3(0.898, 0.851, 1.000);
const vec3 IV       = vec3(0.773, 0.714, 1.000);
const vec3 IB       = vec3(0.490, 0.639, 1.000);
const vec3 IC       = vec3(0.627, 0.878, 1.000);
const vec3 IM       = vec3(0.835, 0.643, 0.898);
const vec3 DEEP     = vec3(0.286, 0.262, 0.510);

vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * snoise(p); p = p * 2.02 + 17.3; a *= 0.5; }
  return s;
}

void main() {
  float t = u_time * (0.30 + 0.80 * u_energy);
  vec2 sp = vP.xy * 1.35 + vP.z * 0.55;
  sp += 0.40 * vec2(fbm(sp + vec2(0.0, t * 0.30)), fbm(sp + vec2(t * 0.27, 3.7)));
  float d1 = fbm(sp + t * 0.12);
  float d2 = fbm(sp * 1.6 - t * 0.09 + 7.3);
  vec3 body = mix(DEEP, IV, 0.35);
  body = mix(body, IV, smoothstep(-0.75, 0.75, d1));
  body = mix(body, IB, smoothstep(-0.25, 0.90, d2) * 0.60);
  body = mix(body, IC, smoothstep(-0.05, 0.90, d1 * d2 + 0.25) * (0.55 + 0.45 * u_cool));
  body = mix(body, mix(IM, IV_LIGHT, 0.35), smoothstep(0.0, 0.95, -d2 + 0.35) * (0.70 - 0.40 * u_cool));
  vec3 n = normalize(vN);
  float facing = clamp(n.z, 0.0, 1.0);
  float fres = pow(1.0 - facing, 2.0);
  float core = pow(facing, 2.2) * (0.42 + 0.45 * u_amp + 0.15 * u_energy);
  body += IV_LIGHT * core * 0.50;
  body += mix(IM, IV_LIGHT, 0.5) * core * 0.14;
  float band = vP.y - 0.30 * sin(vP.x * 2.2 + t * 0.7) + 0.30 * d1;
  body += IC * smoothstep(0.32, 0.06, abs(band)) * u_ribbon * 0.30;
  body += IV * fres * 0.60;
  body += IV_LIGHT * pow(fres, 3.0) * 0.30;
  float diff = 0.75 + 0.25 * max(dot(n, normalize(vec3(-0.5, 0.55, 0.72))), 0.0);
  body *= diff * u_bright;
  gl_FragColor = vec4(body, 1.0);
}`;

const targets = {
  idle: { energy: 0.30, ribbon: 0.60, bright: 1.0, cool: 0.4, scale: 1.0, spin: 0.04 },
  speaking: { energy: 1.0, ribbon: 1.0, bright: 1.08, cool: 0.15, scale: 1.05, spin: 0.10 },
  processing: { energy: 0.14, ribbon: 0.10, bright: 0.9, cool: 0.45, scale: 0.97, spin: 0.02 },
};

function haloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(128, 128, 24, 128, 128, 128);
  gradient.addColorStop(0, "rgba(197,182,255,.82)");
  gradient.addColorStop(0.45, "rgba(125,190,255,.28)");
  gradient.addColorStop(1, "rgba(125,163,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function voiceEnvelope(time: number) {
  const syllable = Math.max(0, Math.sin(time * 5.1) * 0.5 + Math.sin(time * 8.3 + 1.2) * 0.35 + 0.18);
  const phrase = Math.max(0, Math.sin(time * 0.7) * 0.5 + 0.62);
  return Math.min(1, syllable * phrase * 1.6);
}

export function createAryaOrb(container: HTMLElement): AryaOrbHandle {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
  container.appendChild(renderer.domElement);

  const resize = () => {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  window.addEventListener("resize", resize);
  resize();

  const uniforms = {
    u_time: { value: 0 }, u_energy: { value: 0.3 }, u_ribbon: { value: 0.6 },
    u_bright: { value: 1 }, u_cool: { value: 0.4 }, u_amp: { value: 0 },
  };
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1, 80, 80), new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader }));
  const haloMaterial = new THREE.SpriteMaterial({ map: haloTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const halo = new THREE.Sprite(haloMaterial);
  halo.scale.setScalar(3.4);
  halo.position.z = -0.5;
  const group = new THREE.Group();
  group.add(halo, orb);
  scene.add(group);

  let state: AryaOrbState = "idle";
  const current = { ...targets.idle };
  let smoothAmplitude = 0;
  const mouse = { x: 0, y: 0 };
  const onPointerMove = (event: PointerEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointerMove);
  const clock = new THREE.Clock();
  let frame = 0;
  const tick = () => {
    const time = clock.getElapsedTime();
    const target = targets[state];
    (Object.keys(target) as (keyof typeof target)[]).forEach((key) => { current[key] += (target[key] - current[key]) * 0.05; });
    const amplitude = state === "speaking" ? voiceEnvelope(time) : 0;
    smoothAmplitude += (amplitude - smoothAmplitude) * 0.16;
    uniforms.u_time.value = time;
    uniforms.u_energy.value = current.energy;
    uniforms.u_ribbon.value = current.ribbon;
    uniforms.u_bright.value = current.bright;
    uniforms.u_cool.value = current.cool;
    uniforms.u_amp.value = smoothAmplitude;
    const breathe = 1 + 0.018 * Math.sin(time * 0.9) + 0.05 * smoothAmplitude;
    group.scale.setScalar(current.scale * breathe);
    group.position.y = 0.06 * Math.sin(time * 0.8) + 0.1 * smoothAmplitude;
    orb.rotation.y += (0.02 + current.spin) * 0.016;
    orb.rotation.z = 0.06 * Math.sin(time * 0.23);
    group.rotation.y += (mouse.x * 0.35 - group.rotation.y) * 0.04;
    group.rotation.x += (mouse.y * 0.22 - group.rotation.x) * 0.04;
    haloMaterial.opacity = 0.34 + current.energy * 0.24 + smoothAmplitude * 0.14;
    halo.scale.setScalar(3.4 * (1 + 0.06 * Math.sin(time * 0.8) + 0.18 * smoothAmplitude));
    renderer.render(scene, camera);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    setState(next) { state = next; },
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      orb.geometry.dispose();
      (orb.material as THREE.Material).dispose();
      haloMaterial.map?.dispose();
      haloMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
