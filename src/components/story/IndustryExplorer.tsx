import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { gsap, ScrollTrigger, useScene } from "@/animations/gsap";
import { industries } from "./data";
import {
  clamp01,
  motions,
  ParticleField,
  shapes,
  spokesState,
  type AnchorDef,
  type Vec,
} from "./particles";
import { labelsIn, mountField, ParticleStage, PLabel } from "./ParticleStage";

type Industry = keyof typeof industries;
const names = Object.keys(industries) as Industry[];
const positions: Vec[] = [
  [-1.4, -0.72, 0.25],
  [1.35, -0.78, -0.25],
  [1.8, 0.2, 0.2],
  [0.6, 0.9, -0.25],
  [-0.95, 0.85, 0.3],
  [-1.85, 0.05, -0.2],
];
const slug = (name: string) => name.toLowerCase().replace(/\s+/g, "-");

function industryTarget(name: Industry, stage: Element | null) {
  const count = industries[name].nodes.length;
  const nodes = positions.slice(0, count);
  const labels = labelsIn(stage);
  const anchors: AnchorDef[] = labels.map((el, index) => ({
    el,
    at: [null, index < count ? (nodes[index] ?? null) : ([0, 0.66, 0] as Vec)],
  }));
  return { state: spokesState(nodes, { speed: 0.00011 }), anchors };
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
        count: desktop ? 2600 : 1200,
        theme: "dark",
        radius: [0.28, 0.42],
        pointer: 0.35,
        tilt: 0.06,
        seed: 29,
        states: [{ shape: shapes.nebula(1.6, 1, 0.9), motion: motions.swirl(0.0003, 0.02) }, state],
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
    setActive(name);
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
              onClick={() => setActive(industry)}
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
            {positions.map((_, index) => {
              const node = content.nodes[index];
              return node ? <PLabel key={`${active}-${node}`} index={index} title={node} /> : null;
            })}
            <PLabel title={active.toUpperCase()} variant="center" />
          </ParticleStage>
          <p className="industry-result">{content.result}</p>
        </div>
      </div>
    </section>
  );
}

const before = [
  "Disconnected information",
  "Manual processes",
  "Repeated work",
  "Slow reporting",
  "Scattered knowledge",
];
const after = [
  "Connected information",
  "Automated processes",
  "Clear visibility",
  "Faster action",
  "Better understanding",
];

/* Chaos on one side of the divider, order on the other. */
const GRID = { cols: 34, rows: 14 };
export function BeforeAfter() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    if (conditions.reduce) return;
    el.classList.add("is-wipe");
    const pin = el.querySelector(".ba-pin");
    const items = gsap.utils.toArray<HTMLElement>(".before li", el);
    const count = conditions.desktop ? 1900 : 900;
    const per = Math.max(1, Math.floor(count / (GRID.cols * GRID.rows)));
    const field = mountField(
      el.querySelector(".ba-particles"),
      () => ({
        count,
        theme: "dark",
        radius: [0.25, 0.5],
        accentRatio: 0.18,
        size: 1.8,
        seed: 13,
        states: [
          { shape: shapes.cloud(2.1, 1.05, 1), motion: motions.drift(0.1) },
          { shape: shapes.grid(GRID.cols, GRID.rows, 3.9, 1.9) },
        ],
        // A particle snaps into order once the divider has passed its column.
        localMorph: (i, morph) => {
          const col = (Math.floor(i / per) % (GRID.cols * GRID.rows)) % GRID.cols;
          const x = col / (GRID.cols - 1);
          return clamp01((x - (1 - morph)) * 5);
        },
      }),
      conditions,
    );

    const divider = { progress: 0 };
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: pin,
        start: "top top",
        end: "+=180%",
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });
    tl.to(items, { "--strike": 1, stagger: 0.08, duration: 0.3 }, 0)
      .fromTo(
        ".comparison-side.after",
        { clipPath: "inset(0% 0% 0% 100%)" },
        { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power1.inOut" },
        0.45,
      )
      .fromTo(
        ".comparison-rule",
        { left: "100%" },
        { left: "0%", duration: 1, ease: "power1.inOut" },
        0.45,
      )
      .to(
        divider,
        {
          progress: 1,
          duration: 1,
          ease: "power1.inOut",
          onUpdate: () => {
            if (field) field.morph = divider.progress;
          },
        },
        0.45,
      )
      .from(".before-after h2", { yPercent: 40, autoAlpha: 0, duration: 0.4 }, 0.2)
      .to({}, { duration: 0.25 });

    return () => {
      field?.destroy();
      el.classList.remove("is-wipe");
    };
  });

  return (
    <section className="before-after" ref={ref}>
      <div className="ba-pin">
        <div className="comparison-side before">
          <p>BEFORE</p>
          <ul>
            {before.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="comparison-rule" aria-hidden="true">
          <i />
        </div>
        <div className="comparison-side after">
          <p>AFTER</p>
          <ul>
            {after.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <ParticleStage className="ba-particles" />
        <h2>
          From moving information
          <br />
          to <em>using it.</em>
        </h2>
      </div>
    </section>
  );
}
