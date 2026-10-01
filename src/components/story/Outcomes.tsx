import { type ReactNode, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, ScrollTrigger, SplitText, useScene } from "@/animations/gsap";
import {
  flowState,
  funnelState,
  loopState,
  motions,
  onLoop,
  sampleText,
  shapes,
} from "./particles";
import { labelsIn, mountField, ParticleStage, PLabel } from "./ParticleStage";
import { infinityState, stationsState } from "./connection-shapes";
import type { ParticleField, Vec } from "./particles";
import {
  answerState,
  branches,
  branchesState,
  branchLabelAt,
  dipAt,
  flagAt,
  type Frame,
  hourTicks,
  hoursState,
  isSignal,
  numberCaptionAt,
  numberState,
  tickAt,
  usualAt,
} from "./drill-shapes";

const outcomes = [
  ["01", "SEE CLEARLY", "Every branch, every team, one view."],
  ["02", "DECIDE FASTER", "Answers without waiting on reports."],
  ["03", "AUTOPILOT", "Routine reports run on their own."],
  ["04", "SPOT OPPORTUNITIES", "Catch changes before they’re missed."],
  ["05", "ACT WITH CONFIDENCE", "Decisions backed by the full picture."],
];

export function Outcomes() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const splits: SplitText[] = [];
    const rows = gsap.utils.toArray<HTMLElement>(".outcome-list article", el);
    if (!conditions.reduce) {
      rows.forEach((row) => {
        const title = row.querySelector("h3");
        if (!title) return;
        const split = SplitText.create(title, { type: "lines", mask: "lines" });
        splits.push(split);
        gsap
          .timeline({ scrollTrigger: { trigger: row, start: "top 85%", once: true } })
          .from(
            row.querySelector(".row-rule"),
            { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "story" },
            0,
          )
          .from(split.lines, { yPercent: 110, duration: 1.1 }, 0.15)
          .from(
            row.querySelectorAll(":scope > span, :scope > p, :scope > i"),
            { autoAlpha: 0, y: 20, stagger: 0.08 },
            0.3,
          );
      });
    }

    // Desktop: a sticky particle numeral re-forms as each outcome takes the reading line.
    let field: ReturnType<typeof mountField> = null;
    let cancelled = false;
    const triggers: ScrollTrigger[] = [];
    if (conditions.desktop || conditions.reduce) {
      const stage = el.querySelector(".outcome-stage");
      document.fonts.load("500 170px Geist").finally(() => {
        if (cancelled) return;
        field = mountField(
          stage,
          () => ({
            count: 2500,
            theme: "dark",
            radius: [0.4, 0.46],
            pointer: 0.4,
            accentRatio: 0.4,
            size: 1.5,
            seed: 41,
            states: outcomes.map(([number]) => ({
              shape: shapes.text(sampleText(number ?? ""), 2.5),
              motion: motions.drift(0.012),
            })),
          }),
          conditions,
        );
        if (!field || conditions.reduce) return;
        const active = field;
        rows.forEach((row, index) => {
          triggers.push(
            ScrollTrigger.create({
              trigger: row,
              start: "top 55%",
              end: "bottom 55%",
              onToggle: (self) => {
                row.classList.toggle("is-current", self.isActive);
                if (self.isActive)
                  gsap.to(active, {
                    morph: index,
                    duration: 1.3,
                    ease: "power2.inOut",
                    overwrite: true,
                  });
              },
            }),
          );
        });
      });
    }

    return () => {
      cancelled = true;
      field?.destroy();
      triggers.forEach((trigger) => trigger.kill());
      splits.forEach((split) => split.revert());
    };
  });

  return (
    <section className="outcomes chapter" id="action" ref={ref} data-chapter="04">
      <div className="chapter-number">
        <span>04 / WHAT CHANGES</span>
        <i data-rule />
      </div>
      <h2 data-split>
        So what changes
        <br />
        for your <em>business?</em>
      </h2>
      <div className="outcomes-body">
        <div className="outcomes-visual" aria-hidden="true">
          <ParticleStage className="outcome-stage" />
        </div>
        <div className="outcome-list">
          {outcomes.map(([number, title, body]) => (
            <article key={number}>
              <b className="row-rule" aria-hidden="true" />
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{body}</p>
              <i aria-hidden="true">
                <ArrowUpRight />
              </i>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const manual = [
  "CHECK INFORMATION",
  "UPDATE SPREADSHEET",
  "BUILD REPORT",
  "SHARE IT",
  "CHECK AGAIN",
  "REPEAT",
];
const flowWords = ["COLLECTED", "PREPARED", "DELIVERED"];

/**
 * Routine, rethought: the chores ride a glowing loop like a treadmill. Scroll
 * spins it faster and faster, then it breaks open into one straight pipeline
 * through three stations that runs on its own.
 */
export function AutomationScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".automation-stage");
    const labels = labelsIn(stage);
    const cards = labels.slice(0, manual.length);
    const stationLabels = labels.slice(manual.length);
    const desktop = conditions.desktop;
    const loop = infinityState({
      width: desktop ? 1.45 : 1.25,
      cx: 0,
      cy: desktop ? 0.4 : -0.1,
      speed: 0.00024,
      tube: 0.08,
    });
    const stationX = desktop ? [-1.5, 0, 1.5] : [-1.1, 0, 1.1];
    const lineY = desktop ? -0.02 : 0.1;

    const field = mountField(
      stage,
      () => ({
        count: desktop ? 3800 : 1800,
        theme: "dark",
        glow: 0.18,
        bright: true,
        radius: desktop ? [0.2, 0.4] : [0.4, 0.4],
        pointer: 0.25,
        accentRatio: 0.4,
        seed: 17,
        states: [
          loop,
          stationsState(stationX, {
            y: lineY,
            from: desktop ? -2.4 : -1.8,
            to: desktop ? 2.4 : 1.8,
          }),
        ],
        anchors: [
          ...cards.map((card, index) => ({
            el: card,
            // Spread around both lobes, clear of the crossing (at ±90°).
            at: [onLoop(([-35, 35, 145, 215, 180, 0][index] ?? 0) * (Math.PI / 180)), null],
          })),
          ...stationLabels.map((label, index) => ({
            el: label,
            at: [null, [stationX[index] ?? 0, lineY + 0.3, 0] as Vec],
          })),
        ],
      }),
      conditions,
    );
    if (!field || conditions.reduce) return () => field?.destroy();

    field.morph = 0;
    const result = el.querySelector(".automation-result");
    const spin = { speed: 1 };
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: desktop
        ? {
            trigger: el.querySelector(".automation-pin"),
            start: "top top",
            end: "+=240%",
            pin: true,
            scrub: 1,
          }
        : { trigger: stage, start: "top 70%", end: "bottom 20%", scrub: 1 },
    });
    // 1 · the grind speeds up…
    tl.to(spin, {
      speed: 7,
      duration: 0.5,
      ease: "power2.in",
      onUpdate: () => {
        field.timeScale = spin.speed;
        el.classList.toggle("is-grinding", spin.speed > 3);
      },
    })
      // 2 · …until it breaks open into one line that runs on its own
      .to(field, { morph: 1, duration: 0.6, ease: "power2.inOut" }, 0.45)
      .to(
        spin,
        {
          speed: 1,
          duration: 0.3,
          onUpdate: () => {
            field.timeScale = spin.speed;
            el.classList.toggle("is-grinding", spin.speed > 3);
          },
        },
        0.55,
      )
      .from(result, { yPercent: 60, autoAlpha: 0, duration: 0.25 }, 0.95)
      .to({}, { duration: 0.2 });

    return () => field.destroy();
  });

  return (
    <section className="automation chapter" id="routine" ref={ref}>
      <div className="automation-pin">
        <div className="automation-copy">
          <p className="kicker" data-reveal>
            Routine, rethought
          </p>
          <h2 data-split>
            What if routine work
            <br />
            <em>simply happened?</em>
          </h2>
        </div>
        <ParticleStage
          className="automation-stage"
          label="A repetitive manual process becoming one continuous flow: collected, prepared, delivered"
        >
          {manual.map((item, index) => (
            <PLabel key={item} index={index} title={item} tag="↻" variant="card" />
          ))}
          {flowWords.map((word, index) => (
            <PLabel key={word} index={index} title={word} variant="station" />
          ))}
        </ParticleStage>
        <p className="automation-result">
          Your people should run the business, <em>not chase information.</em>
        </p>
      </div>
    </section>
  );
}

const questions = [
  "“Why did revenue change this month?”",
  "“Which branch needs attention today?”",
  "“Where are we losing time?”",
  "“What should I look at first?”",
];
/* What each step of the drill-down turns up. */
const findings = [
  ["Revenue", "Down 18% this month"],
  ["Branch", "Harbour, down 41%"],
  ["Timing", "Weekday evenings, 5–9pm"],
  ["Answer", "Three best-sellers out of stock"],
];
const pad2 = (value: number) => String(value).padStart(2, "0");

/** A caption pinned to a point in the drill-down; centred on its anchor. */
function DrillTag({ children, kind }: { children: ReactNode; kind: string }) {
  return (
    <span className={`p-label drill-tag drill-tag-${kind}`}>
      <span>{children}</span>
    </span>
  );
}

/**
 * Follow the signal: one number, drilled into until it tells its story.
 * Revenue is down → one branch collapsed → its evenings went missing → the
 * answer, framed. Each question on the left is answered by the chart it
 * turns into on the right, and the drill path records every finding.
 */
export function QuestionTrail() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector<HTMLElement>(".drill-stage");
    const card = el.querySelector<HTMLElement>(".drill-answer > div");
    if (!stage) return;
    const radius: [number, number] = conditions.desktop ? [0.265, 0.4] : [0.26, 0.4];
    // The focus frame fits the answer card, whatever size the layout gives it.
    const frame: Frame = { hw: 0.6, hh: 0.3 };
    const measure = () => {
      const R = Math.min(stage.clientWidth * radius[0], stage.clientHeight * radius[1]);
      if (!R || !card) return;
      frame.hw = card.offsetWidth / 2 / R;
      frame.hh = card.offsetHeight / 2 / R;
    };
    measure();
    const resizer = new ResizeObserver(measure);
    resizer.observe(stage);
    if (card) resizer.observe(card);

    let field: ParticleField | null = null;
    let cancelled = false;
    const steps = gsap.utils.toArray<HTMLElement>(".drill-path li", el);
    const count = el.querySelector<HTMLElement>("[data-step]");
    const rotator = el.querySelector<HTMLElement>(".question-rotator");
    const lines = gsap.utils.toArray<HTMLElement>(".question-rotator > span", el);
    const splits = conditions.reduce
      ? []
      : lines.map((line) => SplitText.create(line, { type: "words,chars" }));
    let current = -1;
    let busy: gsap.core.Tween | null = null;

    // Each question types in, replacing the last, as the drill goes one level deeper.
    const show = (index: number) => {
      const line = lines[index];
      if (!line) return;
      gsap.set(line, { autoAlpha: 1 });
      gsap.fromTo(
        splits[index]?.chars ?? [],
        { autoAlpha: 0, yPercent: 40 },
        { autoAlpha: 1, yPercent: 0, duration: 0.05, stagger: 0.02, ease: "none", overwrite: true },
      );
    };
    const setStep = (next: number) => {
      if (next === current) return;
      const previous = current;
      current = next;
      steps.forEach((step, index) => {
        step.classList.toggle("is-active", index === next);
        step.classList.toggle("is-done", index < next);
      });
      if (count) count.textContent = pad2(next + 1);
      el.classList.toggle("is-solved", next === questions.length - 1);
      if (conditions.reduce || !rotator) return;
      busy?.kill();
      lines.forEach((line, index) => {
        if (index !== previous && index !== next) gsap.set(line, { autoAlpha: 0 });
      });
      if (previous < 0) {
        show(next);
        return;
      }
      const chars = splits[previous]?.chars ?? [];
      busy = gsap.to(chars, {
        yPercent: -60,
        autoAlpha: 0,
        duration: 0.28,
        stagger: 0.006,
        ease: "power2.in",
        overwrite: true,
        onComplete: () => {
          gsap.set(chars, { yPercent: 0 });
          const line = lines[previous];
          if (line) gsap.set(line, { autoAlpha: 0 });
          if (current === next) show(next);
        },
      });
    };

    // The pin exists from the start, in page order; the particles attach when ready.
    const progress = { morph: 0 };
    if (!conditions.reduce) {
      setStep(0);
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: () => {
          if (field) field.morph = progress.morph;
          setStep(Math.min(questions.length - 1, Math.round(progress.morph)));
        },
        scrollTrigger: {
          trigger: el.querySelector(".drill-pin"),
          start: "top top",
          end: conditions.desktop ? "+=340%" : "+=300%",
          pin: true,
          scrub: 1,
        },
      });
      // Hold on each finding, then drill one level deeper.
      tl.to({}, { duration: 0.35 });
      [1, 2, 3].forEach((to) => {
        tl.to(progress, { morph: to, duration: 0.6, ease: "power1.inOut" }).to(
          {},
          { duration: 0.45 },
        );
      });
    }

    const build = () => {
      if (cancelled) return;
      const labels = labelsIn(stage);
      const at = (state: number, point: Vec): Array<Vec | null> =>
        [0, 1, 2, 3].map((k) => (k === state ? point : null));
      const anchorPoints: Array<Array<Vec | null>> = [
        at(0, numberCaptionAt),
        ...branches.map((_, k) => at(1, branchLabelAt(k))),
        at(1, flagAt),
        ...hourTicks.map(([, u]) => at(2, tickAt(u))),
        at(2, usualAt),
        at(2, dipAt),
        at(3, [0, 0, 0]),
      ];
      field = mountField(
        stage,
        ({ desktop }) => ({
          count: desktop ? 4600 : 1500,
          theme: "accent",
          bright: true,
          // A small stage packs particles tight: finer dots and less bloom keep it crisp.
          glow: conditions.reduce || !desktop ? 0.05 : 0.16,
          size: desktop ? 1.35 : 0.8,
          radius,
          pointer: 0.12,
          tilt: 0,
          accentRatio: 0,
          seed: 3,
          warnFor: isSignal,
          warnColor: "255, 176, 32",
          states: [
            numberState(sampleText("18%")),
            branchesState(),
            hoursState(),
            answerState(frame),
          ],
          anchors: labels.map((label, index) => ({
            el: label,
            at: anchorPoints[index] ?? [null, null, null, null],
          })),
        }),
        conditions,
      );
      if (!field) return;
      if (conditions.reduce) {
        // A still page shows the whole drill-down, so it asks the last question.
        setStep(questions.length - 1);
        lines.forEach((line, index) =>
          gsap.set(line, { autoAlpha: index === questions.length - 1 ? 1 : 0 }),
        );
      } else field.morph = progress.morph;
    };
    // The number is drawn in Geist; wait for it so the digits sample cleanly.
    void document.fonts.load("500 170px Geist").finally(build);

    return () => {
      cancelled = true;
      busy?.kill();
      resizer.disconnect();
      field?.destroy();
      splits.forEach((split) => split.revert());
    };
  });

  return (
    <section className="question-trail drill chapter" id="signal" ref={ref}>
      <div className="drill-pin">
        <div className="drill-copy">
          <p className="kicker">Follow the signal</p>
          <p className="drill-count" aria-hidden="true">
            Question <b data-step>01</b> / {pad2(questions.length)}
          </p>
          <h2 className="question-rotator">
            {questions.map((question) => (
              <span key={question}>{question}</span>
            ))}
          </h2>
          <ol className="drill-path">
            {findings.map(([step, finding], index) => (
              <li key={step}>
                <small>{pad2(index + 1)}</small>
                <span>{step}</span>
                <strong>{finding}</strong>
              </li>
            ))}
          </ol>
          <p className="trail-result">
            Find the story behind <em>the number.</em>
          </p>
        </div>
        <ParticleStage
          className="drill-stage"
          label="Revenue down 18%, traced to the Harbour branch on weekday evenings, where three best-sellers are out of stock"
        >
          <DrillTag kind="caption">Revenue · this month vs last</DrillTag>
          {branches.map((branch) => (
            <DrillTag key={branch} kind="axis">
              {branch}
            </DrillTag>
          ))}
          <DrillTag kind="flag">−41%</DrillTag>
          {hourTicks.map(([hour]) => (
            <DrillTag key={hour} kind="axis">
              {hour}
            </DrillTag>
          ))}
          <DrillTag kind="legend">Usual day</DrillTag>
          <DrillTag kind="flag">5–9pm · −60%</DrillTag>
          <div className="p-label drill-answer">
            <div>
              <small>Look here first</small>
              <strong>Harbour branch, weekday evenings</strong>
              <p>Three best-sellers run out of stock after 5pm, just as the evening rush starts.</p>
              <span>
                <i>Stock</i>
                <i>Evenings</i>
                <i>Harbour</i>
              </span>
            </div>
          </div>
        </ParticleStage>
      </div>
    </section>
  );
}
