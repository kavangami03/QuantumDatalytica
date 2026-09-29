import { useRef, type CSSProperties, type ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, ScrollTrigger, SplitText, useScene } from "@/animations/gsap";
import {
  looseState,
  imageShape,
  rainState,
  loopState,
  motions,
  onLoop,
  ParticleField,
  sampleImage,
  shapes,
  spokesState,
  type StateDef,
  type Vec,
} from "./particles";
import {
  branchRadar,
  customerOrbits,
  gatheringHub,
  hourglass,
  packetLanes,
  selfBuildingReport,
} from "./metaphors";
import { labelsIn, mountField, ParticleStage, PLabel } from "./ParticleStage";
import { StoryButton } from "./StoryButton";
import { type IconKind, scatteredIconsState, webState } from "./connection-shapes";
import { DEMO_URL } from "./Navigation";

type Scenario =
  "behavior" | "performance" | "automation" | "connection" | "bottleneck" | "workflow";

const scenarios: ReadonlyArray<readonly [string, Scenario]> = [
  ["Understand customers", "behavior"],
  ["Watch every branch", "performance"],
  ["Reports that build themselves", "automation"],
  ["Bring information together", "connection"],
  ["Find what slows you down", "bottleneck"],
  ["Keep teams aligned", "workflow"],
];

/* One small, living sculpture per scenario, each acting out its sentence. */
const metaphors: Record<Scenario, () => StateDef> = {
  behavior: customerOrbits,
  performance: branchRadar,
  automation: selfBuildingReport,
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
          count: desktop ? 750 : 500,
          theme: "dark",
          glow: 0.2,
          bright: true,
          accentRatio: 0.42,
          radius: [0.3, 0.4],
          size: 1.15,
          pointer: 0.9,
          pointerEl: card,
          tilt: 0.1,
          seed: 60 + index,
          states: [looseState(), make()],
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
    <section className="use-cases chapter" id="uses" ref={ref}>
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

const ecosystemKinds: IconKind[] = [
  "person",
  "boxes",
  "chart",
  "chat",
  "grid",
  "stack",
  "note",
  "page",
];
/* Before: the eight areas scattered and unconnected. */
const ecosystemApart: Vec[] = [
  [-2.3, -0.55, 0],
  [-0.9, -0.85, 0],
  [0.8, -0.8, 0],
  [2.3, -0.5, 0],
  [2.1, 0.6, 0],
  [0.7, 0.85, 0],
  [-0.9, 0.8, 0],
  [-2.2, 0.55, 0],
];
const ringAngle = (k: number) => (k / ecosystemNodes.length) * Math.PI * 2 - Math.PI / 2;

export function Ecosystem() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".ecosystem-stage");
    const labels = labelsIn(stage);
    const nodeLabels = labels.slice(0, ecosystemNodes.length);
    const centerLabel = labels[ecosystemNodes.length];
    let field: ParticleField | null = null;
    let cancelled = false;
    const progress = { morph: conditions.reduce ? 1 : 0 };

    sampleImage("/brand/symbol-on-dark.svg")
      .catch(() => undefined)
      .then((logo) => {
        if (cancelled) return;
        const web = webState(ecosystemKinds, logo ?? undefined, {
          rx: conditions.desktop ? 1.95 : 1.15,
          ry: conditions.desktop ? 0.75 : 0.95,
        });
        field = mountField(
          stage,
          ({ desktop }) => ({
            count: desktop ? 4000 : 2000,
            theme: "dark",
            glow: 0.18,
            bright: true,
            radius: desktop ? [0.2, 0.36] : [0.4, 0.36],
            pointer: 0.3,
            tilt: 0.05,
            seed: 71,
            accentFor: web.accentFor,
            states: [scatteredIconsState(ecosystemKinds, ecosystemApart), web],
            anchors: [
              ...nodeLabels.map((label, index) => ({
                el: label,
                at: [
                  ecosystemApart[index]
                    ? ([ecosystemApart[index][0], ecosystemApart[index][1] + 0.34, 0] as Vec)
                    : null,
                  [ringAngle(index), 0, 0] as Vec,
                ],
              })),
              ...(centerLabel ? [{ el: centerLabel, at: [null, null] }] : []),
            ],
          }),
          conditions,
        );
        if (field && !conditions.reduce) field.morph = progress.morph;
      });
    if (conditions.reduce) {
      return () => {
        cancelled = true;
        field?.destroy();
      };
    }

    // Scroll joins the scattered areas into one living system.
    gsap
      .timeline({
        defaults: { ease: "power1.inOut" },
        scrollTrigger: conditions.desktop
          ? {
              trigger: el.querySelector(".ecosystem-pin"),
              start: "top top",
              end: "+=180%",
              pin: true,
              scrub: 1,
            }
          : { trigger: stage, start: "top 80%", end: "bottom 40%", scrub: 1 },
      })
      .to(progress, {
        morph: 1,
        duration: 1,
        onUpdate: () => {
          if (field) field.morph = progress.morph;
        },
      })
      .from(
        el.querySelectorAll(".outcome-chips li"),
        { x: 40, autoAlpha: 0, stagger: 0.1, duration: 0.3 },
        0.75,
      )
      .to({}, { duration: 0.3 });
    return () => {
      cancelled = true;
      field?.destroy();
    };
  });

  return (
    <section className="ecosystem chapter" id="one-view" ref={ref} data-chapter="07">
      <div className="ecosystem-pin">
        <div className="chapter-number">
          <span>07 / ONE VIEW</span>
          <i data-rule />
        </div>
        <div className="ecosystem-heading">
          <h2 data-split>
            One business.
            <br />
            <em>One connected story.</em>
          </h2>
          <p className="section-lead" data-reveal>
            Every branch connected. Every team aligned.
          </p>
        </div>
        <ul className="outcome-chips" aria-label="What changes">
          {["Business improves", "Less stress", "Clearer decisions"].map((chip) => (
            <li key={chip}>
              <i aria-hidden="true" />
              {chip}
            </li>
          ))}
        </ul>
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

/** The closing invitation, then (in order) anything passed in, then the footer. */
export function FinalCTA({ children }: { children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useScene(ref, (conditions, el) => {
    // Data pours down the screen, then is caught drop by drop into the logo, top first.
    const section = el.querySelector<HTMLElement>(".final-cta");
    const stage = el.querySelector(".final-particles");
    const canvas = stage?.querySelector<HTMLCanvasElement>(".p-canvas");
    const copy = el.querySelectorAll<HTMLElement>(".final-copy > *");
    const heading = el.querySelector<HTMLElement>(".final-copy h2");
    let field: ParticleField | null = null;
    let cancelled = false;
    const headingSplit =
      heading && !conditions.reduce
        ? SplitText.create(heading, { type: "lines", mask: "lines", linesClass: "split-line" })
        : null;

    // The pin is created now, in page order; the particles attach whenever the logo is sampled.
    const progress = { morph: 0 };
    if (!conditions.reduce) {
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: conditions.desktop
            ? { trigger: section, start: "top top", end: "+=170%", pin: true, scrub: 1 }
            : { trigger: section, start: "top 70%", end: "bottom 80%", scrub: 1 },
        })
        .to(
          progress,
          {
            morph: 1,
            duration: 1,
            onUpdate: () => {
              if (field) field.morph = progress.morph;
            },
          },
          0.1,
        )
        .from(
          headingSplit?.lines ?? heading ?? [],
          { yPercent: 110, stagger: 0.06, duration: 0.25, ease: "power3.out" },
          0.95,
        )
        .from(
          Array.from(copy).slice(1),
          { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.25 },
          1.1,
        )
        .to({}, { duration: 0.25 });
    }

    if (canvas) {
      sampleImage("/brand/symbol-on-dark.svg")
        .then((sample) => {
          if (cancelled) return;
          // Where each particle lands, top (0) to bottom (1) of the logo.
          const landY = (i: number) => sample.points[i % sample.points.length]?.[1] ?? 0.5;
          field = new ParticleField(canvas, {
            count: conditions.desktop ? 3800 : 1800,
            theme: "dark",
            glow: 0.2,
            bright: true,
            size: 1.3,
            radius: [0.4, 0.44],
            pointer: 0.15,
            accentFor: (i) => sample.accent[i % sample.accent.length] ?? false,
            seed: 97,
            localMorph: (i, morph) => {
              const k = morph * 1.7 - landY(i) * 0.55 - (((i * 37) % 100) / 100) * 0.15;
              const c = k < 0 ? 0 : k > 1 ? 1 : k;
              return c * c * (3 - 2 * c);
            },
            states: [
              rainState({ width: 2.8, top: -1.35, bottom: 1.35 }),
              {
                shape: (i, n, r) => {
                  const p = imageShape(sample, 1.35)(i, n, r);
                  return [p[0], p[1] - 0.58, p[2]];
                },
                motion: motions.drift(0.004),
              },
            ],
          });
          if (conditions.reduce) {
            field.still(1);
            return;
          }
          field.morph = progress.morph;
          field.start();
        })
        .catch(() => undefined);
    }
    if (conditions.reduce) {
      return () => {
        cancelled = true;
        field?.destroy();
      };
    }

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
      cancelled = true;
      field?.destroy();
      split?.revert();
      headingSplit?.revert();
    };
  });

  return (
    <div ref={ref}>
      <section className="final-cta chapter" id="contact" data-chapter="08">
        <div className="chapter-number">
          <span>08 / LET’S TALK</span>
          <i data-rule />
        </div>
        <ParticleStage
          className="final-particles"
          label="Everything connected into QuantumDataLytica"
        />
        <div className="final-copy">
          <h2>
            Your data already
            <br />
            tells a <em>story.</em>
          </h2>
          <p>Let’s find out what yours is saying.</p>
          <div className="hero-actions">
            <StoryButton href={DEMO_URL} icon={<ArrowUpRight />} track="demo">
              Book a demo
            </StoryButton>
            <StoryButton href="#industries" variant="storyOutline">
              Explore industries
            </StoryButton>
          </div>
        </div>
      </section>
      {children}
      <footer className="footer">
        <div className="footer-grid" style={{ "--cols": 3 } as CSSProperties}>
          <div className="footer-brand">
            <a className="brand" href="#top">
              <img
                className="brand-logo brand-logo-footer"
                src="/brand/logo-on-dark.svg"
                alt="QuantumDataLytica"
                width={327}
                height={35}
              />
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
            <a href="#industries">Industries</a>
            <a href="#impact">Business impact</a>
            <a href="#faq">FAQ</a>
          </div>
          <div>
            <strong>Contact</strong>
            <a href={DEMO_URL} data-track="demo">
              Book a demo <ArrowUpRight />
            </a>
            <a href="mailto:info@quantumdatalytica.com">info@quantumdatalytica.com</a>
            <a href="tel:+15127333085">+1 (512) 733-3085</a>
            <span>LinkedIn</span>
          </div>
          <div>
            <strong>Legal</strong>
            <a href="/privacy-policy/">Privacy Policy</a>
            <a href="/terms-and-conditions/">Terms &amp; Conditions</a>
          </div>
        </div>
        <p className="footer-wordmark" aria-hidden="true">
          QuantumDataLytica
        </p>
        <small>© 2026 QuantumDataLytica</small>
      </footer>
    </div>
  );
}
