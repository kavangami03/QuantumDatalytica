import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, ScrollTrigger, SplitText, useScene } from "@/animations/gsap";
import {
  loopState,
  motions,
  onLoop,
  shapes,
  spokesState,
  type StateDef,
  type Vec,
} from "./particles";
import {
  circulatingTorus,
  gatheringHub,
  hourglass,
  orbitingSegments,
  packetLanes,
  risingBars,
} from "./metaphors";
import { labelsIn, mountField, ParticleStage, PLabel } from "./ParticleStage";
import { StoryButton } from "./StoryButton";
import { BrandMark } from "./BrandMark";

type Scenario =
  "behavior" | "performance" | "automation" | "connection" | "bottleneck" | "workflow";

const scenarios: ReadonlyArray<readonly [string, Scenario]> = [
  ["Understand customer behavior.", "behavior"],
  ["Monitor business performance.", "performance"],
  ["Automate recurring processes.", "automation"],
  ["Bring information together.", "connection"],
  ["Identify operational bottlenecks.", "bottleneck"],
  ["Create consistent workflows.", "workflow"],
];

/* One small, living sculpture per scenario, each acting out its sentence. */
const metaphors: Record<Scenario, () => StateDef> = {
  behavior: orbitingSegments,
  performance: risingBars,
  automation: circulatingTorus,
  connection: gatheringHub,
  bottleneck: hourglass,
  workflow: packetLanes,
};

const impacts = [
  "Less manual work.",
  "More visibility.",
  "Faster response.",
  "Smarter processes.",
  "Better decisions.",
];

export function BusinessImpact() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, ({ reduce }, el) => {
    if (reduce) return;
    // Each statement fills with ink as it crosses the reading line.
    gsap.utils.toArray<HTMLElement>(".impact-words strong", el).forEach((word) => {
      gsap.fromTo(
        word,
        { backgroundSize: "0% 100%, 100% 100%" },
        {
          backgroundSize: "100% 100%, 100% 100%",
          ease: "none",
          scrollTrigger: { trigger: word, start: "top 80%", end: "bottom 50%", scrub: true },
        },
      );
    });
  });

  return (
    <section className="impact chapter" id="impact" ref={ref} data-chapter="06">
      <div className="chapter-number">
        <span>06 / IMPACT</span>
        <i data-rule />
      </div>
      <h2 data-split>
        Less time moving information.
        <br />
        <em>More time using it.</em>
      </h2>
      <div className="impact-words">
        {impacts.map((item, index) => (
          <p key={item}>
            <span>0{index + 1}</span>
            <strong>{item}</strong>
          </p>
        ))}
      </div>
    </section>
  );
}

export function UseCases() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".scenario-grid article", el);
    const fields = cards.map((card, index) => {
      const type = card.dataset["type"] as Scenario | undefined;
      const make = type ? metaphors[type] : undefined;
      if (!make) return null;
      return mountField(
        card.querySelector(".scenario-particles"),
        ({ desktop }) => ({
          count: desktop ? 1100 : 700,
          theme: "dark",
          glow: 0.14,
          accentRatio: 0.42,
          radius: [0.3, 0.4],
          size: 1.15,
          pointer: 0.9,
          pointerEl: card,
          tilt: 0.1,
          seed: 60 + index,
          states: [
            { shape: shapes.nebula(1.2, 0.8, 0.7), motion: motions.swirl(0.0004, 0.02) },
            make(),
          ],
        }),
        conditions,
      );
    });
    if (conditions.reduce) return () => fields.forEach((field) => field?.destroy());

    gsap.from(cards, {
      clipPath: "inset(100% 0% 0% 0%)",
      duration: 1.3,
      ease: "story",
      stagger: 0.1,
      scrollTrigger: { trigger: el.querySelector(".scenario-grid"), start: "top 80%", once: true },
    });
    const cleanups: Array<() => void> = [];
    fields.forEach((field, index) => {
      const card = cards[index];
      if (!field || !card) return;
      field.morph = 0;
      ScrollTrigger.create({
        trigger: card,
        start: "top 75%",
        once: true,
        onEnter: () =>
          void gsap.to(field, {
            morph: 1,
            duration: 2.2,
            delay: (index % 3) * 0.15,
            ease: "power2.inOut",
          }),
      });
      // Hover brings each sculpture to life a little faster.
      const enter = () => gsap.to(field, { timeScale: 2.4, duration: 0.8, ease: "power2.out" });
      const leave = () => gsap.to(field, { timeScale: 1, duration: 1.2, ease: "power2.out" });
      card.addEventListener("pointerenter", enter);
      card.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        card.removeEventListener("pointerenter", enter);
        card.removeEventListener("pointerleave", leave);
      });
    });
    return () => {
      cleanups.forEach((cleanup) => cleanup());
      fields.forEach((field) => field?.destroy());
    };
  });

  return (
    <section className="use-cases chapter" ref={ref}>
      <div className="split-heading">
        <h2 data-split>
          Built around the way
          <br />
          <em>business moves.</em>
        </h2>
        <p data-reveal>Not more information. More usefulness.</p>
      </div>
      <div className="scenario-grid">
        {scenarios.map(([label, type], index) => (
          <article key={label} data-type={type}>
            <span className="scenario-index">0{index + 1}</span>
            <ParticleStage className="scenario-particles" />
            <h3>{label}</h3>
            <i className="scenario-corner" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  );
}

const ecosystemNodes: Array<[string, Vec]> = [
  ["CUSTOMERS", [-1.45, -0.72, 0.3]],
  ["OPERATIONS", [1.4, -0.78, -0.25]],
  ["REVENUE", [2.0, 0.05, 0.2]],
  ["MARKETING", [1.3, 0.8, -0.3]],
  ["FINANCE", [-1.25, 0.82, 0.25]],
  ["INVENTORY", [-2.0, 0.02, -0.2]],
  ["PEOPLE", [0.05, -1.0, -0.4]],
  ["PERFORMANCE", [-0.05, 1.02, 0.4]],
];

export function Ecosystem() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".ecosystem-stage");
    const labels = labelsIn(stage);
    const nodeLabels = labels.slice(0, ecosystemNodes.length);
    const centerLabel = labels[ecosystemNodes.length];
    const nodes = ecosystemNodes.map(([, position]) => position);
    const orbit = loopState({ radius: 1.55, speed: 0.00012, tilt: 1.18 });

    const field = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 3200 : 1400,
        theme: "dark",
        radius: [0.2, 0.36],
        pointer: 0.35,
        tilt: 0.05,
        seed: 71,
        states: [
          // one compact core…
          { shape: shapes.sphere(0.24), motion: motions.spin(0.0005) },
          // …expands into every part of the business…
          spokesState(nodes, { speed: 0.0001 }),
          // …and settles into one orbit around it.
          orbit,
        ],
        anchors: [
          ...nodeLabels.map((label, index) => ({
            el: label,
            at: [null, nodes[index] ?? null, onLoop((index / ecosystemNodes.length) * Math.PI * 2)],
          })),
          ...(centerLabel
            ? [{ el: centerLabel, at: [[0, 0.5, 0] as Vec, [0, 0.66, 0] as Vec, [0, 0, 0] as Vec] }]
            : []),
        ],
      }),
      conditions,
    );
    if (!field || conditions.reduce) return () => field?.destroy();

    field.morph = 0;
    if (!conditions.desktop) {
      gsap.to(field, {
        morph: 2,
        ease: "none",
        scrollTrigger: { trigger: stage, start: "top 80%", end: "bottom 30%", scrub: 1 },
      });
      return () => field.destroy();
    }

    gsap
      .timeline({
        defaults: { ease: "power1.inOut" },
        scrollTrigger: {
          trigger: el.querySelector(".ecosystem-pin"),
          start: "top top",
          end: "+=220%",
          pin: true,
          scrub: 1,
        },
      })
      .to(field, { morph: 1, duration: 1 })
      .to({}, { duration: 0.3 })
      .to(field, { morph: 2, duration: 1 })
      .to(".ecosystem-heading", { autoAlpha: 0, y: -30, duration: 0.5 }, 0.15)
      .to({}, { duration: 0.3 });
    return () => field.destroy();
  });

  return (
    <section className="ecosystem chapter" ref={ref} data-chapter="07">
      <div className="ecosystem-pin">
        <div className="chapter-number">
          <span>07 / ONE VIEW</span>
          <i data-rule />
        </div>
        <div className="ecosystem-heading">
          <p className="kicker">Everything in context</p>
          <h2 data-split>
            One business.
            <br />
            <em>One connected story.</em>
          </h2>
        </div>
        <ParticleStage
          className="ecosystem-stage"
          label={`YOUR BUSINESS connected to ${ecosystemNodes.map(([label]) => label).join(", ")}`}
        >
          {ecosystemNodes.map(([label], index) => (
            <PLabel key={label} index={index} title={label} />
          ))}
          <PLabel title="YOUR BUSINESS" variant="center" />
        </ParticleStage>
      </div>
    </section>
  );
}

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null);

  useScene(ref, (conditions, el) => {
    const section = el.querySelector(".final-cta");
    const field = mountField(
      el.querySelector(".final-particles"),
      ({ desktop }) => ({
        count: desktop ? 2400 : 1100,
        theme: "dark",
        glow: 0.12,
        radius: [0.3, 0.4],
        pointer: 0.3,
        accentRatio: 0.3,
        seed: 97,
        states: [
          { shape: shapes.cloud(2.4, 1.3, 1), motion: motions.drift(0.08) },
          loopState({ radius: 1.35, speed: 0.00009, tilt: 1.22 }),
        ],
      }),
      conditions,
    );
    if (conditions.reduce) return () => field?.destroy();
    if (field) {
      field.morph = 0;
      gsap.to(field, {
        morph: 1,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top 85%", end: "center 55%", scrub: 1 },
      });
    }

    const mark = el.querySelector(".closing-mark");
    gsap
      .timeline({ scrollTrigger: { trigger: mark, start: "top 80%", once: true } })
      .from(".closing-mark i", { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "story" })
      .from(
        ".closing-mark span",
        { scale: 0, stagger: 0.12, duration: 0.6, ease: "back.out(3)" },
        0.4,
      )
      .to(
        ".closing-mark span:nth-child(2)",
        { left: "70%", duration: 1.6, ease: "story", repeat: -1, yoyo: true, repeatDelay: 0.6 },
        1.2,
      );

    const wordmark = el.querySelector<HTMLElement>(".footer-wordmark");
    const split = wordmark ? SplitText.create(wordmark, { type: "chars" }) : null;
    if (split && wordmark) {
      gsap.from(split.chars, {
        yPercent: 105,
        stagger: 0.03,
        duration: 1.4,
        scrollTrigger: { trigger: wordmark, start: "top 95%", once: true },
      });
    }
    return () => {
      field?.destroy();
      split?.revert();
    };
  });

  return (
    <div ref={ref}>
      <section className="final-cta chapter" id="contact" data-chapter="08">
        <ParticleStage className="final-particles" />
        <div className="chapter-number">
          <span>08 / CONTACT</span>
          <i data-rule />
        </div>
        <div className="closing-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <i />
        </div>
        <h2 data-split>
          Your data already
          <br />
          tells a <em>story.</em>
        </h2>
        <p data-reveal>
          We help you understand it, connect it,
          <br />
          and turn it into action.
        </p>
        <div className="hero-actions" data-reveal>
          <StoryButton href="mailto:hello@quantumdatalytica.com" icon={<ArrowUpRight />}>
            Talk to us
          </StoryButton>
          <StoryButton href="#industries" variant="storyOutline">
            Explore what we can do
          </StoryButton>
        </div>
      </section>
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <a className="brand" href="#top">
              <BrandMark />
              <span className="brand-name">QuantumDataLytica</span>
            </a>
            <p>
              Turning business information
              <br />
              into meaningful action.
            </p>
          </div>
          <div>
            <strong>Navigate</strong>
            <a href="#problem">What we solve</a>
            <a href="#transformation">How it works</a>
            <a href="#impact">Business impact</a>
          </div>
          <div>
            <strong>Industries</strong>
            <a href="#industries">Hospitality</a>
            <a href="#industries">Healthcare</a>
            <a href="#industries">Retail & more</a>
          </div>
          <div>
            <strong>Contact</strong>
            <a href="mailto:hello@quantumdatalytica.com">
              Email <ArrowUpRight />
            </a>
            <span>LinkedIn</span>
            <span>Privacy</span>
          </div>
        </div>
        <p className="footer-wordmark" aria-hidden="true">
          QuantumDataLytica
        </p>
        <small>© {new Date().getFullYear()} QuantumDataLytica</small>
      </footer>
    </div>
  );
}
