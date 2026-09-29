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

/** A trend traced by flowing data, continuing as a widening forecast cone. */
export function forecastLine(): StateDef {
  const trend = (x: number) => 0.45 - x * 0.35 + Math.sin(x * 3.1) * 0.18;
  const role: number[] = [];
  const u0: number[] = [];
  const jitter: number[] = [];
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.68 ? 0 : 1;
      u0[i] = r();
      jitter[i] = normal(r);
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const j = jitter[i] ?? 0;
      if (role[i] === 0) {
        // History: data flowing along the line that already happened.
        const x = -1.45 + frac((u0[i] ?? 0) + t * 0.00012) * 1.65;
        p[0] = x;
        p[1] = trend(x) + j * 0.025;
        p[2] = j * 0.05;
        return;
      }
      // Forecast: a dotted continuation that fans out with uncertainty.
      const step = Math.floor((u0[i] ?? 0) * 9) / 9;
      const x = 0.28 + step * 1.25;
      const spread = (x - 0.2) * 0.32;
      p[0] = x + Math.sin(t * 0.002 + i) * 0.01;
      p[1] = trend(x) + j * spread;
      p[2] = j * 0.05;
    },
  };
}

/** A clock face: a ring, twelve ticks and a sweeping hand. */
export function clockFace(): StateDef {
  const role: number[] = [];
  const a0: number[] = [];
  const u0: number[] = [];
  return {
    shape: (i, _n, r) => {
      const roll = r();
      role[i] = roll < 0.55 ? 0 : roll < 0.72 ? 1 : 2;
      a0[i] = role[i] === 1 ? (Math.floor(r() * 12) / 12) * TAU : r() * TAU;
      u0[i] = r();
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const kind = role[i] ?? 0;
      if (kind === 2) {
        // The hand sweeps round; particles stream out along it.
        const a = t * 0.0009 - Math.PI / 2;
        const along = frac((u0[i] ?? 0) + t * 0.0004) * 0.85;
        p[0] = Math.cos(a) * along;
        p[1] = Math.sin(a) * along;
        p[2] = 0;
        return;
      }
      const a = a0[i] ?? 0;
      const rad = kind === 1 ? 0.88 + (u0[i] ?? 0) * 0.1 : 1.05 + ((u0[i] ?? 0) - 0.5) * 0.04;
      p[0] = Math.cos(a) * rad;
      p[1] = Math.sin(a) * rad;
      p[2] = 0;
    },
  };
}

/** Workflows inside workflows: three nested squares turning at their own pace. */
export function nestedRings(): StateDef {
  const layer: number[] = [];
  const u0: number[] = [];
  const sizes = [1.05, 0.68, 0.32];
  const speeds = [0.00022, -0.00036, 0.0006];
  return {
    shape: (i, _n, r) => {
      const roll = r();
      layer[i] = roll < 0.5 ? 0 : roll < 0.82 ? 1 : 2;
      u0[i] = r();
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const k = layer[i] ?? 0;
      const s = sizes[k] ?? 1;
      // Walk the square's perimeter, then rotate the whole square.
      const u = frac((u0[i] ?? 0) + t * 0.00006) * 4;
      const side = Math.floor(u);
      const f = u - side;
      const x = side === 0 ? -s + 2 * s * f : side === 1 ? s : side === 2 ? s - 2 * s * f : -s;
      const y = side === 0 ? -s : side === 1 ? -s + 2 * s * f : side === 2 ? s : s - 2 * s * f;
      const a = t * (speeds[k] ?? 0) + k * 0.4;
      const c = Math.cos(a);
      const sn = Math.sin(a);
      p[0] = x * c - y * sn;
      p[1] = x * sn + y * c;
      p[2] = 0;
    },
  };
}

/** A small visual workflow: blocks joined by lines, data travelling between them. */
export function flowGraph(): StateDef {
  const nodes: Vec[] = [
    [-1.3, 0, 0],
    [-0.15, -0.62, 0],
    [-0.15, 0.62, 0],
    [1.15, 0, 0],
  ];
  const edges: Array<[number, number]> = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
  ];
  const role: number[] = [];
  const which: number[] = [];
  const u0: number[] = [];
  const off: Vec[] = [];
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.5 ? 0 : 1;
      which[i] = role[i] === 0 ? Math.floor(r() * nodes.length) : Math.floor(r() * edges.length);
      u0[i] = r();
      // Nodes read as small rounded blocks.
      off[i] = [(r() - 0.5) * 0.42, (r() - 0.5) * 0.24, 0];
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      if (role[i] === 0) {
        const n = nodes[which[i] ?? 0] ?? [0, 0, 0];
        const o = off[i] ?? [0, 0, 0];
        p[0] = n[0] + o[0];
        p[1] = n[1] + o[1];
        p[2] = 0;
        return;
      }
      const [a, b] = edges[which[i] ?? 0] ?? [0, 1];
      const A = nodes[a] ?? [0, 0, 0];
      const B = nodes[b] ?? [0, 0, 0];
      const u = frac((u0[i] ?? 0) + t * 0.00028);
      p[0] = A[0] + (B[0] - A[0]) * u;
      p[1] = A[1] + (B[1] - A[1]) * u;
      p[2] = 0;
    },
  };
}

/** A report that writes itself: page outline, lines typing in left to right, then a fresh page. */
export function selfBuildingReport(): StateDef {
  const role: number[] = [];
  const line: number[] = [];
  const u0: number[] = [];
  const lens = [0.95, 0.8, 0.9, 0.6, 0.85, 0.5];
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.32 ? 0 : 1;
      line[i] = Math.floor(r() * lens.length);
      u0[i] = r();
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      if (role[i] === 0) {
        // Page outline with a folded corner.
        const per = frac(u0[i] ?? 0) * 4;
        const w = 1.3;
        const h = 1.7;
        const s = Math.floor(per);
        const f = per - s;
        p[0] = s === 0 ? -w / 2 + f * w : s === 1 ? w / 2 : s === 2 ? w / 2 - f * w : -w / 2;
        p[1] = s === 0 ? -h / 2 : s === 1 ? -h / 2 + f * h : s === 2 ? h / 2 : h / 2 - f * h;
        p[2] = 0;
        return;
      }
      // Lines appear one after another over a 6-second cycle.
      const cycle = frac(t * 0.00017);
      const k = line[i] ?? 0;
      const written = Math.min(1, Math.max(0, cycle * 7 - k));
      const len = (lens[k] ?? 0.8) * written;
      p[0] = -0.48 + (u0[i] ?? 0) * len;
      p[1] = -0.55 + k * 0.22;
      p[2] = 0;
      if (written <= 0) p[0] = -0.48;
    },
  };
}

/** Customers: a person at the centre with three rings of customers orbiting at their own pace. */
export function customerOrbits(): StateDef {
  const role: number[] = [];
  const u0: number[] = [];
  const head: Vec[] = [];
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.3 ? 0 : 1 + Math.floor(r() * 3);
      u0[i] = r();
      const a = r() * TAU;
      if (r() < 0.45) head[i] = [Math.cos(a) * 0.17, -0.2 + Math.sin(a) * 0.17, 0];
      else {
        const b = Math.PI + r() * Math.PI;
        head[i] = [Math.cos(b) * 0.34, 0.33 + Math.sin(b) * 0.3, 0];
      }
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      if (role[i] === 0) {
        const h = head[i] ?? [0, 0, 0];
        p[0] = h[0];
        p[1] = h[1];
        p[2] = 0;
        return;
      }
      const ring = role[i] ?? 1;
      const rad = 0.55 + ring * 0.28;
      const a = (u0[i] ?? 0) * TAU + t * (0.0008 / ring) * (ring % 2 ? 1 : -1);
      const z = Math.sin(a) * rad;
      p[0] = Math.cos(a) * rad;
      p[1] = -z * 0.35;
      p[2] = z * 0.9;
    },
  };
}

/** Branches on a map: six pins, and a radar sweep lighting each one as it passes. */
export function branchRadar(): StateDef {
  const pins: Vec[] = [
    [-0.9, -0.55, 0],
    [0.35, -0.8, 0],
    [1.05, -0.2, 0],
    [0.6, 0.6, 0],
    [-0.35, 0.75, 0],
    [-1.05, 0.25, 0],
  ];
  const role: number[] = [];
  const k0: number[] = [];
  const u0: number[] = [];
  return {
    shape: (i, _n, r) => {
      const roll = r();
      role[i] = roll < 0.38 ? 0 : roll < 0.62 ? 1 : 2;
      k0[i] = Math.floor(r() * pins.length);
      u0[i] = r();
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const sweep = t * 0.0012;
      if (role[i] === 0) {
        // Pin: a small drop that pulses when the sweep passes over it.
        const pin = pins[k0[i] ?? 0] ?? [0, 0, 0];
        const ang = Math.atan2(pin[1], pin[0]);
        const since = frac((sweep - ang) / TAU);
        const pulse = 1 + Math.exp(-since * 14) * 1.2;
        const a = (u0[i] ?? 0) * TAU;
        const rr = 0.07 * pulse * Math.sqrt(frac((u0[i] ?? 0) * 7.3));
        p[0] = pin[0] + Math.cos(a) * rr;
        p[1] = pin[1] + Math.sin(a) * rr;
        p[2] = 0;
        return;
      }
      if (role[i] === 1) {
        // The sweeping beam.
        const d = (u0[i] ?? 0) * 1.35;
        const a = sweep - frac(i * 0.37) * 0.35;
        p[0] = Math.cos(a) * d;
        p[1] = Math.sin(a) * d;
        p[2] = 0;
        return;
      }
      // Range rings.
      const ring = 1 + Math.floor((u0[i] ?? 0) * 3);
      const a = frac(i * 0.618) * TAU;
      p[0] = Math.cos(a) * ring * 0.45;
      p[1] = Math.sin(a) * ring * 0.45;
      p[2] = 0;
    },
  };
}
