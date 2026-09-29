/**
 * Particle states for "Bring every piece together".
 *
 * Apart: each source is a recognisable object drawn in particles (a stack of
 * reports, a page, a spreadsheet grid, a note, a person, a bar chart), floating
 * and slowly turning. Together: a glowing core sphere with orbital rings,
 * the same icons docked around it in miniature, data streaming inward.
 */
import { frac, normal, type Rand, type StateDef, type Vec } from "./particles";

const TAU = Math.PI * 2;

export type IconKind = "stack" | "page" | "grid" | "note" | "person" | "chart" | "chat" | "boxes";

/** A point on a rectangle's outline (w × h, centred). */
function outline(r: Rand, w: number, h: number): [number, number] {
  const per = 2 * (w + h);
  let d = r() * per;
  if (d < w) return [-w / 2 + d, -h / 2];
  d -= w;
  if (d < h) return [w / 2, -h / 2 + d];
  d -= h;
  if (d < w) return [w / 2 - d, h / 2];
  d -= w;
  return [-w / 2, h / 2 - d];
}

/** Local 2D point on the icon, roughly within ±0.3. */
export function iconPoint(kind: IconKind, r: Rand): [number, number] {
  const roll = r();
  switch (kind) {
    case "stack": {
      // Three pages fanned behind each other; the front one has text lines.
      const layer = Math.floor(r() * 3);
      const off = (layer - 1) * 0.055;
      if (layer < 2 || roll < 0.45) {
        const [x, y] = outline(r, 0.36, 0.46);
        return [x + off, y + off];
      }
      const line = Math.floor(r() * 5);
      return [off - 0.12 + r() * (line === 4 ? 0.14 : 0.24), off - 0.14 + line * 0.07];
    }
    case "page": {
      if (roll < 0.4) return outline(r, 0.4, 0.52);
      const line = Math.floor(r() * 6);
      const len = [0.28, 0.24, 0.28, 0.2, 0.26, 0.14][line] ?? 0.2;
      return [-0.14 + r() * len, -0.18 + line * 0.07];
    }
    case "grid": {
      if (roll < 0.3) return outline(r, 0.5, 0.4);
      if (roll < 0.62) {
        const col = Math.floor(r() * 3) + 1;
        return [-0.25 + col * 0.125, -0.2 + r() * 0.4];
      }
      const row = Math.floor(r() * 4) + 1;
      return [-0.25 + r() * 0.5, -0.2 + row * 0.08];
    }
    case "note": {
      // A note with a folded top-right corner and three lines.
      if (roll < 0.5) {
        const [x, y] = outline(r, 0.42, 0.42);
        if (x > 0.12 && y < -0.12) return [0.12 + r() * 0.09, -0.21 + r() * 0.09];
        return [x, y];
      }
      if (roll < 0.6) {
        const u = r();
        return [0.12 + u * 0.09, -0.12 - u * 0.09];
      }
      const line = Math.floor(r() * 3);
      return [-0.15 + r() * 0.26, -0.06 + line * 0.08];
    }
    case "person": {
      if (roll < 0.42) {
        const a = r() * TAU;
        const rr = 0.09 + normal(r) * 0.006;
        return [Math.cos(a) * rr, -0.12 + Math.sin(a) * rr];
      }
      // Shoulders: an upper half-ellipse.
      const a = Math.PI + r() * Math.PI;
      return [Math.cos(a) * 0.19, 0.2 + Math.sin(a) * 0.17];
    }
    case "chat": {
      // A speech bubble with a tail and three dots.
      if (roll < 0.62) return outline(r, 0.46, 0.3);
      if (roll < 0.74) {
        const u = r();
        return [-0.1 - u * 0.08, 0.15 + u * 0.1];
      }
      const dot = Math.floor(r() * 3);
      const a = r() * TAU;
      const rr = r() * 0.03;
      return [-0.1 + dot * 0.1 + Math.cos(a) * rr, Math.sin(a) * rr];
    }
    case "boxes": {
      // Three stacked boxes: two at the bottom, one on top.
      const box = Math.floor(r() * 3);
      const at: [number, number] =
        box === 0 ? [-0.12, 0.12] : box === 1 ? [0.12, 0.12] : [0, -0.12];
      const [x, y] = outline(r, 0.22, 0.22);
      if (roll < 0.15) return [at[0] - 0.11 + r() * 0.22, at[1]];
      return [at[0] + x, at[1] + y];
    }
    case "chart": {
      if (roll < 0.14) return [-0.24 + r() * 0.48, 0.2];
      if (roll < 0.26) {
        // Trend line over the bars.
        const u = r();
        return [-0.21 + u * 0.42, 0.02 - u * 0.24 + Math.sin(u * 7) * 0.02];
      }
      const bar = Math.floor(r() * 4);
      const h = [0.14, 0.22, 0.3, 0.38][bar] ?? 0.2;
      return [-0.18 + bar * 0.12 + (r() - 0.5) * 0.06, 0.2 - r() * h];
    }
  }
}

/** Rotate a local icon point around the vertical axis (a slow 3D turn). */
function turn(x: number, y: number, angle: number, scale: number, at: Vec, p: Vec) {
  p[0] = at[0] + x * Math.cos(angle) * scale;
  p[1] = at[1] + y * scale;
  p[2] = at[2] + x * Math.sin(angle) * scale;
}

/** State 0: the sources as floating particle icons. */
export function iconsState(nodes: Vec[], kinds: IconKind[], scale = 1.35): StateDef {
  const node: number[] = [];
  const local: Array<[number, number]> = [];
  return {
    shape: (i, _n, r) => {
      const k = i % nodes.length;
      node[i] = k;
      local[i] = iconPoint(kinds[k] ?? "page", r);
      const at = nodes[k] ?? [0, 0, 0];
      const [x, y] = local[i] ?? [0, 0];
      return [at[0] + x * scale, at[1] + y * scale, at[2]];
    },
    motion: (i, t, p) => {
      const k = node[i] ?? 0;
      const at = nodes[k] ?? [0, 0, 0];
      const [x, y] = local[i] ?? [0, 0];
      const angle = Math.sin(t * 0.00045 + k * 1.7) * 0.75;
      const bob: Vec = [at[0], at[1] + Math.sin(t * 0.0007 + k * 2.1) * 0.05, at[2]];
      turn(x, y, angle, scale, bob, p);
    },
    anchorMotion: (t, p) => {
      p[1] += 0;
      void t;
    },
  };
}

/** State 1: core sphere, two orbital rings, docked mini icons, inward streams. */
export type LogoSample = { points: Array<[number, number]>; accent: boolean[]; aspect: number };

/**
 * State 1: at the centre the QuantumDataLytica logo drawn in particles (or a
 * sphere if no logo is given), with orbit rings, docked mini icons and
 * inward streams. `accentFor` colours logo particles like the real logo.
 */
export function coreState(
  nodes: Vec[],
  kinds: IconKind[],
  logo?: LogoSample,
  logoWidth = 1.35,
): StateDef & { accentFor: (i: number) => boolean } {
  const logoPx: number[] = [];
  const role: number[] = [];
  const node: number[] = [];
  const local: Array<[number, number]> = [];
  const u0: number[] = [];
  const bend: number[] = [];
  const sph: Vec[] = [];
  const rings: Array<[number, number]> = logo
    ? [
        [0.95, 1.2],
        [1.05, -0.6],
      ]
    : [
        [0.66, 1.15],
        [0.78, -0.55],
      ];
  return {
    accentFor: (i) => role[i] === 0 && logo !== undefined && (logo.accent[logoPx[i] ?? 0] ?? false),
    shape: (i, n, r) => {
      const roll = r();
      const k = i % nodes.length;
      node[i] = k;
      u0[i] = r();
      if (roll < 0.36) {
        role[i] = 0;
        // Fibonacci shell plus a soft inner glow.
        const m = Math.floor(r() * 900);
        const y = 1 - ((m + 0.5) / 900) * 2;
        const rr = Math.sqrt(1 - y * y);
        const th = m * Math.PI * (3 - Math.sqrt(5));
        if (logo && logo.points.length) {
          const k2 = Math.floor(r() * logo.points.length);
          logoPx[i] = k2;
          const pt = logo.points[k2] ?? [0.5, 0.5];
          sph[i] = [
            (pt[0] - 0.5) * logoWidth,
            (pt[1] - 0.5) * logoWidth * logo.aspect,
            (r() - 0.5) * 0.08,
          ];
          return sph[i] ?? [0, 0, 0];
        }
        const rad = r() < 0.8 ? 0.42 : r() * 0.36;
        sph[i] = [Math.cos(th) * rr * rad, y * rad, Math.sin(th) * rr * rad];
        return sph[i] ?? [0, 0, 0];
      }
      if (roll < 0.5) {
        role[i] = 1 + (r() < 0.5 ? 0 : 1);
        return [0, 0, 0];
      }
      if (roll < 0.72) {
        role[i] = 3;
        local[i] = iconPoint(kinds[k] ?? "page", r);
        const at = nodes[k] ?? [0, 0, 0];
        const [x, y] = local[i] ?? [0, 0];
        return [at[0] + x * 0.62, at[1] + y * 0.62, at[2]];
      }
      role[i] = 4;
      bend[i] = (Math.floor(r() * 3) - 1) * 0.12 + 0.28;
      return nodes[k] ?? [0, 0, 0];
    },
    motion: (i, t, p) => {
      const kind = role[i] ?? 0;
      if (kind === 0 && logo) {
        // The logo holds its shape, breathing and shimmering.
        const s = sph[i] ?? [0, 0, 0];
        const breathe = 1 + Math.sin(t * 0.0012) * 0.02;
        p[0] = s[0] * breathe + Math.sin(t * 0.0009 + i) * 0.004;
        p[1] = s[1] * breathe + Math.cos(t * 0.0008 + i) * 0.004;
        p[2] = s[2];
        return;
      }
      if (kind === 0) {
        const s = sph[i] ?? [0, 0, 0];
        const a = t * 0.00035;
        const c = Math.cos(a);
        const sn = Math.sin(a);
        p[0] = s[0] * c - s[2] * sn;
        p[1] = s[1];
        p[2] = s[0] * sn + s[2] * c;
        return;
      }
      if (kind === 1 || kind === 2) {
        const [rad, tilt] = rings[kind - 1] ?? [0.7, 1];
        const a = (u0[i] ?? 0) * TAU + t * (kind === 1 ? 0.0005 : -0.0004);
        const z = Math.sin(a) * rad;
        p[0] = Math.cos(a) * rad;
        p[1] = -z * Math.sin(tilt);
        p[2] = z * Math.cos(tilt);
        return;
      }
      const k = node[i] ?? 0;
      const at = nodes[k] ?? [0, 0, 0];
      if (kind === 3) {
        const [x, y] = local[i] ?? [0, 0];
        const angle = Math.sin(t * 0.0005 + k * 1.7) * 0.5;
        turn(x, y, angle, 0.62, [at[0], at[1] + Math.sin(t * 0.0008 + k) * 0.03, at[2]], p);
        return;
      }
      // Stream: a curved path from the icon into the core, speeding up as it falls in.
      const u = Math.pow(frac((u0[i] ?? 0) + t * 0.00013), 1.3);
      const inv = 1 - u;
      const b = bend[i] ?? 0.3;
      const cx = at[0] * 0.5 - at[1] * b;
      const cy = at[1] * 0.5 + at[0] * b * 0.6;
      const end = logo ? 0.62 : 0.42;
      const len = Math.hypot(at[0], at[1]) || 1;
      const ex = (at[0] / len) * end;
      const ey = (at[1] / len) * end;
      p[0] = inv * inv * at[0] + 2 * inv * u * cx + u * u * ex;
      p[1] = inv * inv * at[1] + 2 * inv * u * cy + u * u * ey;
      p[2] = inv * inv * at[2];
    },
  };
}

export type Fault =
  "delayed" | "duplicate" | "scattered" | "lost" | "disconnected" | "unread" | "outdated";

/**
 * The Reality state: every source as an icon that visibly suffers its problem.
 * delayed: a small loading spinner at its corner · duplicate: a ghost copy behind it ·
 * scattered: it keeps shaking loose · lost: part of it drifts off and back ·
 * disconnected: split in two · unread: a pulsing badge · outdated: it glitches.
 */
export function faultsState(
  places: Vec[],
  kinds: IconKind[],
  faults: Fault[],
  scale = 1.25,
): StateDef {
  const node: number[] = [];
  const local: Array<[number, number]> = [];
  const extra: number[] = [];
  const seed: number[] = [];
  const dir: Array<[number, number]> = [];
  return {
    shape: (i, _n, r) => {
      const k = i % places.length;
      node[i] = k;
      local[i] = iconPoint(kinds[k] ?? "page", r);
      extra[i] = r();
      seed[i] = r();
      const a = r() * TAU;
      dir[i] = [Math.cos(a), Math.sin(a)];
      const at = places[k] ?? [0, 0, 0];
      const [x, y] = local[i] ?? [0, 0];
      return [at[0] + x * scale, at[1] + y * scale, at[2]];
    },
    motion: (i, t, p) => {
      const k = node[i] ?? 0;
      const at = places[k] ?? [0, 0, 0];
      let [x, y] = local[i] ?? [0, 0];
      const e = extra[i] ?? 0;
      const sd = seed[i] ?? 0;
      let z = 0;
      switch (faults[k]) {
        case "delayed": {
          // A few particles form a small spinner at the corner, like a stuck load.
          if (e < 0.12) {
            const a = (e / 0.12) * 4.4 + t * 0.005;
            x = 0.27 + Math.cos(a) * 0.075;
            y = -0.25 + Math.sin(a) * 0.075;
          } else {
            y += Math.sin(t * 0.001 + sd * 6) * 0.008;
          }
          break;
        }
        case "duplicate": {
          if (e < 0.45) {
            // The ghost copy, offset and flickering in position.
            x += 0.1 + Math.sin(t * 0.003) * 0.012;
            y -= 0.08;
            z = -0.2;
          }
          break;
        }
        case "scattered": {
          const burst = Math.pow((Math.sin(t * 0.0011 + k) + 1) / 2, 3) * (0.03 + sd * 0.08);
          const d = dir[i] ?? [0, 0];
          x += d[0] * burst;
          y += d[1] * burst;
          z = d[1] * burst;
          break;
        }
        case "lost": {
          // A slow tide carries part of the icon away, then brings it back.
          const tide = (Math.sin(t * 0.0006 + k) + 1) / 2;
          if (e < 0.3) {
            const d = dir[i] ?? [0, 0];
            const far = tide * (0.12 + sd * 0.25);
            x += d[0] * far + tide * 0.2;
            y += d[1] * far * 0.6 - tide * 0.1;
          }
          break;
        }
        case "disconnected": {
          const gap = 0.07 + Math.sin(t * 0.0012) * 0.025;
          x += x < 0 ? -gap : gap;
          y += x < 0 ? 0.03 : -0.03;
          break;
        }
        case "unread": {
          if (e < 0.16) {
            // Notification badge pulsing at the top-right corner.
            const pulse = 1 + Math.sin(t * 0.006) * 0.25;
            const a = (e / 0.16) * TAU;
            const rr = Math.sqrt(sd) * 0.055 * pulse;
            x = 0.25 + Math.cos(a) * rr;
            y = -0.2 + Math.sin(a) * rr;
          }
          break;
        }
        case "outdated": {
          // Rows jump sideways now and then, like a broken screen.
          const row = Math.floor((y + 0.3) * 12);
          const glitch = frac(Math.sin(row * 91.7 + Math.floor(t * 0.004)) * 43758.5);
          if (glitch > 0.82) x += (glitch - 0.9) * 0.9;
          break;
        }
      }
      p[0] = at[0] + x * scale;
      p[1] = at[1] + y * scale;
      p[2] = at[2] + z;
    },
  };
}

/**
 * One straight pipeline through glowing stations: data flows left to right,
 * swirling as it passes through each station.
 */
export function stationsState(
  stations: number[],
  opts: { y?: number; from?: number; to?: number } = {},
): StateDef {
  const { y = 0, from = -2.6, to = 2.6 } = opts;
  const role: number[] = [];
  const u0: number[] = [];
  const which: number[] = [];
  const sph: Vec[] = [];
  const j: Vec[] = [];
  return {
    shape: (i, _n, r) => {
      const roll = r();
      u0[i] = r();
      j[i] = [normal(r) * 0.03, normal(r) * 0.05, normal(r) * 0.05];
      if (roll < 0.34) {
        role[i] = 1;
        which[i] = Math.floor(r() * stations.length);
        const a = r() * TAU;
        const b = Math.acos(2 * r() - 1);
        const rad = 0.2 + normal(r) * 0.015;
        sph[i] = [
          Math.sin(b) * Math.cos(a) * rad,
          Math.cos(b) * rad,
          Math.sin(b) * Math.sin(a) * rad,
        ];
        return [stations[which[i] ?? 0] ?? 0, y, 0];
      }
      role[i] = 0;
      return [from, y, 0];
    },
    motion: (i, t, p) => {
      const jj = j[i] ?? [0, 0, 0];
      if (role[i] === 1) {
        const s = sph[i] ?? [0, 0, 0];
        const a = t * 0.0009 + (which[i] ?? 0);
        const c = Math.cos(a);
        const sn = Math.sin(a);
        p[0] = (stations[which[i] ?? 0] ?? 0) + s[0] * c - s[2] * sn;
        p[1] = y + s[1];
        p[2] = s[0] * sn + s[2] * c;
        return;
      }
      const u = frac((u0[i] ?? 0) + t * 0.00012);
      const x = from + u * (to - from);
      // Squeeze into a tight beam between stations, open up inside them.
      let near = 0;
      for (const sx of stations) near = Math.max(near, Math.exp(-((x - sx) ** 2) / 0.04));
      const spread = 0.35 + near * 2.2;
      p[0] = x + jj[0];
      p[1] = y + jj[1] * spread;
      p[2] = jj[2] * spread;
    },
  };
}

/**
 * A signal tracing a zigzag path through clue nodes. Particle i sits at
 * position u[i] along the path (0 start, 1 end) and shimmers there; the
 * reveal is driven by localMorph in the scene, so the trace draws on scroll.
 * About 12% of particles form the burst at the end ("the answer").
 */
export function traceState(points: Vec[]): { state: StateDef; along: (i: number) => number } {
  const seg = points.length - 1;
  const at = (u: number, out: Vec) => {
    const f = Math.min(u * seg, seg - 1e-6);
    const k = Math.floor(f);
    const s = f - k;
    const a = points[k] ?? [0, 0, 0];
    const b = points[k + 1] ?? a;
    // Smooth the corners a little.
    const e = s * s * (3 - 2 * s);
    out[0] = a[0] + (b[0] - a[0]) * e;
    out[1] = a[1] + (b[1] - a[1]) * s;
    out[2] = a[2] + (b[2] - a[2]) * s;
  };
  const u0: number[] = [];
  const burst: Vec[] = [];
  const isBurst: boolean[] = [];
  const j: Vec[] = [];
  return {
    along: (i) => (isBurst[i] ? 0.985 : (u0[i] ?? 0)),
    state: {
      shape: (i, _n, r) => {
        isBurst[i] = r() < 0.12;
        u0[i] = r();
        j[i] = [normal(r) * 0.025, normal(r) * 0.025, normal(r) * 0.05];
        const a = r() * TAU;
        const b = Math.acos(2 * r() - 1);
        const rad = Math.pow(r(), 0.5) * 0.3;
        burst[i] = [
          Math.sin(b) * Math.cos(a) * rad,
          Math.cos(b) * rad,
          Math.sin(b) * Math.sin(a) * rad,
        ];
        const p: Vec = [0, 0, 0];
        at(u0[i] ?? 0, p);
        return p;
      },
      motion: (i, t, p) => {
        const end = points[points.length - 1] ?? [0, 0, 0];
        if (isBurst[i]) {
          const s = burst[i] ?? [0, 0, 0];
          const pulse = 1 + Math.sin(t * 0.004) * 0.08;
          const a = t * 0.0008;
          p[0] = end[0] + (s[0] * Math.cos(a) - s[2] * Math.sin(a)) * pulse;
          p[1] = end[1] + s[1] * pulse;
          p[2] = end[2] + (s[0] * Math.sin(a) + s[2] * Math.cos(a)) * pulse;
          return;
        }
        // Each particle creeps forward a little along its stretch of path.
        const u = Math.min((u0[i] ?? 0) + frac(t * 0.00008 + (u0[i] ?? 0) * 13) * 0.02, 1);
        at(u, p);
        const jj = j[i] ?? [0, 0, 0];
        p[0] += jj[0] + Math.sin(t * 0.002 + i) * 0.008;
        p[1] += jj[1];
        p[2] += jj[2];
      },
    },
  };
}

export type IndustryForm = "orbit" | "pulse" | "bars" | "trend" | "gears";

/**
 * A distinct particle formation for each industry, with six node points on it
 * for the labels. All forms stay within x ±1.6 so labels never leave the panel.
 *   orbit  (Hospitality)        bookings circulating a tilted ring round a core
 *   pulse  (Healthcare)         a heartbeat line with data flowing along it
 *   bars   (Retail)             six store columns filling up from below
 *   trend  (Financial Services) a rising trend line inside a band of points
 *   gears  (Manufacturing)      two meshed gears turning against each other
 */
export function industryState(form: IndustryForm): { state: StateDef; nodes: Vec[] } {
  const role: number[] = [];
  const u0: number[] = [];
  const j: Vec[] = [];
  const setup = (i: number, r: Rand) => {
    u0[i] = r();
    j[i] = [normal(r) * 0.03, normal(r) * 0.03, normal(r) * 0.05];
    role[i] = r();
  };
  switch (form) {
    case "orbit": {
      const tilt = 1.12;
      const R = 1.35;
      const ring = (a: number, rad: number, p: Vec) => {
        const z = Math.sin(a) * rad;
        p[0] = Math.cos(a) * rad;
        p[1] = -z * Math.sin(tilt) - 0.05;
        p[2] = z * Math.cos(tilt);
      };
      const nodes = Array.from({ length: 6 }, (_, k) => {
        const p: Vec = [0, 0, 0];
        ring((k / 6) * TAU + 0.3, R, p);
        return p;
      });
      return {
        nodes,
        state: {
          shape: (i, _n, r) => {
            setup(i, r);
            return [0, 0, 0];
          },
          motion: (i, t, p) => {
            const jj = j[i] ?? [0, 0, 0];
            if ((role[i] ?? 0) < 0.22) {
              // Core: a small turning sphere.
              const a = (u0[i] ?? 0) * TAU + t * 0.0006;
              const b = ((i * 0.618) % 1) * Math.PI;
              p[0] = Math.sin(b) * Math.cos(a) * 0.32;
              p[1] = Math.cos(b) * 0.32 - 0.05;
              p[2] = Math.sin(b) * Math.sin(a) * 0.32;
              return;
            }
            const inner = (role[i] ?? 0) < 0.45;
            ring((u0[i] ?? 0) * TAU + t * (inner ? -0.00035 : 0.00022), inner ? 0.8 : R, p);
            p[0] += jj[0];
            p[1] += jj[1];
            p[2] += jj[2];
          },
        },
      };
    }
    case "pulse": {
      // A beating heart drawn in particles, with a heartbeat line running through it.
      const heart = (u: number, p: Vec) => {
        const x = 16 * Math.sin(u) ** 3;
        const y = 13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u);
        p[0] = (x / 17) * 0.95;
        p[1] = (-y / 17) * 0.95 - 0.02;
      };
      const ecg = (x: number) => {
        const k = frac((x + 1.6) / 1.6) * 1.6 - 0.8;
        if (k > -0.08 && k < -0.02) return -(k + 0.08) * 3;
        if (k >= -0.02 && k < 0.03) return -0.18 + ((k + 0.02) / 0.05) * 0.95;
        if (k >= 0.03 && k < 0.08) return 0.77 - ((k - 0.03) / 0.05) * 1.05;
        if (k >= 0.08 && k < 0.13) return -0.28 + ((k - 0.08) / 0.05) * 0.28;
        return 0;
      };
      const nodes: Vec[] = [0, 1, 2, 3, 4, 5].map((k) => {
        const ang = -Math.PI / 2 + (k / 6) * TAU + Math.PI / 6;
        return [Math.cos(ang) * 1.5, Math.sin(ang) * 0.95, 0] as Vec;
      });
      return {
        nodes,
        state: {
          shape: (i, _n, r) => {
            setup(i, r);
            return [0, 0, 0];
          },
          motion: (i, t, p) => {
            const jj = j[i] ?? [0, 0, 0];
            // Lub-dub: two quick beats, then rest.
            const ph = frac(t * 0.0009);
            const beat =
              1 +
              Math.exp(-((ph - 0.08) ** 2) / 0.002) * 0.12 +
              Math.exp(-((ph - 0.25) ** 2) / 0.002) * 0.07;
            const roll = role[i] ?? 0;
            if (roll < 0.22) {
              // The heartbeat line sweeping across the whole panel.
              const x = -1.6 + frac((u0[i] ?? 0) + t * 0.00013) * 3.2;
              p[0] = x;
              p[1] = 0.05 - ecg(x) * 0.5 + jj[1] * 0.3;
              p[2] = 0.3;
              return;
            }
            // Outline and a softer glowing fill.
            heart((u0[i] ?? 0) * TAU, p);
            const fill = roll < 0.45 ? 0.35 + ((roll - 0.22) / 0.23) * 0.6 : 1;
            p[0] = p[0] * fill * beat + jj[0];
            p[1] = p[1] * fill * beat + jj[1];
            p[2] = jj[2];
          },
        },
      };
    }
    case "bars": {
      const heights = [0.55, 0.85, 0.45, 1, 0.7, 0.9];
      const xs = [-1.45, -0.87, -0.29, 0.29, 0.87, 1.45];
      const base = 0.8;
      return {
        nodes: xs.map((x, k) => [x, base - (heights[k] ?? 0.5) * 1.55 - 0.08, 0] as Vec),
        state: {
          shape: (i, _n, r) => {
            setup(i, r);
            return [0, 0, 0];
          },
          motion: (i, t, p) => {
            const k = i % 6;
            const jj = j[i] ?? [0, 0, 0];
            const h = (heights[k] ?? 0.5) * 1.55;
            const fill = frac((u0[i] ?? 0) + t * (0.00018 + k * 0.00002));
            p[0] = (xs[k] ?? 0) + ((role[i] ?? 0) - 0.5) * 0.3;
            p[1] = base - fill * h;
            p[2] = jj[2] * 3;
          },
        },
      };
    }
    case "trend": {
      const pts: Vec[] = [
        [-1.6, 0.7, 0],
        [-1.0, 0.35, 0],
        [-0.45, 0.5, 0],
        [0.1, 0.05, 0],
        [0.7, 0.18, 0],
        [1.3, -0.45, 0],
        [1.6, -0.7, 0],
      ];
      const at = (u: number, p: Vec) => {
        const f = Math.min(u * (pts.length - 1), pts.length - 1 - 1e-6);
        const k = Math.floor(f);
        const s = f - k;
        const a = pts[k] ?? [0, 0, 0];
        const b = pts[k + 1] ?? a;
        p[0] = a[0] + (b[0] - a[0]) * s;
        p[1] = a[1] + (b[1] - a[1]) * s;
        p[2] = 0;
      };
      return {
        nodes: pts.slice(0, 6).map(([x, y]) => [x, y, 0] as Vec),
        state: {
          shape: (i, _n, r) => {
            setup(i, r);
            return [0, 0, 0];
          },
          motion: (i, t, p) => {
            const jj = j[i] ?? [0, 0, 0];
            if ((role[i] ?? 0) < 0.35) {
              // Market noise: a band of points hugging the trend, shimmering.
              at(u0[i] ?? 0, p);
              p[1] += jj[1] * 9 + Math.sin(t * 0.002 + i) * 0.02;
              p[2] = jj[2];
              return;
            }
            at(frac((u0[i] ?? 0) + t * 0.0001), p);
            p[1] += jj[1] * 0.6;
            p[2] = jj[2];
          },
          trail: 0.35,
        },
      };
    }
    case "gears": {
      const gear = (cx: number, cy: number, rad: number, teeth: number, a: number, p: Vec) => {
        const tooth = Math.pow(Math.max(0, Math.cos(a * teeth)), 6) * 0.14;
        p[0] = cx + Math.cos(a) * (rad + tooth);
        p[1] = cy + Math.sin(a) * (rad + tooth);
      };
      const G = [
        [-0.62, 0.05, 0.72, 10],
        [0.78, -0.05, 0.55, 8],
      ] as const;
      const nodes: Vec[] = [
        [-1.45, -0.45, 0],
        [-0.62, -0.95, 0],
        [-0.3, 0.85, 0],
        [0.78, -0.75, 0],
        [1.45, 0.3, 0],
        [0.55, 0.65, 0],
      ];
      return {
        nodes,
        state: {
          shape: (i, _n, r) => {
            setup(i, r);
            return [0, 0, 0];
          },
          motion: (i, t, p) => {
            const g = (role[i] ?? 0) < 0.58 ? 0 : 1;
            const [cx, cy, rad, teeth] = G[g];
            const dirn = g === 0 ? 1 : -(10 / 8);
            const a = (u0[i] ?? 0) * TAU + t * 0.0004 * dirn;
            const jj = j[i] ?? [0, 0, 0];
            if (((role[i] ?? 0) * 7) % 1 < 0.2) {
              // Hub: an inner circle on each gear.
              p[0] = cx + Math.cos(a) * rad * 0.35;
              p[1] = cy + Math.sin(a) * rad * 0.35;
            } else {
              gear(cx, cy, rad, teeth, a, p);
            }
            p[2] = jj[2];
          },
        },
      };
    }
  }
}

/** An infinity loop (lemniscate): routine work that never ends. Anchors pass an angle in p[0]. */
export function infinityState(
  opts: { width?: number; cx?: number; cy?: number; speed?: number; tube?: number } = {},
): StateDef {
  const { width = 1.3, cx = 0, cy = 0, speed = 0.0003, tube = 0.1 } = opts;
  const place = (a: number, p: Vec) => {
    const d = 1 + Math.sin(a) ** 2;
    p[0] = cx + (width * Math.cos(a)) / d;
    p[1] = cy + (width * Math.sin(a) * Math.cos(a)) / d;
    // Tilt the crossing in depth so the loop reads as 3D.
    p[2] = Math.sin(a) * 0.35;
  };
  const a0: number[] = [];
  const off: Vec[] = [];
  return {
    shape: (i, n, r) => {
      a0[i] = (i / n) * TAU;
      off[i] = [normal(r) * tube, normal(r) * tube, normal(r) * tube];
      const p: Vec = [0, 0, 0];
      place(a0[i] ?? 0, p);
      return p;
    },
    motion: (i, t, p) => {
      place((a0[i] ?? 0) + t * speed, p);
      const o = off[i] ?? [0, 0, 0];
      p[0] += o[0] * 0.6;
      p[1] += o[1];
      p[2] += o[2];
    },
    anchorMotion: (t, p) => place(p[0] + t * speed, p),
  };
}

/**
 * One View: eight business areas on a slowly turning elliptical ring, each a
 * small particle icon, linked to its neighbours by flowing arcs and feeding
 * the particle logo at the centre. Anchors pass their ring angle in p[0].
 */
export function webState(
  kinds: IconKind[],
  logo: LogoSample | undefined,
  opts: { rx?: number; ry?: number; speed?: number; logoWidth?: number } = {},
): StateDef & { accentFor: (i: number) => boolean } {
  const { rx = 1.9, ry = 0.72, speed = 0.00007, logoWidth = 1.1 } = opts;
  const count = kinds.length;
  const place = (a: number, p: Vec) => {
    p[0] = Math.cos(a) * rx;
    p[1] = Math.sin(a) * ry;
    p[2] = Math.sin(a) * 0.5;
  };
  const role: number[] = [];
  const node: number[] = [];
  const u0: number[] = [];
  const local: Array<[number, number]> = [];
  const logoPx: number[] = [];
  const j: Vec[] = [];
  const nodeAngle = (k: number, t: number) => (k / count) * TAU - Math.PI / 2 + t * speed;
  return {
    accentFor: (i) =>
      role[i] === 0 ? (logo?.accent[logoPx[i] ?? 0] ?? false) : role[i] === 2 || role[i] === 3,
    shape: (i, _n, r) => {
      const roll = r();
      const k = Math.floor(r() * count);
      node[i] = k;
      u0[i] = r();
      j[i] = [normal(r) * 0.02, normal(r) * 0.02, normal(r) * 0.03];
      if (roll < 0.3 && logo && logo.points.length) {
        role[i] = 0;
        logoPx[i] = Math.floor(r() * logo.points.length);
      } else if (roll < 0.58) {
        role[i] = 1;
        local[i] = iconPoint(kinds[k] ?? "page", r);
      } else if (roll < 0.8) {
        role[i] = 2;
      } else if (roll < 0.95) {
        role[i] = 3;
      } else {
        role[i] = 4;
      }
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const k = node[i] ?? 0;
      const jj = j[i] ?? [0, 0, 0];
      switch (role[i]) {
        case 0: {
          const pt = logo?.points[logoPx[i] ?? 0] ?? [0.5, 0.5];
          const breathe = 1 + Math.sin(t * 0.0012) * 0.02;
          p[0] = (pt[0] - 0.5) * logoWidth * breathe + Math.sin(t * 0.0009 + i) * 0.004;
          p[1] = (pt[1] - 0.5) * logoWidth * (logo?.aspect ?? 0.6) * breathe;
          p[2] = 0;
          return;
        }
        case 1: {
          // A small icon riding the ring, gently turning.
          place(nodeAngle(k, t), p);
          const [x, y] = local[i] ?? [0, 0];
          const turn = Math.sin(t * 0.0006 + k) * 0.6;
          p[0] += x * Math.cos(turn) * 0.55;
          p[1] += y * 0.55;
          p[2] += x * Math.sin(turn) * 0.55;
          return;
        }
        case 2: {
          // Arc to the next area, bowing outward, data flowing along it.
          const a0 = nodeAngle(k, t);
          const a1 = nodeAngle(k + 1, t);
          const u = frac((u0[i] ?? 0) + t * 0.00018);
          const a = a0 + (a1 - a0) * u;
          const bow = 1 + Math.sin(u * Math.PI) * 0.12;
          p[0] = Math.cos(a) * rx * bow + jj[0];
          p[1] = Math.sin(a) * ry * bow + jj[1];
          p[2] = Math.sin(a) * 0.5 + jj[2];
          return;
        }
        case 3: {
          // Spoke: data travelling from the area into the logo.
          place(nodeAngle(k, t), p);
          const u = Math.pow(frac((u0[i] ?? 0) + t * 0.00015), 1.4);
          const edge = 0.36;
          const len = Math.hypot(p[0], p[1]) || 1;
          const ex = (p[0] / len) * edge;
          const ey = (p[1] / len) * edge * 0.7;
          p[0] = p[0] + (ex - p[0]) * u + jj[0];
          p[1] = p[1] + (ey - p[1]) * u + jj[1];
          p[2] = p[2] * (1 - u);
          return;
        }
        default: {
          // Faint halo dust around the whole system.
          const a = (u0[i] ?? 0) * TAU + t * speed * 0.6;
          const rr = 1.25 + frac(i * 0.618) * 0.35;
          p[0] = Math.cos(a) * rx * rr;
          p[1] = Math.sin(a) * ry * rr;
          p[2] = Math.sin(a) * 0.6;
        }
      }
    },
    anchorMotion: (t, p) => {
      const a = p[0] + t * speed;
      place(a, p);
      p[1] += 0.3;
    },
  };
}

/** State 0 for One View: the same eight icons, far apart and unconnected. */
export function scatteredIconsState(kinds: IconKind[], places: Vec[]): StateDef {
  return iconsState(places, kinds, 0.9);
}

/**
 * Before/After: a nervous tangle of data (state 0) and the same particles as
 * four calm lanes merging into one steady stream (state 1). \`xOf\` gives each
 * particle's horizontal position, so the divider can untangle it as it passes.
 */
export function tangleToLanes(
  cx: number,
  width = 1.8,
): {
  tangle: StateDef;
  lanes: StateDef;
  xOf: (i: number) => number;
} {
  const a0: number[] = [];
  const n0: Vec[] = [];
  const lane: number[] = [];
  const u0: number[] = [];
  const half = width / 2;
  const knot = (a: number, p: Vec) => {
    p[0] = cx + Math.sin(3 * a + 0.5) * half;
    p[1] = Math.sin(4 * a) * 0.55;
    p[2] = Math.cos(5 * a) * 0.4;
  };
  return {
    xOf: (i) => cx + Math.sin(3 * (a0[i] ?? 0) + 0.5) * half,
    tangle: {
      shape: (i, n, r) => {
        a0[i] = r() * TAU;
        n0[i] = [normal(r) * 0.05, normal(r) * 0.05, normal(r) * 0.05];
        lane[i] = i % 4;
        u0[i] = Math.floor(i / 4) / Math.ceil(n / 4);
        const p: Vec = [0, 0, 0];
        knot(a0[i] ?? 0, p);
        return p;
      },
      motion: (i, t, p) => {
        // Crawls along the knot at uneven speeds, trembling.
        const a = (a0[i] ?? 0) + t * 0.00025 * (1 + Math.sin(i) * 0.6);
        knot(a, p);
        const nz = n0[i] ?? [0, 0, 0];
        p[0] += nz[0] + Math.sin(t * 0.006 + i * 3.1) * 0.015;
        p[1] += nz[1] + Math.cos(t * 0.007 + i * 1.7) * 0.015;
        p[2] += nz[2];
      },
    },
    lanes: {
      shape: () => [cx, 0, 0],
      motion: (i, t, p) => {
        const u = frac((u0[i] ?? 0) + t * 0.00006);
        const merge = u < 0.55 ? 0 : ((u - 0.55) / 0.45) ** 2 * (3 - 2 * ((u - 0.55) / 0.45));
        const laneY = ((lane[i] ?? 0) - 1.5) * 0.24;
        p[0] = cx - half + u * width;
        p[1] = laneY * (1 - merge);
        p[2] = 0;
      },
    },
  };
}

/**
 * Before/After column: particles start as a jittery mess filling the column,
 * and each settles into one of \`rows\` clean streams flowing left to right.
 * \`rowOf(i)\` tells the scene which row (0 = top) a particle belongs to.
 */
export function messToRows(
  rows: number,
  halfW = 1.5,
  halfH = 1,
): {
  mess: StateDef;
  order: StateDef;
  rowOf: (i: number) => number;
} {
  const row: number[] = [];
  const u0: number[] = [];
  const mx: Vec[] = [];
  const lane: number[] = [];
  const rowY = (k: number) => -halfH + ((k + 0.5) / rows) * 2 * halfH;
  return {
    rowOf: (i) => row[i] ?? 0,
    mess: {
      shape: (i, n, r) => {
        row[i] = i % rows;
        u0[i] = Math.floor(i / rows) / Math.ceil(n / rows);
        lane[i] = Math.floor(r() * 3) - 1;
        mx[i] = [(r() * 2 - 1) * halfW, (r() * 2 - 1) * halfH * 0.95, normal(r) * 0.3];
        return mx[i] ?? [0, 0, 0];
      },
      motion: (i, t, p) => {
        const m = mx[i] ?? [0, 0, 0];
        // Restless: every point twitches on its own.
        p[0] = m[0] + Math.sin(t * 0.0031 + i * 2.3) * 0.05;
        p[1] = m[1] + Math.cos(t * 0.0027 + i * 1.7) * 0.05;
        p[2] = m[2];
      },
    },
    order: {
      shape: (i) => [0, rowY(row[i] ?? 0), 0],
      motion: (i, t, p) => {
        const u = frac((u0[i] ?? 0) + t * 0.00009);
        p[0] = -halfW + u * 2 * halfW;
        p[1] = rowY(row[i] ?? 0) + (lane[i] ?? 0) * 0.035 + Math.sin(u * 12 + t * 0.002) * 0.01;
        p[2] = 0;
      },
    },
  };
}

/* ─────────── Section backdrops for the Platform page ─────────── */

/** Blueprint: a faint dot lattice with signals racing along its rows and columns. */
export function blueprintState(cols = 26, rows = 10, w = 5.2, h = 2): StateDef {
  const role: number[] = [];
  const k0: number[] = [];
  const u0: number[] = [];
  const gx = (c: number) => -w / 2 + (c / (cols - 1)) * w;
  const gy = (r: number) => -h / 2 + (r / (rows - 1)) * h;
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.45 ? 0 : r() < 0.6 ? 1 : 2;
      k0[i] = Math.floor(r() * cols * rows);
      u0[i] = r();
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const k = k0[i] ?? 0;
      const c = k % cols;
      const rr = Math.floor(k / cols) % rows;
      if (role[i] === 0) {
        p[0] = gx(c);
        p[1] = gy(rr);
        p[2] = 0;
        return;
      }
      const u = frac((u0[i] ?? 0) + t * 0.00012);
      if (role[i] === 1) {
        // A signal running along a row, with a short tail.
        p[0] = -w / 2 + u * w;
        p[1] = gy(rr) + ((i % 5) - 2) * 0.004;
      } else {
        p[0] = gx(c) + ((i % 5) - 2) * 0.004;
        p[1] = -h / 2 + u * h;
      }
      p[2] = 0;
    },
    trail: 0.5,
  };
}

/** Templates: small page outlines drifting upward, each at its own pace. */
export function risingPagesState(count = 22, w = 5, h = 2.2): StateDef {
  const page: number[] = [];
  const u0: number[] = [];
  const x0: number[] = [];
  const sp: number[] = [];
  const pw = 0.22;
  const ph = 0.3;
  return {
    shape: (i, _n, r) => {
      page[i] = Math.floor(r() * count);
      u0[i] = r();
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const k = page[i] ?? 0;
      if (x0[k] === undefined) {
        x0[k] = frac(Math.sin(k * 91.3) * 437.5) * w - w / 2;
        sp[k] = 0.00003 + frac(Math.sin(k * 17.1) * 91.7) * 0.00004;
      }
      const lift = frac(frac(k * 0.618) + t * (sp[k] ?? 0.00004));
      const cy = h / 2 + 0.3 - lift * (h + 0.6);
      const sway = Math.sin(t * 0.0006 + k) * 0.06;
      // Point on the page outline, plus two text lines inside.
      const d = (u0[i] ?? 0) * 4;
      let x: number;
      let y: number;
      if ((u0[i] ?? 0) < 0.75) {
        const s = Math.floor(d / 0.75);
        const f = (d / 0.75) % 1;
        x = s === 0 ? -pw / 2 + f * pw : s === 1 ? pw / 2 : s === 2 ? pw / 2 - f * pw : -pw / 2;
        y = s === 0 ? -ph / 2 : s === 1 ? -ph / 2 + f * ph : s === 2 ? ph / 2 : ph / 2 - f * ph;
      } else {
        const line = (u0[i] ?? 0) < 0.875 ? 0 : 1;
        x = -pw * 0.3 + frac((u0[i] ?? 0) * 17) * pw * 0.6;
        y = -ph * 0.15 + line * ph * 0.25;
      }
      p[0] = (x0[k] ?? 0) + sway + x;
      p[1] = cy + y;
      p[2] = Math.sin(k) * 0.3;
    },
  };
}

/** Security: a shield outline with a keyhole, and a slow ring of particles guarding it. */
export function shieldState(cx = 0, cy = 0, s = 1): StateDef {
  const role: number[] = [];
  const u0: number[] = [];
  const shield = (u: number, p: Vec) => {
    // Top edge, then two curved sides meeting at the point.
    if (u < 0.2) {
      const f = u / 0.2;
      p[0] = (-0.7 + f * 1.4) * s;
      p[1] = (-0.85 + Math.sin(f * Math.PI) * -0.08) * s;
    } else {
      const f = (u - 0.2) / 0.8;
      const side = f < 0.5 ? 1 : -1;
      const g = f < 0.5 ? f * 2 : (1 - f) * 2;
      p[0] = side * 0.7 * Math.cos(g * Math.PI * 0.5) ** 0.8 * s;
      p[1] = (-0.85 + g * 1.9) * s;
    }
  };
  return {
    shape: (i, _n, r) => {
      role[i] = r() < 0.55 ? 0 : r() < 0.7 ? 1 : 2;
      u0[i] = r();
      return [cx, cy, 0];
    },
    motion: (i, t, p) => {
      const u = u0[i] ?? 0;
      if (role[i] === 0) {
        shield(u, p);
        const breathe = 1 + Math.sin(t * 0.0012) * 0.015;
        p[0] = cx + p[0] * breathe;
        p[1] = cy + p[1] * breathe;
        p[2] = 0;
        return;
      }
      if (role[i] === 1) {
        // Keyhole: a circle over a short stem.
        if (u < 0.6) {
          const a = (u / 0.6) * TAU;
          p[0] = cx + Math.cos(a) * 0.14 * s;
          p[1] = cy + (-0.05 + Math.sin(a) * 0.14) * s;
        } else {
          p[0] = cx + (u - 0.8) * 0.35 * s;
          p[1] = cy + (0.1 + ((u - 0.6) / 0.4) * 0.28) * s;
        }
        p[2] = 0;
        return;
      }
      const a = u * TAU + t * 0.00025;
      const z = Math.sin(a) * 1.25 * s;
      p[0] = cx + Math.cos(a) * 1.25 * s;
      p[1] = cy - z * 0.3;
      p[2] = z;
    },
  };
}

/** A shape offset to (cx, cy) and gently drifting — used for a big "?" behind the FAQ. */
export function glyphState(
  points: Array<[number, number]>,
  width: number,
  cx: number,
  cy: number,
): StateDef {
  const pick: number[] = [];
  return {
    shape: (i, _n, r) => {
      pick[i] = Math.floor(r() * points.length);
      const pt = points[pick[i] ?? 0] ?? [0.5, 0.5];
      return [cx + (pt[0] - 0.5) * width, cy + (pt[1] - 0.5) * width * 0.5, 0];
    },
    motion: (i, t, p) => {
      const pt = points[pick[i] ?? 0] ?? [0.5, 0.5];
      p[0] = cx + (pt[0] - 0.5) * width + Math.sin(t * 0.0008 + i) * 0.012;
      p[1] =
        cy +
        (pt[1] - 0.5) * width * 0.5 +
        Math.cos(t * 0.0007 + i) * 0.012 +
        Math.sin(t * 0.0005) * 0.04;
      p[2] = Math.sin(t * 0.0004 + (pt[0] - 0.5) * 3) * 0.2;
    },
  };
}
