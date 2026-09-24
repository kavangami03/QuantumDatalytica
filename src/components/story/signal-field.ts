/**
 * Canvas particle field for the hero.
 *
 * Every particle owns three positions and `morph` blends between them:
 *   0 → scattered clusters of business data
 *   1 → one slowly turning sphere ("one business view")
 *   2 → nine streams converging on a single point ("action")
 * Labels are DOM elements pinned to projected 3D anchors so they stay readable.
 */

const PAPER = "243, 240, 234";
const ACCENT = "72, 112, 255";
const LANES = 9;
const TAU = Math.PI * 2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t: number) => t * t * (3 - 2 * t);
const FLOW_Y = -0.3;
const laneY = (k: number) => ((k - (LANES - 1) / 2) / ((LANES - 1) / 2)) * 0.7;
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

type Vec = [number, number, number];

/* Where each signal's cluster sits in the scattered state (R units from centre). */
const CLUSTERS: Vec[] = [
  [-2.05, -0.78, 0.2],
  [-1.05, -0.9, -0.5],
  [0.1, -0.74, 0.45],
  [1.2, -0.88, -0.3],
  [2.1, -0.7, 0.35],
  [-1.7, 0.82, -0.25],
  [-0.45, 0.9, 0.5],
  [0.85, 0.78, -0.45],
  [1.95, 0.92, 0.15],
];

function fibonacci(i: number, n: number): Vec {
  const y = 1 - ((i + 0.5) / n) * 2;
  const r = Math.sqrt(1 - y * y);
  const theta = i * Math.PI * (3 - Math.sqrt(5));
  return [Math.cos(theta) * r, y, Math.sin(theta) * r];
}

export class SignalField {
  morph = 0;
  /** Global fade used by the intro. */
  fade = 0;
  labelAlpha = 0;

  private ctx: CanvasRenderingContext2D;
  private n: number;
  private a: Float32Array;
  private b: Float32Array;
  private c: Float32Array; // lane, base offset, jitter y, jitter z
  private size: Float32Array;
  private delay: Float32Array;
  private phase: Float32Array;
  private order: Uint16Array; // paper particles first, accent after
  private accentFrom: number;
  private anchorsB: Vec[];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private R = 1;
  private pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  private raf = 0;
  private running = false;
  private visible = true;
  private observer: IntersectionObserver;
  private resizer: ResizeObserver;

  constructor(
    private canvas: HTMLCanvasElement,
    private labels: HTMLElement[],
    private core: HTMLElement | null,
    count: number,
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas unavailable");
    this.ctx = ctx;
    this.n = count;
    this.a = new Float32Array(count * 3);
    this.b = new Float32Array(count * 3);
    this.c = new Float32Array(count * 4);
    this.size = new Float32Array(count);
    this.delay = new Float32Array(count);
    this.phase = new Float32Array(count);

    const sphereCount = Math.floor(count * 0.8);
    const accent: number[] = [];
    const paper: number[] = [];
    for (let i = 0; i < count; i++) {
      // Scattered: most particles gather around a signal, the rest is dust.
      const cluster = CLUSTERS[i % CLUSTERS.length] ?? [0, 0, 0];
      const clustered = Math.random() < 0.62;
      const ax = clustered ? cluster[0] + gauss() * 0.34 : (Math.random() * 2 - 1) * 2.6;
      const ay = clustered ? cluster[1] + gauss() * 0.2 : (Math.random() * 2 - 1) * 1.45;
      const az = clustered ? cluster[2] + gauss() * 0.35 : (Math.random() * 2 - 1) * 1.3;
      this.a.set([ax, ay, az], i * 3);

      // Sphere surface, plus two tilted orbits.
      if (i < sphereCount) {
        const p = fibonacci(i, sphereCount);
        this.b.set(p, i * 3);
      } else {
        const angle = Math.random() * TAU;
        const tilt = i % 2 ? 0.42 : -0.7;
        const radius = 1.42 + gauss() * 0.03;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        this.b.set([x, -z * Math.sin(tilt), z * Math.cos(tilt)], i * 3);
      }

      this.c.set([i % LANES, Math.random(), gauss() * 0.07, gauss() * 0.12], i * 4);
      const spark = Math.random() < 0.025;
      this.size[i] = spark ? 2.6 : 0.7 + Math.random() * 1.2;
      this.delay[i] = Math.random();
      this.phase[i] = Math.random() * TAU;
      (Math.random() < 0.32 && !spark ? accent : paper).push(i);
    }
    this.order = Uint16Array.from([...paper, ...accent]);
    this.accentFrom = paper.length;
    this.anchorsB = labels.map((_, k) => {
      const [x, y, z] = fibonacci(k * 2 + 1, labels.length * 2 + 2);
      return [x * 1.04, y * 1.04, z * 1.04];
    });

    this.resizer = new ResizeObserver(() => this.resize());
    this.resizer.observe(canvas);
    this.observer = new IntersectionObserver(([entry]) => {
      this.visible = Boolean(entry?.isIntersecting);
      if (this.visible && this.running) this.loop();
    });
    this.observer.observe(canvas);
    this.resize();
  }

  setPointer(nx: number, ny: number) {
    this.pointer.tx = nx;
    this.pointer.ty = ny;
  }

  start() {
    this.running = true;
    this.loop();
  }

  /** Draw a single still frame (reduced motion). */
  still() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.draw(0);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.observer.disconnect();
    this.resizer.disconnect();
  }

  private resize() {
    const box = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = box.width;
    this.h = box.height;
    this.canvas.width = Math.round(box.width * this.dpr);
    this.canvas.height = Math.round(box.height * this.dpr);
    this.R = Math.min(this.w * 0.24, this.h * 0.32);
    if (!this.running) this.draw(performance.now());
  }

  private loop = () => {
    cancelAnimationFrame(this.raf);
    if (!this.running || !this.visible) return;
    this.draw(performance.now());
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(t: number) {
    const { ctx, n, a, b, c, R, dpr } = this;
    const p = this.pointer;
    p.x += (p.tx - p.x) * 0.045;
    p.y += (p.ty - p.y) * 0.045;

    const m = this.morph;
    const toSphere = m <= 1 ? m : 1;
    const toFlow = m > 1 ? m - 1 : 0;
    const spin = t * 0.00016;
    const cosS = Math.cos(spin);
    const sinS = Math.sin(spin);
    const rot = 1 - toFlow * 0.85;
    const yaw = (p.x * 0.55 + Math.sin(t * 0.00009) * 0.08) * rot;
    const pitch = (p.y * 0.32 + 0.12 * toSphere) * rot;
    const cy1 = Math.cos(yaw);
    const sy1 = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const D = 4;
    const cx = this.w / 2;
    const cyc = this.h / 2;
    const flowClock = t * 0.000055;

    // Brightness: quieter behind the headline, full as a sphere.
    const intensity = (0.62 + 0.38 * smooth(clamp01(toSphere)) - 0.1 * toFlow) * this.fade;

    // In flow the canvas keeps a short trail, otherwise it clears.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(0,0,0,${1 - 0.72 * smooth(clamp01(toFlow * 1.5))})`;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const project = (x: number, y: number, z: number, out: number[]) => {
      // yaw then pitch
      const x1 = x * cy1 - z * sy1;
      const z1 = x * sy1 + z * cy1;
      const y1 = y * cp - z1 * sp;
      const z2 = y * sp + z1 * cp;
      const f = D / (z2 + D);
      out[0] = cx + x1 * R * f;
      out[1] = cyc + y1 * R * f;
      out[2] = f;
      out[3] = clamp01((1.6 - z2) / 3.2);
    };

    const out = [0, 0, 0, 0];
    const position = (i: number, d: number, res: Vec) => {
      const i3 = i * 3;
      const ph = this.phase[i] ?? 0;
      // scattered, with a slow drift
      const ax = (a[i3] ?? 0) + Math.sin(t * 0.00031 + ph) * 0.05;
      const ay = (a[i3 + 1] ?? 0) + Math.cos(t * 0.00027 + ph * 1.3) * 0.04;
      const az = a[i3 + 2] ?? 0;
      // sphere, turning
      const bx0 = b[i3] ?? 0;
      const bz0 = b[i3 + 2] ?? 0;
      const bx = bx0 * cosS - bz0 * sinS;
      const by = b[i3 + 1] ?? 0;
      const bz = bx0 * sinS + bz0 * cosS;

      const k1 = ease(clamp01(toSphere * 1.35 - d * 0.35));
      let x = ax + (bx - ax) * k1;
      let y = ay + (by - ay) * k1;
      let z = az + (bz - az) * k1;

      if (toFlow > 0) {
        const i4 = i * 4;
        const u = ((((c[i4 + 1] ?? 0) + flowClock) % 1) + 1) % 1;
        const s = smooth(u);
        const fx = -1.72 + u * 3.52;
        const fy = FLOW_Y + laneY(c[i4] ?? 0) * (1 - s) + (c[i4 + 2] ?? 0) * (1 - s);
        const fz = (c[i4 + 3] ?? 0) * (1 - s);
        const k2 = ease(clamp01(toFlow * 1.35 - d * 0.35));
        x += (fx - x) * k2;
        y += (fy - y) * k2;
        z += (fz - z) * k2;
      }
      res[0] = x;
      res[1] = y;
      res[2] = z;
    };

    const pos: Vec = [0, 0, 0];
    for (let o = 0; o < n; o++) {
      const i = this.order[o] ?? 0;
      if (o === 0) ctx.fillStyle = `rgb(${PAPER})`;
      if (o === this.accentFrom) ctx.fillStyle = `rgb(${ACCENT})`;
      position(i, this.delay[i] ?? 0, pos);
      project(pos[0], pos[1], pos[2], out);
      const near = out[3] ?? 0;
      const alpha = (0.12 + 0.88 * near * near) * intensity;
      if (alpha < 0.01) continue;
      const s = (this.size[i] ?? 1) * (out[2] ?? 1) * (0.7 + near * 0.6);
      ctx.globalAlpha = alpha;
      ctx.fillRect((out[0] ?? 0) - s / 2, (out[1] ?? 0) - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    // Labels ride their anchors in every state.
    const k1 = ease(clamp01(toSphere * 1.35 - 0.17));
    const k2 = ease(clamp01(toFlow * 1.35 - 0.17));
    this.labels.forEach((label, k) => {
      const A = CLUSTERS[k] ?? [0, 0, 0];
      const Bs = this.anchorsB[k] ?? [0, 0, 0];
      const Bx = Bs[0] * cosS - Bs[2] * sinS;
      const Bz = Bs[0] * sinS + Bs[2] * cosS;
      const Cx = -2.35;
      const Cy = FLOW_Y + laneY(k) * (1 - smooth(0.035));
      let x = A[0] + (Bx - A[0]) * k1;
      let y = A[1] + (Bs[1] - A[1]) * k1;
      let z = A[2] + (Bz - A[2]) * k1;
      x += (Cx - x) * k2;
      y += (Cy - y) * k2;
      z += (0 - z) * k2;
      project(x, y, z, out);
      const near = out[3] ?? 0;
      const depth = 0.55 + 0.45 * smooth(near);
      const alpha = this.labelAlpha * (depth + (1 - depth) * k2);
      label.style.transform = `translate3d(${(out[0] ?? 0).toFixed(1)}px, ${(out[1] ?? 0).toFixed(1)}px, 0)`;
      label.style.opacity = alpha.toFixed(3);
      label.style.zIndex = String(Math.round(near * 10));
    });

    if (this.core) {
      const coreAlpha = clamp01(1 - Math.abs(m - 1) * 3.2) * this.fade;
      this.core.style.opacity = coreAlpha.toFixed(3);
      this.core.style.visibility = coreAlpha < 0.01 ? "hidden" : "visible";
    }
  }
}
