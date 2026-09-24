/**
 * Small 3D particle sculptures for the use-case cards. Each is one StateDef
 * whose motion keeps it alive: orbiting segments, filling bars, a circulating
 * torus, a converging hub, an hourglass pinch, packets marching in step.
 */
import { frac, normal, spokesState, type StateDef, type Vec } from "./particles";

const TAU = Math.PI * 2;

const tiltX = (p: Vec, angle: number) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const y = p[1] * c - p[2] * s;
  p[2] = p[1] * s + p[2] * c;
  p[1] = y;
};

/** Three customer segments orbiting one another, trailing a faint path. */
export function orbitingSegments(): StateDef {
  const role: number[] = [];
  const a0: number[] = [];
  const off: Vec[] = [];
  const radius = 0.9;
  const tilt = 1.12;
  return {
    shape: (i, _n, r) => {
      const trail = r() < 0.14;
      role[i] = trail ? 3 : i % 3;
      a0[i] = trail ? r() * TAU : ((i % 3) / 3) * TAU;
      const spread = 0.12 + (i % 3) * 0.03;
      off[i] = trail
        ? [0, normal(r) * 0.015, 0]
        : [normal(r) * spread, normal(r) * spread, normal(r) * spread];
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const a = (a0[i] ?? 0) + (role[i] === 3 ? 0 : t * 0.00055);
      const o = off[i] ?? [0, 0, 0];
      p[0] = Math.cos(a) * radius + o[0];
      p[1] = o[1];
      p[2] = Math.sin(a) * radius + o[2];
      tiltX(p, tilt);
    },
  };
}

/** A 3D bar chart whose columns keep filling from below, with a trend line above. */
export function risingBars(): StateDef {
  const heights = [0.36, 0.56, 0.8, 1];
  const xs = [-1.08, -0.36, 0.36, 1.08];
  const base = 0.95;
  const tall = 1.95;
  const role: number[] = [];
  const u0: number[] = [];
  const off: Vec[] = [];
  const topAt = (x: number) => {
    // Smooth curve through the bar tops.
    const k = Math.max(0, Math.min(2.999, (x + 1.08) / 0.72));
    const i = Math.floor(k);
    const f = k - i;
    const a = heights[i] ?? 0;
    const b = heights[i + 1] ?? a;
    const s = f * f * (3 - 2 * f);
    return base - (a + (b - a) * s) * tall - 0.22;
  };
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.16 ? 4 : i % 4;
      u0[i] = r();
      off[i] = [(r() - 0.5) * 0.36, normal(r) * 0.02, (r() - 0.5) * 0.36];
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const o = off[i] ?? [0, 0, 0];
      const k = role[i] ?? 0;
      if (k === 4) {
        const x = -1.3 + frac((u0[i] ?? 0) + t * 0.00013) * 2.6;
        p[0] = x;
        p[1] = topAt(x) + o[1];
        p[2] = o[2] * 0.15;
        return;
      }
      const h = (heights[k] ?? 0.5) * tall;
      p[0] = (xs[k] ?? 0) + o[0];
      p[1] = base - frac((u0[i] ?? 0) + t * 0.00022) * h;
      p[2] = o[2];
    },
  };
}

/** Particles circulating around a tilted torus: a process that never stops. */
export function circulatingTorus(): StateDef {
  const th0: number[] = [];
  const ph: number[] = [];
  const speed: number[] = [];
  return {
    shape: (i, _n, r) => {
      th0[i] = r() * TAU;
      ph[i] = r() * TAU;
      speed[i] = 0.0006 + r() * 0.00035;
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const th = (th0[i] ?? 0) + t * (speed[i] ?? 0.0007);
      const phi = ph[i] ?? 0;
      const ring = 0.9 + 0.2 * Math.cos(phi);
      p[0] = Math.cos(th) * ring;
      p[1] = 0.2 * Math.sin(phi);
      p[2] = Math.sin(th) * ring;
      tiltX(p, 1.08);
    },
  };
}

/** Five sources streaming into one centre. */
export function gatheringHub(): StateDef {
  return spokesState(
    [
      [-1.35, -0.6, 0.35],
      [1.3, -0.72, -0.3],
      [1.45, 0.55, 0.25],
      [-0.1, 1.0, -0.35],
      [-1.4, 0.7, -0.2],
    ],
    { speed: 0.00016 },
  );
}

/** An hourglass: plenty above and below, everything squeezed through one neck. */
export function hourglass(): StateDef {
  const u0: number[] = [];
  const a0: number[] = [];
  const rr: number[] = [];
  return {
    shape: (i, _n, r) => {
      u0[i] = r();
      a0[i] = r() * TAU;
      rr[i] = Math.sqrt(r());
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const u = frac((u0[i] ?? 0) + t * 0.00017);
      const y = -1.15 + u * 2.3;
      const w = 0.07 + 0.95 * Math.pow(Math.abs(y) / 1.15, 1.5);
      const a = (a0[i] ?? 0) + t * 0.0005;
      const rad = (rr[i] ?? 1) * w;
      p[0] = Math.cos(a) * rad;
      p[1] = y;
      p[2] = Math.sin(a) * rad;
    },
  };
}

/** Three lanes of packets moving in perfect step through two checkpoints. */
export function packetLanes(): StateDef {
  const lanes = [-0.64, 0, 0.64];
  const packets = 7;
  const role: number[] = [];
  const lane: number[] = [];
  const packet: number[] = [];
  const off: Vec[] = [];
  return {
    shape: (i, _n, r) => {
      const gate = r() < 0.12;
      role[i] = gate ? 1 : 0;
      lane[i] = gate ? (r() < 0.5 ? 0 : 1) : i % 3;
      packet[i] = Math.floor(r() * packets);
      off[i] = gate
        ? [normal(r) * 0.01, (r() - 0.5) * 1.9, normal(r) * 0.04]
        : [normal(r) * 0.06, normal(r) * 0.035, normal(r) * 0.06];
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const o = off[i] ?? [0, 0, 0];
      if (role[i] === 1) {
        p[0] = (lane[i] === 0 ? -0.55 : 0.55) + o[0];
        p[1] = o[1];
        p[2] = o[2];
        return;
      }
      const x = -1.7 + frac((packet[i] ?? 0) / packets + t * 0.00011) * 3.4;
      p[0] = x + o[0];
      p[1] = (lanes[lane[i] ?? 0] ?? 0) + o[1];
      p[2] = o[2];
    },
  };
}
