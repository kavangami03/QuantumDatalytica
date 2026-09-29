/**
 * Canvas particle field for the hero.
 *
 * Every particle owns three positions and `morph` blends between them:
 *   0 → scattered clusters of business data
 *   1 → one slowly turning sphere ("one business view")
 *   2 → nine streams pouring down and converging ("action")
 * The streams end in the QuantumDataLytica logo, drawn in particles, hanging from that point.
 * Labels are DOM elements pinned to projected 3D anchors so they stay readable.
 */

const PAPER = "243, 240, 234";
const ACCENT = "72, 112, 255";
const LANES = 9;
const TAU = Math.PI * 2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t: number) => t * t * (3 - 2 * t);
/* Vertical flow: labels in a row along the top, streams falling to one point. */
const FLOW_TOP = -1.2;
const FLOW_END = -0.3;
const laneX = (k: number) => ((k - (LANES - 1) / 2) / ((LANES - 1) / 2)) * 2.55;
/* The logo sits above the closing line. */
const LOGO_W = 2.3;
const LOGO_Y = FLOW_END;
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

/* Opening state: one turning data globe beside the headline, with an orbit ring. */
const GLOBE: Vec = [1.62, -0.1, 0];
const GLOBE_R = 0.8;
const RING_R = 1.0;
const RING_TILT = 1.18;
const ringLocal = (a: number, r: number, out: Vec) => {
  const z = Math.sin(a) * r;
  out[0] = Math.cos(a) * r;
  out[1] = -z * Math.sin(RING_TILT);
  out[2] = z * Math.cos(RING_TILT);
};

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
  /** Ring angle for ring particles; NaN for points on the globe. */
  private ringA: Float32Array;
  private logo: Float32Array | null = null;
  private paperIdx: number[] = [];
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
    private logoEl: HTMLElement | null = null,
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
    this.ringA = new Float32Array(count);

    const sphereCount = Math.floor(count * 0.8);
    const accent: number[] = [];
    const paper: number[] = [];
    for (let i = 0; i < count; i++) {
      // Opening: most particles dot the surface of a globe, the rest ride its orbit ring.
      if (Math.random() < 0.8) {
        const g = fibonacci(Math.floor(Math.random() * 1400), 1400);
        this.a.set([g[0] * GLOBE_R, g[1] * GLOBE_R, g[2] * GLOBE_R], i * 3);
        this.ringA[i] = Number.NaN;
      } else {
        this.ringA[i] = Math.random() * TAU;
        this.a.set([gauss() * 0.03, gauss() * 0.03, gauss() * 0.03], i * 3);
      }

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
    this.paperIdx = paper;
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

  /** Give the field the sampled logo; particles take the colour of the pixel they land on. */
  setLogo(sample: { points: Array<[number, number]>; accent: boolean[]; aspect: number }) {
    const count = sample.points.length;
    if (!count) return;
    const logo = new Float32Array(this.n * 3);
    const accent: number[] = [];
    const paper: number[] = [];
    for (let i = 0; i < this.n; i++) {
      const k = (i * 7919) % count;
      const p = sample.points[k] ?? [0.5, 0.5];
      logo.set(
        [
          (p[0] - 0.5) * LOGO_W,
          (p[1] - 0.5) * LOGO_W * sample.aspect + LOGO_Y,
          (Math.random() - 0.5) * 0.1,
        ],
        i * 3,
      );
      (sample.accent[k] ? accent : paper).push(i);
    }
    this.logo = logo;
    this.order = Uint16Array.from([...paper, ...accent]);
    this.accentFrom = paper.length;
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
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = box.width;
    this.h = box.height;
    this.canvas.width = Math.round(box.width * this.dpr);
    this.canvas.height = Math.round(box.height * this.dpr);
    this.R = Math.min(this.w * 0.24, this.h * 0.32);
    if (!this.running) this.draw(performance.now());
  }

  private lastTime = 0;
  private quality = 1;
  private frameAvg = 16.7;

  private loop = () => {
    cancelAnimationFrame(this.raf);
    if (!this.running || !this.visible) return;
    const now = performance.now();
    const dt = this.lastTime ? Math.min(now - this.lastTime, 64) : 16;
    this.lastTime = now;
    this.frameAvg += (dt - this.frameAvg) * 0.08;
    if (this.frameAvg > 19) this.quality = Math.max(0.4, this.quality - 0.03);
    else if (this.frameAvg < 15.5) this.quality = Math.min(1, this.quality + 0.01);
    this.draw(now);
    this.raf = requestAnimationFrame(this.loop);
  };

  private draw(t: number) {
    const { ctx, n, a, b, c, R, dpr } = this;
    const p = this.pointer;
    p.x += (p.tx - p.x) * 0.045;
    p.y += (p.ty - p.y) * 0.045;

    const m = this.morph;
    const toSphere = m <= 1 ? m : 1;
    const toFlow = m > 1 ? Math.min(m - 1, 1) : 0;
    const toLogo = this.logo && m > 2 ? Math.min(m - 2, 1) : 0;
    const spin = t * 0.00016;
    const cosS = Math.cos(spin);
    const sinS = Math.sin(spin);
    const rot = 1 - toFlow * 0.9;
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
    const intensity =
      (0.95 + 0.05 * smooth(clamp01(toSphere)) - 0.1 * toFlow + 0.15 * toLogo) * this.fade;

    // In flow the canvas keeps a short trail, otherwise it clears.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(0,0,0,${1 - 0.72 * smooth(clamp01(toFlow * 1.5)) * (1 - smooth(toLogo))})`;
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
    const spinG = t * 0.00022;
    const cosG = Math.cos(spinG);
    const sinG = Math.sin(spinG);
    const ringTmp: Vec = [0, 0, 0];
    const position = (i: number, d: number, res: Vec) => {
      const i3 = i * 3;
      const ph = this.phase[i] ?? 0;
      // the globe turns; the ring particles travel around their orbit
      let ax: number;
      let ay: number;
      let az: number;
      const ra = this.ringA[i] ?? Number.NaN;
      if (Number.isNaN(ra)) {
        const gx = a[i3] ?? 0;
        const gz = a[i3 + 2] ?? 0;
        ax = GLOBE[0] + gx * cosG - gz * sinG;
        ay = GLOBE[1] + (a[i3 + 1] ?? 0);
        az = GLOBE[2] + gx * sinG + gz * cosG;
      } else {
        ringLocal(ra + t * 0.00018, RING_R, ringTmp);
        ax = GLOBE[0] + ringTmp[0] + (a[i3] ?? 0);
        ay = GLOBE[1] + ringTmp[1] + (a[i3 + 1] ?? 0);
        az = GLOBE[2] + ringTmp[2] + (a[i3 + 2] ?? 0);
      }
      void ph;
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
        const fx = (laneX(c[i4] ?? 0) + (c[i4 + 2] ?? 0)) * (1 - s);
        const fy = FLOW_TOP + u * (FLOW_END - FLOW_TOP);
        const fz = (c[i4 + 3] ?? 0) * (1 - s);
        const k2 = ease(clamp01(toFlow * 1.35 - d * 0.35));
        x += (fx - x) * k2;
        y += (fy - y) * k2;
        z += (fz - z) * k2;
      }

      const logo = this.logo;
      if (toLogo > 0 && logo) {
        // Everything first falls into the point where the streams meet,
        // then blooms outward from it into the logo.
        const k3 = clamp01(toLogo * 1.3 - d * 0.3);
        const gather = ease(clamp01(k3 * 2));
        const bloom = ease(clamp01(k3 * 2 - 1));
        x += (0 - x) * gather;
        y += (FLOW_END - y) * gather;
        z += (0 - z) * gather;
        const lx = (logo[i3] ?? 0) + Math.sin(t * 0.0006 + ph) * 0.004;
        const ly = (logo[i3 + 1] ?? 0) + Math.cos(t * 0.0005 + ph) * 0.004;
        x += (lx - x) * bloom;
        y += (ly - y) * bloom;
        z += ((logo[i3 + 2] ?? 0) - z) * bloom;
      }
      res[0] = x;
      res[1] = y;
      res[2] = z;
    };

    const pos: Vec = [0, 0, 0];
    const q = this.quality;
    for (let o = 0; o < n; o++) {
      const i = this.order[o] ?? 0;
      if (o === 0) ctx.fillStyle = `rgb(${PAPER})`;
      if (o === this.accentFrom) ctx.fillStyle = `rgb(${ACCENT})`;
      // Scattered skip (a golden-ratio stride would carve a wedge out of the sphere).
      if (q < 1 && Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1 > q) continue;
      position(i, this.delay[i] ?? 0, pos);
      project(pos[0], pos[1], pos[2], out);
      const near = out[3] ?? 0;
      const alpha = (0.12 + 0.88 * near * near + 0.35 * toLogo) * intensity;
      if (alpha < 0.01) continue;
      const s =
        (this.size[i] ?? 1) *
        (out[2] ?? 1) *
        (0.7 + near * 0.6) *
        (1 + 0.45 * toLogo) *
        (1.35 - 0.35 * smooth(clamp01(toSphere)));
      ctx.globalAlpha = alpha;
      ctx.fillRect((out[0] ?? 0) - s / 2, (out[1] ?? 0) - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    // Labels ride their anchors in every state.
    const k1 = ease(clamp01(toSphere * 1.35 - 0.17));
    const k2 = ease(clamp01(toFlow * 1.35 - 0.17));
    this.labels.forEach((label, k) => {
      // Each source rides the orbit ring around the globe.
      const A: Vec = [0, 0, 0];
      ringLocal((k / this.labels.length) * TAU + 0.35 + t * 0.00018, RING_R + 0.06, A);
      A[0] += GLOBE[0];
      A[1] += GLOBE[1];
      A[2] += GLOBE[2];
      const Bs = this.anchorsB[k] ?? [0, 0, 0];
      const Bx = Bs[0] * cosS - Bs[2] * sinS;
      const Bz = Bs[0] * sinS + Bs[2] * cosS;
      const Cx = laneX(k);
      const Cy = FLOW_TOP - 0.1;
      let x = A[0] + (Bx - A[0]) * k1;
      let y = A[1] + (Bs[1] - A[1]) * k1;
      let z = A[2] + (Bz - A[2]) * k1;
      x += (Cx - x) * k2;
      y += (Cy - y) * k2;
      z += (0 - z) * k2;
      project(x, y, z, out);
      const near = out[3] ?? 0;
      const depth = 0.55 + 0.45 * smooth(near);
      const alpha = this.labelAlpha * (depth + (1 - depth) * k2) * (1 - smooth(toLogo));
      label.style.transform = `translate3d(${(out[0] ?? 0).toFixed(1)}px, ${(out[1] ?? 0).toFixed(1)}px, 0)`;
      label.style.opacity = alpha.toFixed(3);
      label.style.zIndex = String(Math.round(near * 10));
      label.classList.toggle("is-flow", k2 > 0.5);
    });

    // The logo waits at the point where every stream ends.
    if (this.logoEl) {
      project(0, FLOW_END, 0, out);
      const shown = smooth(clamp01((toFlow - 0.55) / 0.45)) * this.labelAlpha;
      this.logoEl.style.transform = `translate3d(${(out[0] ?? 0).toFixed(1)}px, ${(out[1] ?? 0).toFixed(1)}px, 0)`;
      this.logoEl.style.opacity = shown.toFixed(3);
      this.logoEl.style.visibility = shown < 0.01 ? "hidden" : "visible";
    }

    if (this.core) {
      const coreAlpha = clamp01(1 - Math.abs(m - 1) * 3.2) * this.fade;
      this.core.style.opacity = coreAlpha.toFixed(3);
      this.core.style.visibility = coreAlpha < 0.01 ? "hidden" : "visible";
    }
  }
}
