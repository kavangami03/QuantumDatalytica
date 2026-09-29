import { useRef } from "react";
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
import { infinityState, stationsState, traceState } from "./connection-shapes";
import type { Vec } from "./particles";

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

const trail = ["Revenue", "Branches", "Customers", "Products", "Timing", "Patterns", "The answer"];
const questions = [
  "“Why did revenue change this month?”",
  "“Which branch needs attention today?”",
  "“Where are we losing time?”",
  "“What should I look at first?”",
];
/* The clue path: a zigzag from the top of the frame down to the answer. */
const tracePoints: Vec[] = [
  [-1.6, -1.05, 0],
  [0.2, -0.75, 0],
  [-1.1, -0.42, 0],
  [0.75, -0.1, 0],
  [-0.7, 0.22, 0],
  [1.25, 0.52, 0],
  [0.1, 0.92, 0],
];

/**
 * Follow the signal: a live trace draws down through every clue, lighting
 * each one as it arrives, and ends in a burst at the answer.
 */
export function QuestionTrail() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".signal-stage");
    const nodes = labelsIn(stage);
    const { state, along } = traceState(tracePoints);
    const progress = { value: conditions.reduce ? 1 : 0 };
    const field = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 4000 : 2000,
        theme: "accent",
        accentRatio: 0,
        bright: true,
        glow: 0.2,
        size: 1.7,
        radius: desktop ? [0.24, 0.42] : [0.42, 0.42],
        pointer: 0.2,
        seed: 3,
        states: [{ shape: () => [tracePoints[0]?.[0] ?? 0, tracePoints[0]?.[1] ?? 0, 0] }, state],
        // The trace only reaches as far as the scroll has taken it.
        localMorph: (i) => {
          const k = (progress.value * 1.04 - along(i)) * 14;
          return k < 0 ? 0 : k > 1 ? 1 : k;
        },
        anchors: nodes.map((node, index) => ({
          el: node,
          at: [tracePoints[index] ?? null, tracePoints[index] ?? null],
        })),
      }),
      conditions,
    );
    // Just under 1: stay between the two states so localMorph decides per particle.
    if (field) field.morph = 0.999;

    const light = () => {
      nodes.forEach((node, index) => {
        const at = index / (tracePoints.length - 1);
        node.classList.toggle("is-lit", progress.value >= at - 0.01);
      });
      el.classList.toggle("is-solved", progress.value > 0.97);
    };
    light();

    const rotator = el.querySelector<HTMLElement>(".question-rotator");
    const lines = gsap.utils.toArray<HTMLElement>(".question-rotator > span", el);
    if (conditions.reduce || !rotator || !lines.length) return () => field?.destroy();

    // Each question types in, and is replaced by the next as the signal travels.
    const splits = lines.map((line) => SplitText.create(line, { type: "words,chars" }));
    let current = -1;
    let busy: gsap.core.Tween | null = null;
    gsap.set(lines, { autoAlpha: 0 });
    const show = (index: number) => {
      const line = lines[index];
      if (!line) return;
      gsap.set(line, { autoAlpha: 1 });
      gsap.fromTo(
        splits[index]?.chars ?? [],
        { autoAlpha: 0, yPercent: 40 },
        {
          autoAlpha: 1,
          yPercent: 0,
          duration: 0.05,
          stagger: 0.022,
          ease: "none",
          overwrite: true,
        },
      );
    };
    const hide = (index: number) => {
      const line = lines[index];
      const chars = splits[index]?.chars ?? [];
      return gsap.to(chars, {
        yPercent: -60,
        autoAlpha: 0,
        duration: 0.3,
        stagger: 0.006,
        ease: "power2.in",
        overwrite: true,
        onComplete: () => {
          gsap.set(chars, { yPercent: 0 });
          if (line) gsap.set(line, { autoAlpha: 0 });
        },
      });
    };
    const sync = () => {
      const next = Math.min(lines.length - 1, Math.floor(progress.value * lines.length * 0.999));
      if (next === current) return;
      const previous = current;
      current = next;
      busy?.kill();
      lines.forEach((line, index) => {
        if (index !== previous && index !== next) gsap.set(line, { autoAlpha: 0 });
      });
      if (previous < 0) show(next);
      else {
        busy = hide(previous);
        busy.eventCallback("onComplete", () => {
          gsap.set(splits[previous]?.chars ?? [], { yPercent: 0 });
          const line = lines[previous];
          if (line) gsap.set(line, { autoAlpha: 0 });
          if (current === next) show(next);
        });
      }
    };

    // The signal draws down the path as you scroll, and the question changes with it.
    gsap.to(progress, {
      value: 1,
      ease: "none",
      onUpdate: () => {
        light();
        sync();
      },
      scrollTrigger: conditions.desktop
        ? {
            trigger: el.querySelector(".signal-pin"),
            start: "top top",
            end: "+=260%",
            pin: true,
            scrub: 1,
          }
        : { trigger: stage, start: "top 70%", end: "bottom 40%", scrub: 1 },
    });
    ScrollTrigger.create({ trigger: rotator, start: "top 80%", once: true, onEnter: sync });

    return () => {
      busy?.kill();
      field?.destroy();
      splits.forEach((split) => split.revert());
    };
  });

  return (
    <section className="question-trail signal chapter" id="signal" ref={ref}>
      <div className="signal-pin">
        <div className="question-copy">
          <p className="kicker">Follow the signal</p>
          <h2 className="question-rotator">
            {questions.map((question) => (
              <span key={question}>{question}</span>
            ))}
          </h2>
          <p className="trail-result">
            Find the story behind <em>the number.</em>
          </p>
        </div>
        <ParticleStage
          className="signal-stage"
          label="The information trail from revenue to the answer"
        >
          {trail.map((item, index) => (
            <PLabel
              key={item}
              index={index}
              title={item}
              variant={index === trail.length - 1 ? "large" : "default"}
            />
          ))}
        </ParticleStage>
      </div>
    </section>
  );
}
