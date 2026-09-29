import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { gsap, ScrollTrigger, useScene } from "@/animations/gsap";
import { industries } from "./data";
import {
  clamp01,
  looseState,
  motions,
  ParticleField,
  shapes,
  type AnchorDef,
  type Vec,
} from "./particles";
import { type IndustryForm, industryState, messToRows } from "./connection-shapes";
import { labelsIn, mountField, ParticleStage, PLabel } from "./ParticleStage";

type Industry = keyof typeof industries;
const names = Object.keys(industries) as Industry[];
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");
const ROTATE_MS = 6000;

/* Each industry gets its own living formation. */
const forms: Record<Industry, IndustryForm> = {
  Hospitality: "orbit",
  Healthcare: "pulse",
  Retail: "bars",
  "Financial Services": "trend",
  Manufacturing: "gears",
};

function industryTarget(name: Industry, stage: Element | null) {
  const count = industries[name].nodes.length;
  const { state, nodes } = industryState(forms[name]);
  const labels = labelsIn(stage);
  const anchors: AnchorDef[] = labels.map((el, index) => ({
    el,
    at: [null, index < count ? (nodes[index] ?? null) : ([0, 1.12, 0] as Vec)],
  }));
  return { state, anchors };
}

export function IndustryExplorer() {
  const [active, setActive] = useState<Industry>("Hospitality");
  const content = industries[active];
  const ref = useRef<HTMLElement>(null);
  const tabs = useRef<HTMLDivElement>(null);
  const field = useRef<ParticleField | null>(null);
  const first = useRef(true);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".industry-particles");
    const { state, anchors } = industryTarget("Hospitality", stage);
    const instance = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 3600 : 1600,
        theme: "dark",
        glow: 0.18,
        bright: true,
        radius: [0.28, 0.42],
        pointer: 0.35,
        tilt: 0.06,
        seed: 29,
        states: [looseState(2.2, 1.4), state],
        anchors,
      }),
      conditions,
    );
    field.current = instance;
    if (!instance || conditions.reduce) return () => instance?.destroy();
    instance.morph = 0;
    ScrollTrigger.create({
      trigger: stage,
      start: "top 70%",
      once: true,
      onEnter: () => void gsap.to(instance, { morph: 1, duration: 2.2, ease: "power2.inOut" }),
    });
    return () => {
      instance.destroy();
      field.current = null;
    };
  });

  // Every sector re-forms the same particles into its own map.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const instance = field.current;
    const stage = ref.current?.querySelector(".industry-particles") ?? null;
    if (!instance || !stage) return;
    const { state, anchors } = industryTarget(active, stage);
    instance.retarget(state, anchors);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      instance.still(1);
      return;
    }
    gsap.fromTo(
      instance,
      { morph: 0 },
      { morph: 1, duration: 1.6, ease: "power3.inOut", overwrite: true },
    );
    const center = stage.querySelector<HTMLElement>(".p-label-center strong");
    if (center)
      gsap.to(center, {
        duration: 0.9,
        scrambleText: { text: active.toUpperCase(), chars: "upperCase", speed: 0.5 },
      });
    gsap.fromTo(
      ref.current?.querySelector(".industry-result") ?? {},
      { yPercent: 40, autoAlpha: 0 },
      { yPercent: 0, autoAlpha: 1, duration: 0.9, ease: "storyOut" },
    );
  }, [active]);

  const holdUntil = useRef(0);
  const hovering = useRef(false);
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      if (hovering.current || Date.now() < holdUntil.current) return;
      if (!ScrollTrigger.isInViewport(section, 0.3)) return;
      setActive((current) => names[(names.indexOf(current) + 1) % names.length] ?? current);
    }, ROTATE_MS);
    const enter = () => {
      hovering.current = true;
      section.classList.add("is-paused");
    };
    const leave = () => {
      hovering.current = false;
      section.classList.remove("is-paused");
    };
    const stage = section.querySelector(".industry-layout");
    stage?.addEventListener("pointerenter", enter);
    stage?.addEventListener("pointerleave", leave);
    return () => {
      window.clearInterval(timer);
      stage?.removeEventListener("pointerenter", enter);
      stage?.removeEventListener("pointerleave", leave);
    };
  }, []);
  const choose = (name: Industry) => {
    holdUntil.current = Date.now() + ROTATE_MS * 2;
    setActive(name);
  };

  // Slide the indicator to the selected tab.
  useEffect(() => {
    const list = tabs.current;
    const indicator = list?.querySelector<HTMLElement>(".industry-indicator");
    const place = (animate: boolean) => {
      const button = list?.querySelector<HTMLElement>("[aria-selected='true']");
      if (!button || !indicator) return;
      gsap.to(indicator, {
        x: button.offsetLeft,
        y: button.offsetTop,
        width: button.offsetWidth,
        height: button.offsetHeight,
        duration: animate ? 0.7 : 0,
        ease: "story",
      });
    };
    place(true);
    const onResize = () => place(false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [active]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = names.indexOf(active);
    const next = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: names.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const name = names[(next + names.length) % names.length];
    if (!name) return;
    choose(name);
    tabs.current?.querySelector<HTMLElement>(`#tab-${slug(name)}`)?.focus();
  };

  return (
    <section className="industries chapter" id="industries" ref={ref} data-chapter="05">
      <div className="chapter-number">
        <span>05 / INDUSTRIES</span>
        <i data-rule />
      </div>
      <header>
        <h2 data-split>
          Different businesses.
          <br />
          Different challenges.
          <br />
          <em>The same need for clarity.</em>
        </h2>
      </header>
      <div className="industry-layout">
        <div
          className="industry-tabs"
          role="tablist"
          aria-label="Industries"
          ref={tabs}
          onKeyDown={onKeyDown}
        >
          <i className="industry-indicator" aria-hidden="true" />
          {names.map((industry, index) => (
            <button
              key={industry}
              id={`tab-${slug(industry)}`}
              type="button"
              role="tab"
              aria-selected={industry === active}
              aria-controls="industry-panel"
              tabIndex={industry === active ? 0 : -1}
              onClick={() => choose(industry)}
            >
              <span>0{index + 1}</span>
              {industry}
            </button>
          ))}
        </div>
        <div
          className="industry-stage"
          id="industry-panel"
          role="tabpanel"
          aria-labelledby={`tab-${slug(active)}`}
        >
          <ParticleStage
            className="industry-particles"
            label={`${active.toUpperCase()} connected to ${content.nodes.join(", ")}`}
          >
            {content.nodes.map((node, index) => (
              <PLabel key={`${active}-${node}`} index={index} title={node} />
            ))}
            <PLabel title={active.toUpperCase()} variant="center" />
          </ParticleStage>
          <p className="industry-result">{content.result}</p>
        </div>
      </div>
    </section>
  );
}

const before = [
  "Scattered information",
  "Hours building reports",
  "Manual work every week",
  "Slow decisions",
];
const after = [
  "One source of truth",
  "Reports ready on time",
  "Routine work handled",
  "Confident decisions",
];

/**
 * Before & After: a processing beam sweeps down a column of messy data.
 * Row by row, the problem on the left is struck out, the data snaps into a
 * clean stream, and the matching result on the right lights up.
 */
export function BeforeAfter() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const rows = before.length;
    const { mess, order, rowOf } = messToRows(rows, 1.5, 1);
    const progress = { value: conditions.reduce ? 1 : 0 };
    // Row k is processed once the beam has passed its middle.
    const rowDone = (k: number) => clamp01((progress.value * (rows + 0.6) - k - 0.3) * 2.2);
    const field = mountField(
      el.querySelector(".ba-stage"),
      ({ desktop }) => ({
        count: desktop ? 1500 : 800,
        theme: "dark",
        glow: 0.14,
        bright: true,
        accentRatio: 0.4,
        radius: [0.5, 0.5],
        seed: 13,
        states: [mess, order],
        localMorph: (i) => {
          const k = rowDone(rowOf(i));
          return k * k * (3 - 2 * k);
        },
      }),
      conditions,
    );
    // Just under 1: stay between the two states so localMorph decides per particle.
    if (field) field.morph = 0.999;

    const lefts = gsap.utils.toArray<HTMLElement>(".ba-before li", el);
    const rights = gsap.utils.toArray<HTMLElement>(".ba-after li", el);
    const beam = el.querySelector<HTMLElement>(".ba-beam");
    const paint = () => {
      for (let k = 0; k < rows; k++) {
        const done = rowDone(k);
        lefts[k]?.style.setProperty("--done", done.toFixed(3));
        rights[k]?.style.setProperty("--done", done.toFixed(3));
      }
      if (beam)
        beam.style.top = `${Math.min(progress.value * 100 * ((rows + 0.6) / rows) - 7, 100)}%`;
      el.classList.toggle("is-done", progress.value > 0.97);
    };
    paint();
    if (conditions.reduce) return () => field?.destroy();

    gsap.to(progress, {
      value: 1,
      ease: "none",
      onUpdate: paint,
      scrollTrigger: conditions.desktop
        ? {
            trigger: el.querySelector(".ba-pin"),
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 1,
          }
        : { trigger: el.querySelector(".ba-grid"), start: "top 70%", end: "bottom 45%", scrub: 1 },
    });
    return () => field?.destroy();
  });

  return (
    <section className="before-after ba2" id="difference" ref={ref}>
      <div className="ba-pin">
        <h2 data-split>
          From moving information
          <br />
          to <em>using it.</em>
        </h2>
        <div className="ba-grid">
          <div className="ba-col ba-before">
            <p className="ba-label">Before</p>
            <ul>
              {before.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="ba-center" aria-hidden="true">
            <ParticleStage className="ba-stage" />
            <i className="ba-beam" />
          </div>
          <div className="ba-col ba-after">
            <p className="ba-label">After</p>
            <ul>
              {after.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
