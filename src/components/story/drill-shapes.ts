/**
 * Particle states for "Follow the signal": one number, drilled into until it
 * gives up its story. Revenue is down → one branch collapsed → its evenings
 * went missing → look here first.
 *
 * Every state shares one "signal" set of particles (drawn in the highlight
 * colour): the down arrow, the collapsed bar, the missing revenue, and the
 * focus frame around the answer. Coordinates are field units, y pointing down.
 */
import { frac, normal, type StateDef, type Vec } from "./particles";

const TAU = Math.PI * 2;

/** Exactly 18 of every 100 particles carry the signal. */
export const isSignal = (i: number) => (i * 37) % 100 < 18;

const gauss = (u: number, mid: number, width: number) => Math.exp(-(((u - mid) / width) ** 2));
const shimmer = (i: number, t: number, p: Vec, amount = 0.005) => {
  p[0] += Math.sin(t * 0.0011 + i * 1.7) * amount;
  p[1] += Math.cos(t * 0.0009 + i * 2.3) * amount;
};

/* ─────────── 1 · The number ─────────── */

/** "18%" in particles with a down arrow drawn in the signal colour. */
export function numberState(points: Array<[number, number]>): StateDef {
  const width = 3.2;
  const cx = 0.38;
  const arrow: Vec = [-1.12, -0.02, 0];
  const size = 0.3;
  return {
    shape: (i, _n, r) => {
      if (isSignal(i)) {
        // A filled triangle pointing down.
        let u = r();
        let v = r();
        if (u + v > 1) {
          u = 1 - u;
          v = 1 - v;
        }
        const ax = -size;
        const ay = -size * 0.7;
        return [
          arrow[0] + ax + u * 2 * size + v * size,
          arrow[1] + ay + v * size * 1.75,
          (r() - 0.5) * 0.08,
        ];
      }
      const pt = points[Math.floor(r() * points.length)] ?? [0.5, 0.5];
      return [cx + (pt[0] - 0.5) * width, (pt[1] - 0.5) * width * 0.5, (r() - 0.5) * 0.14];
    },
    motion: (i, t, p) => {
      shimmer(i, t, p);
      // The arrow keeps nudging downward.
      if (isSignal(i)) p[1] += (Math.sin(t * 0.0022) + 1) * 0.035;
    },
  };
}
export const numberCaptionAt: Vec = [0.38, 0.72, 0];

/* ─────────── 2 · The branches ─────────── */

export const branches = ["North", "City", "Riverside", "Harbour", "West", "Airport"];
export const FLAGGED = 3;
const heights = [0.92, 0.78, 0.86, 0.34, 0.7, 0.88];
const WAS = 0.82;
const BASE = 0.62;
const MAX = 1.3;
const BAR_W = 0.3;
export const barX = (k: number) => -1.5 + k * 0.6;
const barTop = (h: number) => BASE - h * MAX;

/** A bar chart of six branches; the collapsed one is the signal, with a ghost of last month. */
export function branchesState(): StateDef {
  return {
    shape: (i, _n, r) => {
      if (isSignal(i)) {
        const x0 = barX(FLAGGED);
        if (r() < 0.72) {
          return [
            x0 + (r() - 0.5) * BAR_W,
            BASE - r() * (heights[FLAGGED] ?? 0.3) * MAX,
            (r() - 0.5) * 0.1,
          ];
        }
        // Dashed outline of where the bar stood last month.
        const top = barTop(WAS);
        const h = BASE - top;
        const per = 2 * h + BAR_W;
        let d = r() * per;
        if (frac((d / per) * 22) > 0.55) d = (d + per / 44) % per;
        if (d < h) return [x0 - BAR_W / 2, BASE - d, 0];
        d -= h;
        if (d < BAR_W) return [x0 - BAR_W / 2 + d, top, 0];
        d -= BAR_W;
        return [x0 + BAR_W / 2, top + d, 0];
      }
      if (r() < 0.06) return [-1.8 + r() * 3.6, BASE + 0.05, 0];
      let k = Math.floor(r() * (branches.length - 1));
      if (k >= FLAGGED) k += 1;
      return [
        barX(k) + (r() - 0.5) * BAR_W,
        BASE - r() * (heights[k] ?? 0.5) * MAX,
        (r() - 0.5) * 0.1,
      ];
    },
    motion: (i, t, p) => shimmer(i, t, p, 0.004),
  };
}
export const branchLabelAt = (k: number): Vec => [barX(k), BASE + 0.2, 0];
export const flagAt: Vec = [barX(FLAGGED), barTop(WAS) - 0.2, 0];

/* ─────────── 3 · The hours ─────────── */

/** Trading hours 8am → 10pm across the chart. */
export const lineX = (u: number) => -1.6 + u * 3.2;
const expected = (u: number) =>
  0.28 + 0.42 * gauss(u, 0.3, 0.11) + 0.64 * gauss(u, 0.77, 0.1) + 0.1 * u;
const missing = (u: number) => 0.6 * gauss(u, 0.78, 0.075);
const lineY = (v: number) => BASE - v * 1.25;
const DIP: [number, number] = [0.64, 0.93];
/** 8am, 12pm, 4pm, 8pm as fractions of the trading day. */
export const hourTicks: Array<[string, number]> = [
  ["8am", 0],
  ["12pm", 4 / 14],
  ["4pm", 8 / 14],
  ["8pm", 12 / 14],
];

/**
 * One branch's day: the usual day as a dashed line, this month as a solid line
 * with a soft area under it, and the missing evening revenue lit in between.
 */
export function hoursState(): StateDef {
  return {
    shape: (i, _n, r) => {
      if (isSignal(i)) {
        const u = DIP[0] + r() * (DIP[1] - DIP[0]);
        const top = lineY(expected(u));
        const bottom = lineY(expected(u) - missing(u));
        if (r() < 0.35) return [lineX(u), bottom + normal(r) * 0.008, 0];
        return [lineX(u), top + (bottom - top) * r(), (r() - 0.5) * 0.06];
      }
      const roll = r();
      const u = r();
      const actual = expected(u) - missing(u);
      if (roll < 0.42) return [lineX(u), lineY(actual) + normal(r) * 0.007, 0];
      if (roll < 0.62) {
        // Dashed: skip every other stretch of the usual-day line.
        const w = frac(u * 34) > 0.5 ? u + 1 / 68 : u;
        return [lineX(w), lineY(expected(w)) + normal(r) * 0.005, 0];
      }
      if (roll < 0.94) {
        const top = lineY(actual);
        return [lineX(u), top + (BASE - top) * Math.pow(r(), 2.2), (r() - 0.5) * 0.05];
      }
      return [lineX(u), BASE + 0.05, 0];
    },
    motion: (i, t, p) => {
      shimmer(i, t, p, 0.003);
      // The missing revenue flickers like a live alert.
      if (isSignal(i)) p[1] += Math.sin(t * 0.004 + i) * 0.006;
    },
  };
}
export const tickAt = (u: number): Vec => [lineX(u), BASE + 0.2, 0];
export const usualAt: Vec = [lineX(0.6), lineY(expected(0.72)) - 0.02, 0];
export const dipAt: Vec = [lineX(0.785), lineY(expected(0.77)) - 0.2, 0];

/* ─────────── 4 · The answer ─────────── */

/** Half the answer card's size in field units, measured from the DOM. */
export type Frame = { hw: number; hh: number };

/**
 * Focus: corner brackets (the signal) lock onto the answer card while two
 * slow orbits circle it.
 */
export function answerState(frame: Frame): StateDef {
  const corner: number[] = [];
  const along: number[] = [];
  const vertical: boolean[] = [];
  const a0: number[] = [];
  const ring: number[] = [];
  const jitter: Vec[] = [];
  return {
    shape: (i, _n, r) => {
      corner[i] = Math.floor(r() * 4);
      along[i] = r();
      vertical[i] = r() < 0.5;
      a0[i] = r() * TAU;
      ring[i] = r() < 0.7 ? 0 : r() < 0.7 ? 1 : 2;
      jitter[i] = [normal(r) * 0.012, normal(r) * 0.012, normal(r) * 0.2];
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const j = jitter[i] ?? [0, 0, 0];
      if (isSignal(i)) {
        const pulse = 1 + Math.sin(t * 0.003) * 0.025;
        const w = frame.hw * pulse + 0.14;
        const h = frame.hh * pulse + 0.14;
        const c = corner[i] ?? 0;
        const sx = c % 2 ? 1 : -1;
        const sy = c > 1 ? 1 : -1;
        const arm = Math.min(w, h) * 0.55 * (along[i] ?? 0);
        p[0] = sx * (w - (vertical[i] ? 0 : arm)) + j[0];
        p[1] = sy * (h - (vertical[i] ? arm : 0)) + j[1];
        p[2] = 0;
        return;
      }
      const k = ring[i] ?? 0;
      if (k === 2) {
        // Loose dust, drifting.
        const a = (a0[i] ?? 0) + t * 0.00008;
        p[0] = Math.cos(a) * (1.3 + (along[i] ?? 0) * 0.6) + Math.sin(t * 0.0005 + i) * 0.05;
        p[1] = Math.sin(a) * (0.75 + (along[i] ?? 0) * 0.4);
        p[2] = j[2];
        return;
      }
      // Smallest ellipse that clears the card's corners, then a little air.
      const rx = frame.hw + (k === 0 ? 0.35 : 0.65);
      const ry = frame.hh / Math.sqrt(1 - (frame.hw / rx) ** 2) + (k === 0 ? 0.12 : 0.34);
      const a = (a0[i] ?? 0) + t * (k === 0 ? 0.00022 : -0.00015);
      p[0] = Math.cos(a) * rx + j[0];
      p[1] = Math.sin(a) * ry + j[1];
      p[2] = Math.sin(a) * 0.4;
    },
  };
}
