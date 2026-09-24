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

const outcomes = [
  ["01", "SEE CLEARLY", "Understand what is happening across your business."],
  ["02", "MOVE FASTER", "Get important information where it is needed."],
  [
    "03",
    "AUTOMATE ROUTINE WORK",
    "Let repetitive processes happen without constant manual effort.",
  ],
  ["04", "FIND OPPORTUNITIES", "Spot patterns and changes that deserve attention."],
  ["05", "MAKE BETTER DECISIONS", "Turn information into action with greater confidence."],
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
            count: 3200,
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
    <section className="outcomes chapter" ref={ref} data-chapter="04">
      <div className="chapter-number">
        <span>04 / ACTION</span>
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
  "CREATE REPORT",
  "SEND INFORMATION",
  "CHECK AGAIN",
  "REPEAT",
];
const flowWords = ["INFORMATION", "PROCESS", "RESULT"];

export function AutomationScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".automation-stage");
    const labels = labelsIn(stage);
    const loopLabels = labels.slice(0, manual.length);
    const flowLabels = labels.slice(manual.length);
    const desktop = conditions.desktop;
    // Desktop: the loop turns on the right; the line spans the frame lower down.
    const loop = loopState({
      radius: desktop ? 0.7 : 0.72,
      speed: 0.00026,
      tilt: 1.12,
      cx: desktop ? 0.95 : -0.3,
      cy: desktop ? -0.05 : 0,
      tube: 0.09,
    });
    const flowY = desktop ? 0.66 : 0;
    const flowX = desktop ? 2.3 : 1.7;

    const field = mountField(
      stage,
      () => ({
        count: desktop ? 4200 : 1800,
        theme: "dark",
        glow: 0.16,
        radius: desktop ? [0.2, 0.4] : [0.4, 0.4],
        pointer: 0.2,
        accentRatio: 0.35,
        seed: 17,
        states: [
          loop,
          { ...flowState({ from: -flowX, to: flowX, y: flowY, speed: 0.00009 }), trail: 0 },
        ],
        anchors: [
          ...loopLabels.map((label, index) => ({
            el: label,
            at: [onLoop((index / manual.length) * Math.PI * 2 - Math.PI / 2), null],
          })),
          ...flowLabels.map((label, index) => ({
            el: label,
            at: [
              null,
              [(index - 1) * flowX * (desktop ? 0.72 : 0.44), flowY, 0] as [number, number, number],
            ],
          })),
        ],
      }),
      conditions,
    );
    if (!field || conditions.reduce) return () => field?.destroy();

    field.morph = 0;
    const result = el.querySelector(".automation-result");
    if (!desktop) {
      gsap.to(field, {
        morph: 1,
        ease: "none",
        scrollTrigger: { trigger: stage, start: "top 40%", end: "bottom 20%", scrub: 1 },
      });
      return () => field.destroy();
    }

    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el.querySelector(".automation-pin"),
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 1,
        },
      })
      .to({}, { duration: 0.35 })
      .to(field, { morph: 1, duration: 0.8, ease: "power1.inOut" })
      .from(result, { yPercent: 60, autoAlpha: 0, duration: 0.3 }, ">-0.2")
      .to({}, { duration: 0.3 });

    return () => field.destroy();
  });

  return (
    <section className="automation chapter" ref={ref}>
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
          label="A repetitive manual process becoming one continuous flow"
        >
          {manual.map((item, index) => (
            <PLabel key={item} index={index} title={item} />
          ))}
          {flowWords.map((word) => (
            <PLabel key={word} title={word} variant="center" />
          ))}
        </ParticleStage>
        <p className="automation-result">A process that keeps moving.</p>
      </div>
    </section>
  );
}

const trail = ["Revenue", "Sales", "Customers", "Products", "Regions", "Patterns", "Understanding"];

export function QuestionTrail() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const list = el.querySelector<HTMLElement>(".trail");
    const field = mountField(
      el.querySelector(".trail-stage"),
      ({ desktop }) => ({
        count: desktop ? 1800 : 900,
        theme: "accent",
        radius: [0.5, 0.17],
        accentRatio: 0,
        size: 1.5,
        seed: 3,
        states: [funnelState({ top: -2.9, bottom: 2.75, width: 1.25, speed: 0.00005 })],
      }),
      conditions,
    );

    if (conditions.reduce) {
      el.querySelectorAll(".trail-item").forEach((item) => item.classList.add("is-active"));
      return () => field?.destroy();
    }
    const question = el.querySelector<HTMLElement>(".question-copy h2");
    if (!question || !list) return () => field?.destroy();

    // The question types itself out.
    const split = SplitText.create(question, { type: "words,chars" });
    gsap.from(split.chars, {
      autoAlpha: 0,
      duration: 0.05,
      stagger: 0.035,
      ease: "none",
      scrollTrigger: { trigger: question, start: "top 75%", once: true },
    });

    gsap.fromTo(
      ".trail-progress i",
      { scaleY: 0 },
      {
        scaleY: 1,
        ease: "none",
        scrollTrigger: { trigger: list, start: "top 60%", end: "bottom 60%", scrub: true },
      },
    );

    gsap.utils.toArray<HTMLElement>(".trail-item", el).forEach((item) => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 60%",
        onEnter: () => item.classList.add("is-active"),
        onLeaveBack: () => item.classList.remove("is-active"),
      });
    });

    return () => {
      field?.destroy();
      split.revert();
    };
  });

  return (
    <section className="question-trail chapter" ref={ref}>
      <div className="question-copy">
        <p className="kicker">Follow the signal</p>
        <h2>
          “Why did revenue
          <br />
          change this month?”
        </h2>
      </div>
      <div className="trail" aria-label="The information trail from revenue to understanding">
        <ParticleStage className="trail-stage" />
        <span className="trail-progress" aria-hidden="true">
          <i />
        </span>
        {trail.map((item, index) => (
          <div key={item} className="trail-item">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{item}</strong>
            {index < trail.length - 1 && <i aria-hidden="true">↓</i>}
          </div>
        ))}
      </div>
      <p className="trail-result" data-reveal>
        Find the story behind the numbers.
      </p>
    </section>
  );
}
