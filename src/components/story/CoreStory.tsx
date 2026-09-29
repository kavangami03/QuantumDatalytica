import { useRef } from "react";
import { gsap, SplitText, useScene } from "@/animations/gsap";
import {
  frac,
  motions,
  type ParticleField,
  sampleImage,
  shapes,
  spokesState,
  type StateDef,
  type Vec,
} from "./particles";
import { labelsIn, mountField, ParticleStage, PLabel } from "./ParticleStage";
import {
  coreState,
  type Fault,
  faultsState,
  type IconKind,
  iconsState,
  type LogoSample,
} from "./connection-shapes";

/* Each source and what goes wrong with it (tags drive how its column behaves). */
const sources = [
  ["Branch reports", "DELAYED"],
  ["Spreadsheets", "DUPLICATE"],
  ["Documents", "SCATTERED"],
  ["Handover notes", "LOST"],
  ["Customer records", "DISCONNECTED"],
  ["Finance", "DELAYED"],
  ["Feedback", "UNREAD"],
  ["Inventory", "OUT OF DATE"],
] as const;
const fragments = sources.map(([name]) => name);
/** 0 · a twin copy, 1 · a crawling flow, 2 · broken into pieces. */
const siloKind = (tag: string) =>
  tag === "DUPLICATE" ? 0 : tag === "DELAYED" || tag === "OUT OF DATE" ? 1 : 2;
const stressChips = [
  "Too many branches",
  "Too many reports",
  "Slow decisions",
  "Constant pressure",
];
const connectionNodes = [
  "Branch reports",
  "Documents",
  "Spreadsheets",
  "Handover notes",
  "Customers",
  "Finance",
];

/* Each source becomes an icon that visibly suffers its problem. */
const sourceKinds: IconKind[] = [
  "stack",
  "grid",
  "page",
  "note",
  "person",
  "chart",
  "chat",
  "boxes",
];
const faultOf: Record<string, Fault> = {
  DELAYED: "delayed",
  DUPLICATE: "duplicate",
  SCATTERED: "scattered",
  LOST: "lost",
  DISCONNECTED: "disconnected",
  UNREAD: "unread",
  "OUT OF DATE": "outdated",
};
const sourceFaults = sources.map(([, tag]) => faultOf[tag] ?? "scattered");
const gridDesktop: Vec[] = [-0.62, 0.46].flatMap((y) =>
  [-2.1, -0.7, 0.7, 2.1].map((x) => [x, y, 0] as Vec),
);
const gridPhone: Vec[] = [-1.5, -0.5, 0.5, 1.5].flatMap((y) =>
  [-0.62, 0.62].map((x) => [x, y, 0] as Vec),
);

export function ProblemScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".problem-stage");
    const labels = labelsIn(stage);
    const places = conditions.desktop ? gridDesktop : gridPhone;
    const field = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 5600 : 2400,
        theme: "dark",
        glow: 0.18,
        bright: true,
        size: 1.2,
        radius: desktop ? [0.2, 0.4] : [0.42, 0.24],
        pointer: 0.06,
        tilt: 0,
        accentRatio: 0.3,
        seed: 11,
        states: [
          // everything at once: one dense, restless mass of data
          { shape: shapes.nebula(1.7, 1.05, 0.9), motion: motions.swirl(0.00028, 0.03) },
          // …that is really eight sources, each broken in its own way
          faultsState(places, sourceKinds, sourceFaults, conditions.desktop ? 1.05 : 1),
        ],
        anchors: labels.map((label, index) => {
          const at = places[index];
          return { el: label, at: [null, at ? ([at[0], at[1] + 0.38, 0] as Vec) : null] };
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
        <span>01 / THE REALITY</span>
        <i data-rule />
      </div>
      <header className="problem-head">
        <h2 data-split>
          Your business isn’t short on data.
          <br />
          <em>It’s short on clarity.</em>
        </h2>
        <p className="section-lead" data-reveal>
          Reports from every branch. Files in every team. <strong>Answers nowhere.</strong>
        </p>
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
              tag={sources[index]?.[1]}
              variant="column"
            />
          ))}
        </ParticleStage>
      </div>
      <ul className="stress-chips" aria-label="What it feels like">
        {stressChips.map((chip) => (
          <li key={chip} data-reveal>
            <i aria-hidden="true" />
            {chip}
          </li>
        ))}
      </ul>
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
const apart = hubNodes.map(([x, y, z]) => [x * 1.18, y * 0.82 - 0.1, z * 2] as Vec);
const connectionKinds: IconKind[] = ["stack", "page", "grid", "note", "person", "chart"];
/** A point just below a node, for its label. */
const offset = (at: Vec | undefined, dy: number): Vec | null =>
  at ? [at[0], at[1] + dy, at[2]] : null;

export function ConnectionScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".connection-stage");
    const labels = labelsIn(stage);
    const nodeLabels = labels.slice(0, hubNodes.length);
    const centerLabel = labels[hubNodes.length];
    let field: ParticleField | null = null;
    let cancelled = false;
    const progress = { morph: 0 };

    const build = (logo?: LogoSample) => {
      if (cancelled) return;
      const core = coreState(hubNodes, connectionKinds, logo);
      field = mountField(
        stage,
        ({ desktop }) => ({
          count: desktop ? 4600 : 2000,
          theme: "dark",
          glow: 0.18,
          bright: true,
          radius: [0.21, 0.42],
          pointer: 0.35,
          tilt: 0.08,
          seed: 23,
          accentFor: (i) => core.accentFor(i) || (i * 7) % 10 < 2,
          states: [iconsState(apart, connectionKinds), core],
          anchors: [
            ...nodeLabels.map((label, index) => ({
              el: label,
              at: [offset(apart[index], 0.36), offset(hubNodes[index], 0.3)],
            })),
            ...(centerLabel ? [{ el: centerLabel, at: [null, [0, 0.62, 0] as Vec] }] : []),
          ],
        }),
        conditions,
      );
      if (field && !conditions.reduce) field.morph = progress.morph;
    };
    sampleImage("/brand/symbol-on-dark.svg")
      .then((sample) => build(sample))
      .catch(() => build());
    if (conditions.reduce) {
      return () => {
        cancelled = true;
        field?.destroy();
      };
    }

    // The pin exists from the start, in page order; the particles attach when ready.
    const pin = el.querySelector(".connection-pin");
    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: conditions.desktop
          ? { trigger: pin, start: "top top", end: "+=130%", pin: true, scrub: 1 }
          : { trigger: stage, start: "top 80%", end: "center 40%", scrub: 1 },
      })
      .to(progress, {
        morph: 1,
        duration: 1,
        onUpdate: () => {
          if (field) field.morph = progress.morph;
        },
      })
      .from(el.querySelector(".caption-line"), { autoAlpha: 0, x: 40, duration: 0.3 }, 0.75);
    return () => {
      cancelled = true;
      field?.destroy();
    };
  });

  return (
    <section className="connection chapter" id="connection" ref={ref} data-chapter="02">
      <div className="connection-pin">
        <div className="chapter-number">
          <span>02 / BRING IT TOGETHER</span>
          <i data-rule />
        </div>
        <div className="split-heading">
          <h2 data-split>
            Bring every piece
            <br />
            <em>together.</em>
          </h2>
          <p data-reveal>Upload reports, documents and notes. Connect the tools you already use.</p>
        </div>
        <ParticleStage
          className="connection-stage"
          label={`YOUR BUSINESS connected to ${connectionNodes.join(", ")}`}
        >
          {connectionNodes.map((node, index) => (
            <PLabel key={node} index={index} title={node} />
          ))}
          <PLabel title="YOUR BUSINESS" variant="center" />
        </ParticleStage>
        <p className="caption-line">
          <span /> One source of truth for every branch.
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
    title: "DECISION",
    question: "What should we do next?",
    glyph: (
      <div className="action-glyph" aria-hidden="true">
        →
      </div>
    ),
  },
];

/* Scattered facts → a readable pattern → a direction. */
const transformationStates: StateDef[] = [
  { shape: shapes.nebula(1.05, 0.8, 0.6, 4), motion: motions.swirl(0.0003, 0.02) },
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
        count: 4200,
        theme: "dark",
        glow: 0.2,
        bright: true,
        size: 1.35,
        radius: [0.3, 0.34],
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
        <span>03 / HOW IT WORKS</span>
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
        <ParticleStage className="morph-stage" />
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
      <div className="section-close">
        <p data-fill>
          From a hundred reports to <em>one clear answer.</em>
        </p>
      </div>
    </section>
  );
}
