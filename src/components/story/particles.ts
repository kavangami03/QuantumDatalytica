/**
 * Reusable canvas particle engine for the story's scenes.
 *
 * A field holds N particles and a list of states (shapes). `morph` scrubs
 * from state 0 to state N-1; each particle travels with its own small delay
 * so formations dissolve and assemble organically. States may animate over
 * time (spin, flow, drift). DOM labels ride projected 3D anchors.
 */

export type Vec = [number, number, number];
export type Rand = () => number;
export type Theme = "dark" | "light" | "accent";

export interface StateDef {
  shape: (i: number, n: number, rand: Rand) => Vec;
  /** Time-based movement applied on top of the shape (mutates `p`). */
  motion?: (i: number, t: number, p: Vec) => void;
  /** Same idea for label anchors, which have no particle index. */
  anchorMotion?: (t: number, p: Vec) => void;
  /** 0–1: how much of the previous frame lingers (motion trails). */
  trail?: number;
}

export interface AnchorDef {
  el: HTMLElement;
  /** Position per state; null hides the label in that state. */
  at: Array<Vec | null>;
}

export interface FieldOptions {
  count: number;
  states: StateDef[];
  theme?: Theme;
  anchors?: AnchorDef[];
  /** Scene radius as fractions of [width, height]; the smaller wins. */
  radius?: [number, number];
  /** Pointer tilt strength (0 disables). */
  pointer?: number;
  /** Resting camera pitch in radians. */
  tilt?: number;
  accentRatio?: number;
  /** Particle size multiplier. */
  size?: number;
  /** Every particle in the accent colour (works on any background). */
  accentOnly?: boolean;
  /** Per-particle override of the 0→1 transition between states 0 and 1. */
  localMorph?: (i: number, morph: number) => number;
  seed?: number;
  /** Bloom strength: a soft halo drawn under every particle (dark themes). */
  glow?: number;
  /** Track the pointer over this element only (defaults to the window). */
  pointerEl?: HTMLElement;
}

const TAU = Math.PI * 2;
const INK = "22, 25, 31";
const PAPER = "243, 240, 234";
const ACCENT = "58, 98, 255";
const ACCENT_LIGHT = "92, 128, 255";

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const smooth = (t: number) => t * t * (3 - 2 * t);

export function rng(seed = 1): Rand {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const gauss = (r: Rand) => (r() + r() + r() - 1.5) / 1.5;
export const frac = (v: number) => ((v % 1) + 1) % 1;
/** Standard normal sample, clipped so nothing escapes the frame. */
export const normal = (r: Rand) => {
  const n = Math.sqrt(-2 * Math.log(r() || 1e-6)) * Math.cos(TAU * r());
  return Math.max(-2.6, Math.min(2.6, n));
};

/* ─────────────────────────── Shapes ─────────────────────────── */

export const shapes = {
  /** A soft ellipsoid: dense in the middle, thinning out with no hard edges. */
  cloud:
    (sx: number, sy: number, sz: number) =>
    (_i: number, _n: number, r: Rand): Vec => [
      (normal(r) / 2.2) * sx,
      (normal(r) / 2.2) * sy,
      (normal(r) / 2.2) * sz,
    ],

  /** A luminous mass: a bright core with curling spiral arms and fine dust. */
  nebula:
    (sx = 1.6, sy = 1, sz = 0.8, arms = 3) =>
    (i: number, _n: number, r: Rand): Vec => {
      const roll = r();
      if (roll < 0.34) {
        return [normal(r) * 0.22 * sx, normal(r) * 0.22 * sy, normal(r) * 0.3 * sz];
      }
      if (roll < 0.86) {
        const t = Math.pow(r(), 0.8);
        const arm = (i % arms) * (TAU / arms);
        const a = arm + t * 3.4;
        const rad = 0.12 + t * 0.95;
        const spread = 0.05 + t * 0.12;
        return [
          (Math.cos(a) * rad + normal(r) * spread) * sx,
          (Math.sin(a) * rad * 0.82 + normal(r) * spread) * sy,
          normal(r) * (0.1 + t * 0.2) * sz,
        ];
      }
      return [normal(r) * 0.5 * sx, normal(r) * 0.5 * sy, normal(r) * 0.4 * sz];
    },

  clusters:
    (centers: Vec[], spread: Vec, dust = 0.2, dustSpread: Vec = [2.4, 1.3, 1.2]) =>
    (i: number, _n: number, r: Rand): Vec => {
      if (r() < dust)
        return [
          (normal(r) / 2.2) * dustSpread[0],
          (normal(r) / 2.2) * dustSpread[1],
          (normal(r) / 2.2) * dustSpread[2],
        ];
      const c = centers[i % centers.length] ?? [0, 0, 0];
      return [
        c[0] + gauss(r) * spread[0],
        c[1] + gauss(r) * spread[1],
        c[2] + gauss(r) * spread[2],
      ];
    },

  sphere:
    (radius = 1) =>
    (i: number, n: number): Vec => {
      const y = 1 - ((i + 0.5) / n) * 2;
      const rr = Math.sqrt(1 - y * y);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(th) * rr * radius, y * radius, Math.sin(th) * rr * radius];
    },

  ring:
    (radius = 1, tilt = 0.4, jitter = 0.04) =>
    (i: number, n: number, r: Rand): Vec => {
      const a = (i / n) * TAU + r() * 0.02;
      const rad = radius + gauss(r) * jitter;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      return [x, -z * Math.sin(tilt) + gauss(r) * jitter, z * Math.cos(tilt)];
    },

  grid:
    (cols: number, rows: number, w: number, h: number) =>
    (i: number, n: number): Vec => {
      const per = Math.max(1, Math.floor(n / (cols * rows)));
      const cell = Math.floor(i / per) % (cols * rows);
      const cx = cell % cols;
      const cy = Math.floor(cell / cols);
      const k = i % per;
      const off = per > 1 ? (k / per - 0.5) * (w / cols) * 0.5 : 0;
      return [(cx / (cols - 1) - 0.5) * w + off, (cy / (rows - 1) - 0.5) * h, 0];
    },

  /** A small bar chart: heights are 0–1. */
  bars:
    (heights: number[], width = 1.9, base = 0.85, height = 1.7) =>
    (i: number, _n: number, r: Rand): Vec => {
      const count = heights.length;
      const k = i % count;
      const bw = (width / count) * 0.58;
      const x0 = -width / 2 + (k + 0.5) * (width / count);
      const h = (heights[k] ?? 0.5) * height;
      return [x0 + (r() - 0.5) * bw, base - r() * h, (r() - 0.5) * 0.25];
    },

  /** A filled arrow pointing right. */
  arrow:
    () =>
    (_i: number, _n: number, r: Rand): Vec => {
      if (r() < 0.55) return [-1.3 + r() * 1.7, (r() - 0.5) * 0.36, (r() - 0.5) * 0.25];
      // head: triangle from x 0.3 → 1.3
      let u = r();
      let v = r();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const ax = 0.3;
      const ay = -0.85;
      const bx = 0.3;
      const by = 0.85;
      const cx = 1.35;
      const cy = 0;
      return [
        ax + u * (bx - ax) + v * (cx - ax),
        ay + u * (by - ay) + v * (cy - ay),
        (r() - 0.5) * 0.25,
      ];
    },

  /** Points sampled from rendered text, centred, `width` wide. */
  text:
    (points: Array<[number, number]>, width = 2.4) =>
    (i: number, _n: number, r: Rand): Vec => {
      const p = points[Math.floor(r() * points.length)] ?? [0.5, 0.5];
      return [(p[0] - 0.5) * width, (p[1] - 0.5) * width * 0.5, (r() - 0.5) * 0.18];
    },
};

/** Rasterise text and return filled pixel positions normalised to 0–1 (2:1 box). */
export function sampleText(
  text: string,
  font = "500 170px Geist, sans-serif",
): Array<[number, number]> {
  const W = 480;
  const H = 240;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return [[0.5, 0.5]];
  ctx.fillStyle = "#fff";
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2 + 6);
  const data = ctx.getImageData(0, 0, W, H).data;
  const points: Array<[number, number]> = [];
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if ((data[(y * W + x) * 4 + 3] ?? 0) > 128) points.push([x / W, y / H]);
    }
  }
  return points.length ? points : [[0.5, 0.5]];
}

/* ─────────────────────────── Motions ─────────────────────────── */

export const motions = {
  spin:
    (speed = 0.00016) =>
    (_i: number, t: number, p: Vec) => {
      const a = t * speed;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x = p[0] * c - p[2] * s;
      p[2] = p[0] * s + p[2] * c;
      p[0] = x;
    },
  drift:
    (amp = 0.05) =>
    (i: number, t: number, p: Vec) => {
      const ph = i * 1.618;
      p[0] += Math.sin(t * 0.00031 + ph) * amp;
      p[1] += Math.cos(t * 0.00027 + ph * 1.3) * amp * 0.8;
    },
  /** Galaxy-like turn in the picture plane: the core spins faster than the rim. */
  swirl:
    (speed = 0.00022, drift = 0.03) =>
    (i: number, t: number, p: Vec) => {
      const rad = Math.hypot(p[0], p[1]);
      const a = (t * speed) / (0.35 + rad);
      const c = Math.cos(a);
      const s = Math.sin(a);
      const x = p[0] * c - p[1] * s;
      p[1] = p[0] * s + p[1] * c;
      p[0] = x;
      const ph = i * 1.618;
      p[0] += Math.sin(t * 0.0004 + ph) * drift;
      p[1] += Math.cos(t * 0.00035 + ph * 1.3) * drift;
    },
};

/** Hub with spokes: a dense core, a cluster per node, particles streaming inward. */
export function spokesState(
  nodes: Vec[],
  opts: { speed?: number; core?: number; nodeShare?: number } = {},
): StateDef {
  const { speed = 0.00009, core = 0.22, nodeShare = 0.2 } = opts;
  // Per-particle roles: 0 core, 1 core ring, 2 source cluster, 3 stream.
  const kind: number[] = [];
  const spoke: number[] = [];
  const u0: number[] = [];
  const bend: number[] = [];
  const off: Vec[] = [];
  const ringTilt = 1.15;
  return {
    shape: (i, _n, r) => {
      const roll = r();
      const k = i % Math.max(nodes.length, 1);
      const node = nodes[k] ?? [0, 0, 0];
      spoke[i] = k;
      if (roll < core * 0.7) {
        kind[i] = 0;
        return [normal(r) * 0.12, normal(r) * 0.12, normal(r) * 0.12];
      }
      if (roll < core) {
        kind[i] = 1;
        u0[i] = r() * TAU;
        off[i] = [0.42 + normal(r) * 0.02, normal(r) * 0.012, 0];
        return [0.42, 0, 0];
      }
      if (roll < core + nodeShare) {
        kind[i] = 2;
        return [node[0] + normal(r) * 0.07, node[1] + normal(r) * 0.06, node[2] + normal(r) * 0.07];
      }
      kind[i] = 3;
      u0[i] = r();
      // Three braided strands per source, curving the same way around the centre.
      const strand = Math.floor(r() * 3) - 1;
      bend[i] = 0.34 + strand * 0.12;
      off[i] = [normal(r) * 0.025, normal(r) * 0.025, normal(r) * 0.05];
      return [node[0], node[1], node[2]];
    },
    motion: (i, t, p) => {
      const role = kind[i];
      if (role === 0) {
        motions.spin(0.0005)(i, t, p);
        return;
      }
      if (role === 1) {
        const o = off[i] ?? [0.42, 0, 0];
        const a = (u0[i] ?? 0) + t * 0.0005;
        const z = Math.sin(a) * o[0];
        p[0] = Math.cos(a) * o[0];
        p[1] = -z * Math.sin(ringTilt) + o[1];
        p[2] = z * Math.cos(ringTilt);
        return;
      }
      if (role === 2) {
        motions.drift(0.02)(i, t, p);
        return;
      }
      const node = nodes[spoke[i] ?? 0] ?? [0, 0, 0];
      // Accelerate as the stream falls toward the centre.
      const u = Math.pow(frac((u0[i] ?? 0) + t * speed), 1.35);
      const inv = 1 - u;
      // Quadratic curve from the source to the centre, bowed sideways.
      const cx = node[0] * 0.5 - node[1] * (bend[i] ?? 0.3);
      const cy = node[1] * 0.5 + node[0] * (bend[i] ?? 0.3) * 0.6;
      const cz = node[2] * 0.5;
      const o = off[i] ?? [0, 0, 0];
      const taper = 0.25 + inv * 0.75;
      p[0] = inv * inv * node[0] + 2 * inv * u * cx + o[0] * taper;
      p[1] = inv * inv * node[1] + 2 * inv * u * cy + o[1] * taper;
      p[2] = inv * inv * node[2] + 2 * inv * u * cz + o[2] * taper;
    },
  };
}

/** Particles circulating around a tilted loop centred at (cx, cy). */
export function loopState(
  opts: { radius?: number; speed?: number; tilt?: number; cx?: number; cy?: number } = {},
): StateDef {
  const { radius = 1, speed = 0.00022, tilt = 0.9, cx = 0, cy = 0 } = opts;
  const a0: number[] = [];
  const j: number[] = [];
  const place = (a: number, rad: number, p: Vec) => {
    const z = Math.sin(a) * rad;
    p[0] = cx + Math.cos(a) * rad;
    p[1] = cy - z * Math.sin(tilt);
    p[2] = z * Math.cos(tilt);
  };
  return {
    shape: (i, n, r) => {
      a0[i] = (i / n) * TAU;
      j[i] = gauss(r) * 0.05;
      return [cx + radius, cy, 0];
    },
    motion: (i, t, p) => {
      place((a0[i] ?? 0) + t * speed, radius + (j[i] ?? 0), p);
      p[1] += (j[i] ?? 0) * 0.6;
    },
    // Anchors are given as an angle in p[0]; they travel with the loop.
    anchorMotion: (t, p) => place(p[0] + t * speed, radius, p),
  };
}

/** Anchor that sits at `angle` on a loopState ring (resolved by its anchorMotion). */
export const onLoop = (angle: number): Vec => [angle, 0, 0];

/** Spin for label anchors that ride a spinning formation. */
export const spinAnchor =
  (speed = 0.00016) =>
  (t: number, p: Vec) =>
    motions.spin(speed)(0, t, p);

/** Parallel lanes flowing left → right, optionally converging to a point. */
export function flowState(opts: {
  lanes?: number;
  spread?: number;
  from?: number;
  to?: number;
  converge?: boolean;
  speed?: number;
  y?: number;
}): StateDef {
  const {
    lanes = 1,
    spread = 0,
    from = -2,
    to = 2,
    converge = false,
    speed = 0.00007,
    y = 0,
  } = opts;
  const u0: number[] = [];
  const lane: number[] = [];
  const jy: number[] = [];
  const jz: number[] = [];
  const laneY = (k: number) => (lanes > 1 ? (k / (lanes - 1) - 0.5) * 2 * spread : 0);
  return {
    shape: (i, _n, r) => {
      u0[i] = r();
      lane[i] = i % lanes;
      jy[i] = gauss(r) * 0.06;
      jz[i] = gauss(r) * 0.12;
      return [from, y, 0];
    },
    motion: (i, t, p) => {
      const u = frac((u0[i] ?? 0) + t * speed);
      const s = converge ? smooth(u) : 0;
      p[0] = from + u * (to - from);
      p[1] = y + (laneY(lane[i] ?? 0) + (jy[i] ?? 0)) * (1 - s);
      p[2] = (jz[i] ?? 0) * (1 - s);
    },
    trail: 0.6,
  };
}

/** Particles falling through a narrowing funnel to a single point. */
export function funnelState(
  opts: { top?: number; bottom?: number; width?: number; speed?: number } = {},
): StateDef {
  const { top = -1.6, bottom = 1.5, width = 1.4, speed = 0.00006 } = opts;
  const u0: number[] = [];
  const x0: number[] = [];
  const z0: number[] = [];
  return {
    shape: (i, _n, r) => {
      u0[i] = r();
      x0[i] = (r() * 2 - 1) * width;
      z0[i] = (r() * 2 - 1) * 0.6;
      return [0, top, 0];
    },
    motion: (i, t, p) => {
      const u = frac((u0[i] ?? 0) + t * speed);
      const narrow = 1 - smooth(u) * 0.97;
      p[0] = (x0[i] ?? 0) * narrow + Math.sin(u * 9 + i) * 0.02 * narrow;
      p[1] = top + u * (bottom - top);
      p[2] = (z0[i] ?? 0) * narrow;
    },
    trail: 0.55,
  };
}

/* ─────────────────────────── Engine ─────────────────────────── */

interface CompiledState {
  def: StateDef;
  pos: Float32Array;
}

export class ParticleField {
  morph = 0;
  fade = 1;
  labelAlpha = 1;
  /** Speed of every time-based motion; tween it for hover energy. */
  timeScale = 1;

  private clock = 0;
  private lastTime = 0;

  private ctx: CanvasRenderingContext2D;
  private n: number;
  private states: CompiledState[];
  private anchors: AnchorDef[];
  private size: Float32Array;
  private delay: Float32Array;
  private last: Float32Array;
  private order: Uint16Array;
  private accentFrom: number;
  private rand: Rand;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private R = 1;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private raf = 0;
  private running = false;
  private visible = false;
  private observer: IntersectionObserver;
  private resizer: ResizeObserver;
  private onPointer = (event: PointerEvent) => {
    const el = this.opts.pointerEl;
    if (el) {
      const box = el.getBoundingClientRect();
      this.pointer.tx = (event.clientX - box.left) / box.width - 0.5;
      this.pointer.ty = (event.clientY - box.top) / box.height - 0.5;
      return;
    }
    this.pointer.tx = event.clientX / window.innerWidth - 0.5;
    this.pointer.ty = event.clientY / window.innerHeight - 0.5;
  };
  private onLeave = () => {
    this.pointer.tx = 0;
    this.pointer.ty = 0;
  };

  constructor(
    private canvas: HTMLCanvasElement,
    private opts: FieldOptions,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.n = opts.count;
    this.rand = rng(opts.seed ?? 7);
    this.anchors = opts.anchors ?? [];
    this.states = opts.states.map((def) => this.compile(def));
    this.size = new Float32Array(this.n);
    this.delay = new Float32Array(this.n);
    this.last = new Float32Array(this.n * 3);
    const accent: number[] = [];
    const base: number[] = [];
    const ratio = opts.accentOnly ? 1 : (opts.accentRatio ?? 0.3);
    for (let i = 0; i < this.n; i++) {
      const spark = this.rand() < 0.02;
      this.size[i] = (spark ? 2.5 : 0.75 + this.rand() * 1.15) * (opts.size ?? 1);
      this.delay[i] = this.rand();
      (this.rand() < ratio && !spark ? accent : base).push(i);
    }
    this.order = Uint16Array.from([...base, ...accent]);
    this.accentFrom = base.length;

    this.resizer = new ResizeObserver(() => this.resize());
    this.resizer.observe(canvas);
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = Boolean(entry?.isIntersecting);
      if (this.visible && this.running) this.loop();
    });
    this.observer.observe(canvas);
    if (opts.pointer && window.matchMedia("(pointer: fine)").matches) {
      const target = opts.pointerEl ?? window;
      target.addEventListener("pointermove", this.onPointer as EventListener);
      opts.pointerEl?.addEventListener("pointerleave", this.onLeave);
    }
    this.resize();
  }

  get stateCount() {
    return this.states.length;
  }

  start() {
    this.running = true;
    this.loop();
  }

  /** Render one frame at the last state and stop (reduced motion). */
  still(state = this.states.length - 1) {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.morph = state;
    this.draw(this.clock);
  }

  /** Re-form from wherever the particles are now into a new state. */
  retarget(def: StateDef, anchors?: AnchorDef[]) {
    const snapshot: StateDef = { shape: () => [0, 0, 0] };
    this.states = [{ def: snapshot, pos: this.last.slice() }, this.compile(def)];
    if (anchors) this.anchors = anchors;
    this.morph = 0;
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    this.resizer.disconnect();
    (this.opts.pointerEl ?? window).removeEventListener(
      "pointermove",
      this.onPointer as EventListener,
    );
    this.opts.pointerEl?.removeEventListener("pointerleave", this.onLeave);
  }

  private compile(def: StateDef): CompiledState {
    const pos = new Float32Array(this.n * 3);
    const r = rng((this.opts.seed ?? 7) * 31 + this.n);
    for (let i = 0; i < this.n; i++) pos.set(def.shape(i, this.n, r), i * 3);
    return { def, pos };
  }

  private resize() {
    const box = this.canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = box.width;
    this.h = box.height;
    this.canvas.width = Math.round(box.width * this.dpr);
    this.canvas.height = Math.round(box.height * this.dpr);
    const [rw, rh] = this.opts.radius ?? [0.3, 0.36];
    this.R = Math.min(this.w * rw, this.h * rh);
    if (!this.running) this.draw(this.clock);
  }

  private loop = () => {
    cancelAnimationFrame(this.raf);
    if (!this.running || !this.visible) return;
    // A private clock, so motions can be sped up or slowed without jumps.
    const now = performance.now();
    const dt = this.lastTime ? Math.min(now - this.lastTime, 64) : 16;
    this.lastTime = now;
    this.clock += dt * this.timeScale;
    this.draw(this.clock);
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(t: number) {
    const { ctx, n, R, dpr, states } = this;
    if (!this.w) return;
    const theme = this.opts.theme ?? "dark";
    const glowStrength = theme === "light" ? 0 : (this.opts.glow ?? 0.1);
    const p = this.pointer;
    p.x += (p.tx - p.x) * 0.05;
    p.y += (p.ty - p.y) * 0.05;
    const strength = this.opts.pointer ?? 0;
    const yaw = p.x * strength;
    const pitch = (this.opts.tilt ?? 0) + p.y * strength * 0.6;
    const cyw = Math.cos(yaw);
    const syw = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const D = 4;
    const cx = this.w / 2;
    const cy = this.h / 2;

    const last = states.length - 1;
    const m = Math.min(Math.max(this.morph, 0), last);
    const s0 = Math.min(Math.floor(m), last);
    const s1 = Math.min(s0 + 1, last);
    const f = m - s0;
    const A = states[s0];
    const B = states[s1];
    if (!A || !B) return;

    const trail = (A.def.trail ?? 0) * (1 - f) + (B.def.trail ?? 0) * f;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(0,0,0,${1 - 0.7 * trail})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = theme === "light" ? "source-over" : "lighter";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const out = [0, 0, 0, 0];
    const project = (x: number, y: number, z: number) => {
      const x1 = x * cyw - z * syw;
      const z1 = x * syw + z * cyw;
      const y1 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const k = D / (z2 + D);
      out[0] = cx + x1 * R * k;
      out[1] = cy + y1 * R * k;
      out[2] = k;
      out[3] = clamp01((1.6 - z2) / 3.2);
    };

    const pa: Vec = [0, 0, 0];
    const pb: Vec = [0, 0, 0];
    const baseColor = theme === "light" ? INK : PAPER;
    const accentColor = theme === "light" ? ACCENT : ACCENT_LIGHT;
    const light = theme === "light";
    // Ink on paper needs more body than light on ink to read at the same strength.
    const alphaScale = this.fade;
    const floor = light ? 0.38 : 0.14;
    const sizeScale = light ? 1.7 : 1;
    const local = this.opts.localMorph;

    for (let o = 0; o < n; o++) {
      const i = this.order[o] ?? 0;
      if (o === 0) ctx.fillStyle = `rgb(${this.opts.accentOnly ? accentColor : baseColor})`;
      if (o === this.accentFrom) ctx.fillStyle = `rgb(${accentColor})`;
      const i3 = i * 3;
      pa[0] = A.pos[i3] ?? 0;
      pa[1] = A.pos[i3 + 1] ?? 0;
      pa[2] = A.pos[i3 + 2] ?? 0;
      A.def.motion?.(i, t, pa);
      let x = pa[0];
      let y = pa[1];
      let z = pa[2];
      const d = this.delay[i] ?? 0;
      const k = local ? local(i, this.morph) : ease(clamp01(f * 1.35 - d * 0.35));
      if (k > 0 && B !== A) {
        pb[0] = B.pos[i3] ?? 0;
        pb[1] = B.pos[i3 + 1] ?? 0;
        pb[2] = B.pos[i3 + 2] ?? 0;
        B.def.motion?.(i, t, pb);
        x += (pb[0] - x) * k;
        y += (pb[1] - y) * k;
        z += (pb[2] - z) * k;
      }
      this.last[i3] = x;
      this.last[i3 + 1] = y;
      this.last[i3 + 2] = z;
      project(x, y, z);
      const near = out[3] ?? 0;
      const alpha = (floor + (1 - floor) * near * near) * alphaScale;
      if (alpha < 0.01) continue;
      const s = (this.size[i] ?? 1) * sizeScale * (out[2] ?? 1) * (0.7 + near * 0.6);
      const px = out[0] ?? 0;
      const py = out[1] ?? 0;
      if (glowStrength > 0) {
        ctx.globalAlpha = alpha * glowStrength;
        ctx.fillRect(px - s * 1.9, py - s * 1.9, s * 3.8, s * 3.8);
      }
      ctx.globalAlpha = alpha;
      ctx.fillRect((out[0] ?? 0) - s / 2, (out[1] ?? 0) - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    const kl = ease(f);
    const va: Vec = [0, 0, 0];
    const vb: Vec = [0, 0, 0];
    this.anchors.forEach((anchor) => {
      const a = anchor.at[s0];
      const b = anchor.at[s1];
      const alphaA = a ? 1 : 0;
      const alphaB = b ? 1 : 0;
      if (!a && !b) {
        anchor.el.style.opacity = "0";
        anchor.el.style.visibility = "hidden";
        return;
      }
      // Resolve each end in its own state; a missing end borrows the other.
      if (a) {
        va[0] = a[0];
        va[1] = a[1];
        va[2] = a[2];
        A.def.anchorMotion?.(t, va);
      }
      if (b) {
        vb[0] = b[0];
        vb[1] = b[1];
        vb[2] = b[2];
        B.def.anchorMotion?.(t, vb);
      }
      if (!a) va.splice(0, 3, vb[0], vb[1], vb[2]);
      if (!b) vb.splice(0, 3, va[0], va[1], va[2]);
      project(
        va[0] + (vb[0] - va[0]) * kl,
        va[1] + (vb[1] - va[1]) * kl,
        va[2] + (vb[2] - va[2]) * kl,
      );
      const near = out[3] ?? 0;
      const depth = 0.2 + 0.8 * smooth(near);
      const alpha = this.labelAlpha * this.fade * (alphaA + (alphaB - alphaA) * kl) * depth;
      anchor.el.style.transform = `translate3d(${(out[0] ?? 0).toFixed(1)}px, ${(out[1] ?? 0).toFixed(1)}px, 0)`;
      anchor.el.style.opacity = alpha.toFixed(3);
      anchor.el.style.visibility = alpha < 0.01 ? "hidden" : "visible";
      anchor.el.style.zIndex = String(Math.round(near * 10));
    });
  }
}
