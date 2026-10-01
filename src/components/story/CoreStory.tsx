import { useRef, type CSSProperties } from "react";
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
  type FaultLayout,
  faultsState,
  type IconKind,
  iconsState,
  type LogoSample,
} from "./connection-shapes";

/* Each source, what goes wrong with it, and the reading its tile shows. */
const sources = [
  ["Branch reports", "DELAYED", "Land days after the week they describe.", "LAG", "+3 DAYS"],
  ["Spreadsheets", "DUPLICATE", "Four versions. Nobody knows which is final.", "COPIES", "×4"],
  ["Documents", "SCATTERED", "Spread across drives, inboxes and desktops.", "PLACES", "6"],
  ["Handover notes", "LOST", "Gone when the shift or the person changes.", "FOUND", "0"],
  [
    "Customer records",
    "DISCONNECTED",
    "Sales, support and billing each hold a piece.",
    "LINKED",
    "0 / 3",
  ],
  ["Finance", "DELAYED", "Month-end numbers, weeks after month-end.", "CLOSE", "+12 DAYS"],
  ["Feedback", "UNREAD", "Reviews and complaints nobody gets to.", "UNREAD", "312"],
  [
    "Inventory",
    "OUT OF DATE",
    "Stock counts that were right last Tuesday.",
    "SYNCED",
    "9 DAYS AGO",
  ],
] as const;
/** What the clarity meter settles on once every source shows its fault. */
const CLARITY = 12;
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
const pad2 = (value: number) => String(Math.round(value)).padStart(2, "0");

/**
 * Point each fault icon at the centre of its tile's icon well, in field units
 * (the field's R is min(width × rx, height × ry), centred in the stage).
 */
function measureBoard(stage: HTMLElement, radius: [number, number], layout: FaultLayout) {
  const box = stage.getBoundingClientRect();
  const R = Math.min(stage.clientWidth * radius[0], stage.clientHeight * radius[1]);
  if (!R) return;
  const wells = stage.querySelectorAll<HTMLElement>(".pb-icon");
  wells.forEach((well, k) => {
    const r = well.getBoundingClientRect();
    layout.places[k] = [
      (r.left + r.width / 2 - box.left - box.width / 2) / R,
      (r.top + r.height / 2 - box.top - box.height / 2) / R,
      0,
    ];
  });
  const first = wells[0]?.getBoundingClientRect();
  // Icons span about ±0.25 locally: fill roughly 70% of the well's shorter side.
  if (first) layout.scale = (Math.min(first.width, first.height) * 1.4) / R;
}

export function ProblemScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector<HTMLElement>(".problem-stage");
    if (!stage) return;
    const wide = window.matchMedia("(min-width: 901px)").matches;
    // Desktop fits the swirling mass to the pinned stage; phones to a tall column.
    const radius: [number, number] = wide ? [1 / 5.6, 1 / 2.7] : [0.42, 0.24];
    const layout: FaultLayout = { places: sources.map(() => [0, 0, 0] as Vec), scale: 1 };
    measureBoard(stage, radius, layout);
    const faults = faultsState(layout, sourceKinds, sourceFaults);
    const field = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 5600 : 2400,
        theme: "dark",
        // A still frame stacks every halo at once; keep it crisp.
        glow: conditions.reduce ? 0.04 : 0.18,
        bright: true,
        size: 1.2,
        radius,
        pointer: 0.06,
        tilt: 0,
        accentRatio: 0.3,
        seed: 11,
        warnFor: faults.warnFor,
        states: [
          // everything at once: one dense, restless mass of data
          { shape: shapes.nebula(1.7, 1.05, 0.9), motion: motions.swirl(0.00028, 0.03) },
          // …that is really eight sources, each broken in its own way
          faults,
        ],
      }),
      conditions,
    );
    // The icons follow their tiles through every resize and font swap.
    let live = true;
    const remeasure = () => {
      if (!live) return;
      measureBoard(stage, radius, layout);
      if (conditions.reduce) field?.still();
    };
    const resizer = new ResizeObserver(remeasure);
    resizer.observe(stage);
    stage.querySelectorAll(".pb-icon").forEach((well) => resizer.observe(well));
    void document.fonts.ready.then(remeasure);
    const cleanup = () => {
      live = false;
      resizer.disconnect();
      field?.destroy();
    };
    if (!field || conditions.reduce) return cleanup;

    field.morph = 0;
    const board = el.querySelector<HTMLElement>(".problem-board");
    const tiles = gsap.utils.toArray<HTMLElement>(".pb-tile", el);
    const pills = tiles.map((tile) => tile.querySelector("em"));
    const faultCount = el.querySelector<HTMLElement>("[data-faults]");
    const clarityValue = el.querySelector<HTMLElement>("[data-clarity]");
    const clarityFill = el.querySelector<HTMLElement>(".pb-meter i");
    const readout = { faults: 0, clarity: 100 };
    const paint = () => {
      if (faultCount) faultCount.textContent = pad2(readout.faults);
      if (clarityValue) clarityValue.textContent = `${Math.round(readout.clarity)}%`;
      if (clarityFill) clarityFill.style.transform = `scaleX(${readout.clarity / 100})`;
      board?.classList.toggle("is-critical", readout.clarity < 40);
    };
    paint();

    // One scrubbed story: the mass splits into eight sources, each tile reports
    // its fault as it lands, the fault count climbs and clarity drains away.
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: conditions.desktop
        ? { trigger: stage, start: "top top", end: "+=170%", pin: true, scrub: 1 }
        : { trigger: stage, start: "top 75%", end: "bottom 60%", scrub: 1 },
    });
    tl.to(field, { morph: 1, duration: 1 }, 0)
      .fromTo(
        el.querySelectorAll(".pb-bar, .pb-grid"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.35, stagger: 0.08 },
        0.3,
      )
      .from(
        tiles.flatMap((tile) => [...tile.querySelectorAll(":scope > header, :scope > footer")]),
        { autoAlpha: 0, y: 18, duration: 0.3, stagger: 0.06, ease: "power2.out" },
        0.55,
      );
    pills.forEach((pill, index) => {
      if (!pill) return;
      tl.to(
        pill,
        {
          duration: 0.3,
          scrambleText: { text: pill.textContent ?? "", chars: "DUPLICATEDLYSONR", speed: 0.6 },
        },
        0.62 + index * 0.06,
      );
    });
    tl.to(
      readout,
      { faults: sources.length, clarity: CLARITY, duration: 0.6, onUpdate: paint },
      0.6,
    ).to({}, { duration: conditions.desktop ? 0.35 : 0.05 });

    return cleanup;
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
          label="Eight disconnected sources of business information, each with a fault"
        >
          <div className="problem-board is-critical">
            <div className="pb-bar">
              <span className="pb-live">
                <i aria-hidden="true" />
                Source check
              </span>
              <span className="pb-stats">
                <span>
                  Sources <b>{pad2(sources.length)}</b>
                </span>
                <span>
                  Connected <b>00</b>
                </span>
                <span className="pb-warn">
                  Faults <b data-faults>{pad2(sources.length)}</b>
                </span>
              </span>
            </div>
            <div className="pb-grid">
              {sources.map(([name, tag, note, metric, value], index) => (
                <article
                  className="pb-tile"
                  key={name}
                  style={{ "--c4": index % 4, "--c2": index % 2 } as CSSProperties}
                >
                  <header>
                    <small>{pad2(index + 1)}</small>
                    <span className="pb-metric">
                      {metric} <b>{value}</b>
                    </span>
                  </header>
                  <div className="pb-icon" aria-hidden="true" />
                  <footer>
                    <div>
                      <h3>{name}</h3>
                      <em>{tag}</em>
                    </div>
                    <p>{note}</p>
                  </footer>
                </article>
              ))}
            </div>
            <div className="pb-bar">
              <span className="pb-clarity">
                Clarity
                <span className="pb-meter" aria-hidden="true">
                  <i style={{ transform: `scaleX(${CLARITY / 100})` }} />
                </span>
                <b data-clarity>{CLARITY}%</b>
              </span>
              <span>
                Single view <b className="pb-warn">Not available</b>
              </span>
            </div>
          </div>
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
