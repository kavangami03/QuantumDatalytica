import { iconPoint, type IconKind } from "./connection-shapes";
import { frac, normal, type StateDef, type Vec } from "./particles";

const TAU = Math.PI * 2;

/* Each source's orbit round the storm: radius, height, phase and speed. */
const ORBITS = [
  { rho: 1.55, y: -0.62, phase: 0.2, speed: 0.00011 },
  { rho: 1.8, y: 0.12, phase: 1.1, speed: 0.000085 },
  { rho: 1.45, y: 0.58, phase: 2.0, speed: 0.00013 },
  { rho: 1.75, y: -0.28, phase: 2.9, speed: 0.00009 },
  { rho: 1.6, y: 0.4, phase: 3.7, speed: 0.000105 },
  { rho: 1.85, y: -0.55, phase: 4.5, speed: 0.00008 },
  { rho: 1.5, y: -0.05, phase: 5.2, speed: 0.00012 },
  { rho: 1.7, y: 0.66, phase: 5.9, speed: 0.000095 },
];

/** Where source k's icon is at time t. */
function orbitAt(k: number, t: number, out: Vec) {
  const o = ORBITS[k % ORBITS.length] ?? ORBITS[0]!;
  const a = o.phase + t * o.speed;
  out[0] = Math.cos(a) * o.rho;
  out[1] = o.y + Math.sin(t * 0.0005 + k * 1.7) * 0.05;
  out[2] = Math.sin(a) * o.rho * 0.8;
}

/** Label anchor for source k: pass it as [k, 0, 0]; it rides just below the icon. */
export const sourceAnchor = (k: number): Vec => [k, 0, 0];

/**
 * The Reality: a data storm. A vortex of loose data spins round an empty eye
 * where a glitching "?" pulses (answers nowhere), while the eight sources
 * tumble round the storm on their own orbits, each carrying its label.
 */
export function stormState(kinds: IconKind[], question: Array<[number, number]>): StateDef {
  const role: number[] = []; // 0 debris · 1 icon · 2 question mark
  const k0: number[] = [];
  const local: Array<[number, number]> = [];
  const y0: number[] = [];
  const rad: number[] = [];
  const a0: number[] = [];
  const w0: number[] = [];
  const tmp: Vec = [0, 0, 0];
  return {
    trail: 0.32,
    shape: (i, _n, r) => {
      const roll = r();
      if (roll < 0.56) {
        role[i] = 0;
        // A funnel: narrow at the bottom, wide at the top, inner rings faster.
        const y = (r() * 2 - 1) * 1.25;
        y0[i] = y;
        rad[i] = 0.62 + 0.55 * ((y + 1.25) / 2.5) + normal(r) * 0.07;
        a0[i] = r() * TAU;
        w0[i] = 0.00055 * Math.pow(0.9 / (rad[i] ?? 1), 1.5);
        return [Math.cos(a0[i] ?? 0) * (rad[i] ?? 1), y, Math.sin(a0[i] ?? 0) * (rad[i] ?? 1)];
      }
      if (roll < 0.9) {
        role[i] = 1;
        k0[i] = i % kinds.length;
        local[i] = iconPoint(kinds[k0[i] ?? 0] ?? "page", r);
        orbitAt(k0[i] ?? 0, 0, tmp);
        return [tmp[0], tmp[1], tmp[2]];
      }
      role[i] = 2;
      const pt = question[Math.floor(r() * question.length)] ?? [0.5, 0.5];
      local[i] = [(pt[0] - 0.5) * 2.7, (pt[1] - 0.5) * 1.35];
      return [local[i]![0], local[i]![1], 0];
    },
    motion: (i, t, p) => {
      if (role[i] === 0) {
        const a = (a0[i] ?? 0) + t * (w0[i] ?? 0);
        const rr = (rad[i] ?? 1) + Math.sin(a * 3 + t * 0.0007) * 0.05;
        p[0] = Math.cos(a) * rr;
        p[1] = (y0[i] ?? 0) + Math.sin(t * 0.0009 + (a0[i] ?? 0) * 3) * 0.04;
        p[2] = Math.sin(a) * rr;
        return;
      }
      if (role[i] === 1) {
        const k = k0[i] ?? 0;
        orbitAt(k, t, tmp);
        const [lx, ly] = local[i] ?? [0, 0];
        // Each icon floats like a loose card: it sways and turns as it orbits.
        const sway = Math.sin(t * 0.0007 + k) * 0.3;
        const turn = Math.sin(t * 0.0006 + k * 1.3) * 0.7;
        const x = (lx * Math.cos(sway) - ly * Math.sin(sway)) * 0.85;
        const y = (lx * Math.sin(sway) + ly * Math.cos(sway)) * 0.85;
        p[0] = tmp[0] + x * Math.cos(turn);
        p[1] = tmp[1] + y;
        p[2] = tmp[2] + x * Math.sin(turn);
        return;
      }
      // The question mark: pulses, and now and then a band of it glitches sideways.
      const [lx, ly] = local[i] ?? [0, 0];
      const pulse = 1 + Math.sin(t * 0.0025) * 0.035;
      const band = Math.floor((ly + 1) * 9);
      const g = frac(Math.sin(band * 12.9898 + Math.floor(t * 0.005) * 78.233) * 43758.5453);
      p[0] = lx * pulse + (g > 0.88 ? (g - 0.94) * 0.9 : 0);
      p[1] = ly * pulse - 0.04;
      p[2] = 0;
    },
    anchorMotion: (t, p) => {
      orbitAt(Math.round(p[0]), t, p);
      p[1] += 0.34;
    },
  };
}
