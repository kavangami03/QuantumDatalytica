import { useRef } from "react";
import { gsap, SplitText, useScene } from "@/animations/gsap";
import { frac, motions, shapes, spokesState, type StateDef, type Vec } from "./particles";
import { labelsIn, mountField, ParticleStage, PLabel } from "./ParticleStage";
import { businessNodes } from "./data";

const fragments = [
  "CRM",
  "Spreadsheet",
  "Sales",
  "Operations",
  "Finance",
  "Marketing",
  "Feedback",
  "Inventory",
];
const fragmentTags = ["DUPLICATE", "DELAYED", "DISCONNECTED"];

/* Eight silos: each keeps its data moving, none of it reaches the others. */
type Silo = { x: number; y: number; h: number; kind: number };
const SILO_W = 0.34;

const silosDesktop: Silo[] = fragments.map((_, index) => ({
  x: -2.45 + index * 0.7,
  y: -0.12,
  h: 1.55,
  kind: index % 3,
}));
const silosPhone: Silo[] = fragments.map((_, index) => ({
  x: -1.35 + (index % 4) * 0.9,
  y: index < 4 ? -0.95 : 0.85,
  h: 1.05,
  kind: index % 3,
}));

/**
 * kind 0 · DUPLICATE: a twin column of the same data.
 * kind 1 · DELAYED: the same flow, lagging far behind.
 * kind 2 · DISCONNECTED: the column breaks into separate blocks.
 * A few particles leave each silo toward its neighbour and die halfway.
 */
function silosState(silos: Silo[]): StateDef {
  const silo: number[] = [];
  const role: number[] = [];
  const u0: number[] = [];
  const off: Vec[] = [];
  return {
    shape: (i, _n, r) => {
      silo[i] = i % silos.length;
      role[i] = r() < 0.08 ? 1 : 0;
      u0[i] = r();
      off[i] = [(r() - 0.5) * SILO_W, (r() - 0.5) * 0.9, (r() - 0.5) * SILO_W];
      return [0, 0, 0];
    },
    motion: (i, t, p) => {
      const s = silos[silo[i] ?? 0];
      if (!s) return;
      const o = off[i] ?? [0, 0, 0];
      const top = s.y - s.h / 2;
      if (role[i] === 1) {
        // An attempt to reach the next silo that never arrives.
        const u = frac((u0[i] ?? 0) + t * 0.00035);
        p[0] = s.x + SILO_W / 2 + u * 0.3;
        p[1] = s.y + o[1] * s.h * 0.8;
        p[2] = o[2] * 0.3;
        return;
      }
      const slow = s.kind === 1;
      let u = frac((u0[i] ?? 0) + t * (slow ? 0.00004 : 0.00016));
      if (s.kind === 2) {
        // Three blocks separated by gaps.
        const seg = Math.floor(u * 3);
        u = (seg + (u * 3 - seg) * 0.72) / 3;
      }
      const twin = s.kind === 0 && i % 2 === 1 ? 0.2 : s.kind === 0 ? -0.1 : 0;
      p[0] = s.x + o[0] * (s.kind === 0 ? 0.55 : 1) + twin;
      p[1] = top + s.h - u * s.h;
      p[2] = o[2];
    },
  };
}

export function ProblemScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".problem-stage");
    const labels = labelsIn(stage);
    const silos = conditions.desktop ? silosDesktop : silosPhone;
    const field = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 3200 : 1500,
        theme: "dark",
        glow: 0.13,
        radius: desktop ? [0.2, 0.4] : [0.42, 0.24],
        pointer: 0.3,
        tilt: 0.08,
        accentRatio: 0.3,
        seed: 11,
        states: [
          // everything at once: one dense, restless mass of data
          { shape: shapes.nebula(1.7, 1.05, 0.9), motion: motions.swirl(0.00028, 0.03) },
          // …that is really eight silos that never meet
          silosState(silos),
        ],
        anchors: labels.map((label, index) => {
          const s = silos[index];
          return { el: label, at: [null, s ? ([s.x, s.y + s.h / 2 + 0.2, 0] as Vec) : null] };
        }),
      }),
      conditions,
    );
    if (!field || conditions.reduce) return () => field?.destroy();

    field.morph = 0;
    gsap.to(field, {
      morph: 1,
      ease: "none",
      scrollTrigger: conditions.desktop
        ? { trigger: stage, start: "top top", end: "+=120%", pin: true, scrub: 1 }
        : { trigger: stage, start: "top 80%", end: "center 45%", scrub: 1 },
    });

    // Each tag flickers through the failure states once its silo forms.
    labels.forEach((label, index) => {
      const tag = label.querySelector("em");
      if (!tag) return;
      gsap.to(tag, {
        duration: 1.2,
        delay: index * 0.06,
        scrambleText: { text: tag.textContent ?? "", chars: "DUPLICATEDLYSONR", speed: 0.4 },
        scrollTrigger: {
          trigger: stage,
          start: conditions.desktop ? "top -70%" : "center 60%",
          once: true,
        },
      });
    });

    return () => field.destroy();
  });

  return (
    <section className="problem chapter" id="problem" ref={ref} data-chapter="01">
      <div className="chapter-number">
        <span>01 / CONTEXT</span>
        <i data-rule />
      </div>
      <header className="problem-head">
        <p className="kicker" data-reveal>
          The reality
        </p>
        <h2 data-split>
          Your business isn’t short on data.
          <br />
          <em>It’s short on clarity.</em>
        </h2>
      </header>
      <div className="problem-bleed">
        <ParticleStage
          className="problem-stage p-panel"
          label="Disconnected sources of business information"
        >
          {fragments.map((fragment, index) => (
            <PLabel
              key={fragment}
              index={index}
              title={fragment}
              tag={fragmentTags[index % 3]}
              variant="column"
            />
          ))}
        </ParticleStage>
      </div>
      <p className="statement" data-fill>
        More information doesn’t always mean <em>better decisions.</em>
      </p>
    </section>
  );
}

/* The same six areas, first apart, then wired into one centre. */
const hubNodes: Vec[] = [
  [-1.55, -0.72, 0.25],
  [1.45, -0.78, -0.3],
  [2.05, 0.02, 0.2],
  [1.3, 0.78, -0.25],
  [-1.3, 0.8, 0.3],
  [-2.05, 0, -0.2],
];
const apart = hubNodes.map(([x, y, z]) => [x * 1.18, y * 1.25, z * 2] as Vec);

export function ConnectionScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".connection-stage");
    const labels = labelsIn(stage);
    const nodeLabels = labels.slice(0, hubNodes.length);
    const centerLabel = labels[hubNodes.length];
    const field = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 3400 : 1400,
        theme: "dark",
        radius: [0.21, 0.42],
        pointer: 0.35,
        tilt: 0.08,
        seed: 23,
        states: [
          {
            shape: shapes.clusters(apart, [0.2, 0.13, 0.2], 0.18, [2.6, 1.2, 1.2]),
            motion: motions.drift(0.04),
          },
          spokesState(hubNodes, { speed: 0.0001 }),
        ],
        anchors: [
          ...nodeLabels.map((label, index) => ({
            el: label,
            at: [apart[index] ?? null, hubNodes[index] ?? null],
          })),
          ...(centerLabel ? [{ el: centerLabel, at: [null, [0, 0.66, 0] as Vec] }] : []),
        ],
      }),
      conditions,
    );
    if (!field || conditions.reduce) return () => field?.destroy();

    const pin = el.querySelector(".connection-pin");
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: conditions.desktop
        ? { trigger: pin, start: "top top", end: "+=130%", pin: true, scrub: 1 }
        : { trigger: stage, start: "top 80%", end: "center 40%", scrub: 1 },
    });
    tl.fromTo(field, { morph: 0 }, { morph: 1, duration: 1 }).from(
      el.querySelector(".caption-line"),
      { autoAlpha: 0, x: 40, duration: 0.3 },
      0.75,
    );
    return () => field.destroy();
  });

  return (
    <section className="connection chapter" id="connection" ref={ref} data-chapter="02">
      <div className="connection-pin">
        <div className="chapter-number">
          <span>02 / CONNECTION</span>
          <i data-rule />
        </div>
        <div className="split-heading">
          <h2 data-split>
            Bring the pieces
            <br />
            <em>together.</em>
          </h2>
          <p data-reveal>See what is happening across your business—in one connected view.</p>
        </div>
        <ParticleStage
          className="connection-stage"
          label={`YOUR BUSINESS connected to ${businessNodes.map((node) => node.label).join(", ")}`}
        >
          {businessNodes.map((node, index) => (
            <PLabel key={node.label} index={index} title={node.label} />
          ))}
          <PLabel title="YOUR BUSINESS" variant="center" />
        </ParticleStage>
        <p className="caption-line">
          <span /> One connected view of what’s happening.
        </p>
      </div>
    </section>
  );
}

const steps = [
  {
    number: "01",
    title: "DATA",
    question: "What happened?",
    glyph: (
      <div className="scatter-glyph" aria-hidden="true">
        ·· · ·· ·
      </div>
    ),
  },
  {
    number: "02",
    title: "UNDERSTANDING",
    question: "What matters?",
    glyph: (
      <div className="pattern-glyph" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    ),
  },
  {
    number: "03",
    title: "ACTION",
    question: "What happens next?",
    glyph: (
      <div className="action-glyph" aria-hidden="true">
        →
      </div>
    ),
  },
];

/* Scattered facts → a readable pattern → a direction. */
const transformationStates: StateDef[] = [
  { shape: shapes.nebula(1.35, 1, 0.8, 4), motion: motions.swirl(0.0003, 0.02) },
  { shape: shapes.bars([0.45, 0.75, 1], 1.9, 0.85, 1.7), motion: motions.drift(0.012) },
  {
    shape: shapes.arrow(),
    motion: (i, t, p) => {
      motions.drift(0.01)(i, t, p);
      p[0] += Math.sin(t * 0.0028 - p[0] * 2.4) * 0.05;
    },
  },
];

export function TransformationScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const articles = gsap.utils.toArray<HTMLElement>(".transformation-steps article", el);
    const stage = el.querySelector(".morph-stage");

    if (!conditions.desktop) {
      if (!conditions.reduce) {
        articles.forEach((article) => {
          gsap.from(article.children, {
            y: 30,
            autoAlpha: 0,
            stagger: 0.08,
            scrollTrigger: { trigger: article, start: "top 80%", once: true },
          });
        });
      }
      return;
    }

    const field = mountField(
      stage,
      () => ({
        count: 2600,
        theme: "dark",
        glow: 0.12,
        radius: [0.42, 0.42],
        pointer: 0.3,
        tilt: 0.05,
        seed: 5,
        accentRatio: 0.45,
        states: transformationStates,
      }),
      conditions,
    );
    if (!field) return;

    const pinned = el.querySelector<HTMLElement>(".transformation-stage");
    const bars = gsap.utils.toArray<HTMLElement>(".transformation-progress i", el);
    const splits = articles.map((article) =>
      SplitText.create(article.querySelector("h3") ?? article, { type: "chars", mask: "chars" }),
    );

    gsap.set(articles.slice(1), { autoAlpha: 0 });
    field.morph = 0;
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: { trigger: pinned, start: "top top", end: "+=240%", pin: true, scrub: 1 },
    });

    tl.fromTo(bars[0] ?? {}, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "none" }, 0);
    [1, 2].forEach((next) => {
      const at = next * 1.2 - 0.2;
      const leaving = articles[next - 1];
      const entering = articles[next];
      tl.to(field, { morph: next, duration: 0.9, ease: "power1.inOut" }, at - 0.1)
        .to(splits[next - 1]?.chars ?? [], { yPercent: -110, stagger: 0.015, duration: 0.35 }, at)
        .to(leaving ?? {}, { autoAlpha: 0, duration: 0.3 }, at + 0.1)
        .set(entering ?? {}, { autoAlpha: 1 }, at + 0.2)
        .from(splits[next]?.chars ?? [], { yPercent: 110, stagger: 0.015, duration: 0.4 }, at + 0.2)
        .from(
          entering?.querySelectorAll(":scope > span, :scope > p") ?? [],
          { y: 24, autoAlpha: 0, duration: 0.35 },
          at + 0.3,
        )
        .fromTo(bars[next] ?? {}, { scaleX: 0 }, { scaleX: 1, duration: 1, ease: "none" }, at);
    });
    tl.to({}, { duration: 0.3 });

    return () => {
      field.destroy();
      splits.forEach((split) => split.revert());
    };
  });

  return (
    <section className="transformation chapter" id="transformation" ref={ref} data-chapter="03">
      <div className="chapter-number">
        <span>03 / TRANSFORMATION</span>
        <i data-rule />
      </div>
      <p className="transformation-lead" data-fill>
        Information is only useful
        <br />
        when it helps you <em>act.</em>
      </p>
      <div className="transformation-stage">
        <div className="transformation-steps">
          {steps.map((step) => (
            <article key={step.number}>
              <span>{step.number}</span>
              <h3>{step.title}</h3>
              {step.glyph}
              <p>{step.question}</p>
            </article>
          ))}
        </div>
        <ParticleStage className="morph-stage p-panel" />
        <div className="transformation-progress" aria-hidden="true">
          {steps.map((step) => (
            <div key={step.number}>
              <small>{step.title}</small>
              <span>
                <i />
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
