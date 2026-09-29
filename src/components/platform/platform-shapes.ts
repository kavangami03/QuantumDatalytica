import { frac, normal, type StateDef, type Vec } from "@/components/story/particles";

const TAU = Math.PI * 2;

/**
 * Loose data scattered along a rail: the "before" picture for the How-it-works
 * track. Points drift slowly so the rail never looks frozen.
 */
export function railScatter(
  width = 3.4,
  height = 0.34,
): { state: StateDef; xAt: (i: number) => number } {
  const base: Vec[] = [];
  const state: StateDef = {
    shape: (i, _n, r) => {
      base[i] = [(r() * 2 - 1) * width, (r() * 2 - 1) * height, normal(r) * 0.4];
      return base[i]!.slice() as Vec;
    },
    motion: (i, t, p) => {
      const b = base[i] ?? [0, 0, 0];
      p[0] = b[0] + Math.sin(t * 0.0003 + i) * 0.05;
      p[1] = b[1] + Math.cos(t * 0.00027 + i * 1.3) * 0.04;
      p[2] = b[2];
    },
  };
  // 0 at the left end of the rail, 1 at the right: used to sweep the morph across.
  return { state, xAt: (i) => ((base[i]?.[0] ?? 0) / width + 1) / 2 };
}

/**
 * A design-canvas dot grid with a soft ripple running across it, as if the
 * canvas is live. The ripple brings dots toward the viewer, which brightens them.
 */
export function dotGrid(cols = 34, rows = 16, w = 2.4, h = 1.2): StateDef {
  const at: Array<[number, number]> = [];
  return {
    shape: (i) => {
      const k = i % (cols * rows);
      const x = ((k % cols) / (cols - 1)) * 2 - 1;
      const y = (Math.floor(k / cols) / (rows - 1)) * 2 - 1;
      at[i] = [x * w, y * h];
      return [x * w, y * h, 0];
    },
    motion: (i, t, p) => {
      const [x, y] = at[i] ?? [0, 0];
      const d = Math.hypot(x + 0.9, y * 1.4);
      const wave = Math.sin(d * 3.2 - t * 0.0016);
      // Crest dots lift a touch and come forward (brighter); troughs sit back.
      p[0] = x;
      p[1] = y - Math.max(wave, 0) * 0.025;
      p[2] = -wave * 0.4;
    },
  };
}

/** ECG-style trace: spikes scroll right to left, like a live status feed. */
export function pulseLine(opts: { width?: number; amp?: number; period?: number } = {}): StateDef {
  const { width = 3, amp = 0.32, period = 2 } = opts;
  const u0: number[] = [];
  const j: number[] = [];
  const beat = (s: number) => {
    // One beat per period: flat, small bump, sharp spike, dip, flat.
    if (s < 0.35) return 0;
    if (s < 0.42) return Math.sin(((s - 0.35) / 0.07) * Math.PI) * 0.18;
    if (s < 0.47) return 0;
    if (s < 0.5) return -((s - 0.47) / 0.03) * 0.25;
    if (s < 0.55) return -0.25 + ((s - 0.5) / 0.05) * 1.25;
    if (s < 0.6) return 1 - ((s - 0.55) / 0.05) * 1.35;
    if (s < 0.65) return -0.35 + ((s - 0.6) / 0.05) * 0.35;
    return 0;
  };
  return {
    shape: (i, _n, r) => {
      u0[i] = r();
      j[i] = normal(r) * 0.018;
      return [(u0[i]! * 2 - 1) * width, 0, 0];
    },
    motion: (i, t, p) => {
      const u = u0[i] ?? 0;
      const x = (u * 2 - 1) * width;
      const s = frac((x + width) / period + t * 0.00032);
      p[0] = x;
      p[1] = -beat(s) * amp + (j[i] ?? 0);
      // The fresh end (right) sits forward and bright; the tail fades back.
      p[2] = (1 - u) * 0.9 - 0.5;
    },
  };
}

/** Scale and offset another state (handy to fit a shared metaphor into a new frame). */
export function fitState(def: StateDef, k: number, dx = 0, dy = 0): StateDef {
  const tmp: Vec = [0, 0, 0];
  return {
    ...def,
    shape: (i, n, r) => {
      const p = def.shape(i, n, r);
      return [p[0] * k + dx, p[1] * k + dy, p[2] * k];
    },
    motion: (i, t, p) => {
      tmp[0] = (p[0] - dx) / k;
      tmp[1] = (p[1] - dy) / k;
      tmp[2] = p[2] / k;
      def.motion?.(i, t, tmp);
      p[0] = tmp[0] * k + dx;
      p[1] = tmp[1] * k + dy;
      p[2] = tmp[2] * k;
    },
  };
}

/** A shape sampled from text (e.g. "</>" or "?"), turning gently in 3D. */
export function textMark(points: Array<[number, number]>, width: number, aspect = 0.5): StateDef {
  const pick: number[] = [];
  const dz: number[] = [];
  return {
    shape: (i, _n, r) => {
      pick[i] = Math.floor(r() * points.length);
      dz[i] = normal(r) * 0.05;
      const pt = points[pick[i] ?? 0] ?? [0.5, 0.5];
      return [(pt[0] - 0.5) * width, (pt[1] - 0.5) * width * aspect, 0];
    },
    motion: (i, t, p) => {
      const pt = points[pick[i] ?? 0] ?? [0.5, 0.5];
      const x = (pt[0] - 0.5) * width;
      const y = (pt[1] - 0.5) * width * aspect;
      const a = Math.sin(t * 0.0005) * 0.45;
      p[0] = x * Math.cos(a) + Math.sin(t * 0.0011 + i) * 0.008;
      p[1] = y + Math.cos(t * 0.0009 + i) * 0.008;
      p[2] = x * Math.sin(a) + (dz[i] ?? 0);
    },
  };
}

/** Three tools linked by moving packets: HubSpot → Airtable → Gmail. */
export function syncChain(): StateDef {
  const nodes: Vec[] = [
    [-1.15, 0, 0],
    [0, 0, 0],
    [1.15, 0, 0],
  ];
  const role: number[] = [];
  const u0: number[] = [];
  const which: number[] = [];
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.55 ? 0 : 1;
      u0[i] = r();
      which[i] = Math.floor(r() * 3);
      return nodes[which[i] ?? 0]!.slice() as Vec;
    },
    motion: (i, t, p) => {
      const u = u0[i] ?? 0;
      if (role[i] === 0) {
        // Each tool is a small ring that turns.
        const c = nodes[which[i] ?? 0] ?? [0, 0, 0];
        const a = u * TAU + t * 0.0006 * ((which[i] ?? 0) % 2 ? -1 : 1);
        p[0] = c[0] + Math.cos(a) * 0.3;
        p[1] = c[1] + Math.sin(a) * 0.3;
        p[2] = Math.sin(a) * 0.15;
        return;
      }
      // Packets run along the two links, in step.
      const s = frac(u + t * 0.00022);
      const x = -1.15 + s * 2.3;
      const gap = Math.min(Math.abs(x + 1.15), Math.abs(x), Math.abs(x - 1.15));
      p[0] = x;
      p[1] = Math.sin(u * 40) * 0.035 * (gap > 0.3 ? 1 : 0);
      p[2] = gap < 0.3 ? 3 : 0;
    },
  };
}
