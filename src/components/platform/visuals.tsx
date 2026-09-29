import { useEffect, type ReactNode, type RefObject } from "react";
import { gsap, ScrollTrigger, useScene } from "@/animations/gsap";
import { motions, type StateDef } from "@/components/story/particles";
import { mountField, ParticleStage } from "@/components/story/ParticleStage";
import {
  circulatingTorus,
  clockFace,
  flowGraph,
  forecastLine,
  gatheringHub,
  hourglass,
  nestedRings,
  orbitingSegments,
  packetLanes,
  risingBars,
} from "@/components/story/metaphors";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Draws curved wires between the elements marked data-node inside `scope`,
 * with glowing data travelling along them. Wires re-route on resize and
 * switch from horizontal to vertical when the layout stacks.
 */
export function useFlowWires(
  scope: RefObject<HTMLElement | null>,
  edges: Array<[string, string]>,
  opts: { dots?: number; speed?: number } = {},
) {
  const { dots = 3, speed = 1.8 } = opts;
  useEffect(() => {
    const root = scope.current;
    const svg = root?.querySelector<SVGSVGElement>(".flow-wires");
    if (!root || !svg) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let tweens: gsap.core.Tween[] = [];

    const build = () => {
      tweens.forEach((tween) => tween.kill());
      tweens = [];
      svg.replaceChildren();
      const box = root.getBoundingClientRect();
      if (!box.width) return;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      edges.forEach(([from, to], k) => {
        const a = root.querySelector(`[data-node="${from}"]`)?.getBoundingClientRect();
        const b = root.querySelector(`[data-node="${to}"]`)?.getBoundingClientRect();
        if (!a || !b || !a.width || !b.width) return;
        const horizontal = b.left >= a.right - 4;
        let d: string;
        if (horizontal) {
          const x1 = a.right - box.left;
          const y1 = a.top + a.height / 2 - box.top;
          const x2 = b.left - box.left;
          const y2 = b.top + b.height / 2 - box.top;
          const mx = (x1 + x2) / 2;
          d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
        } else {
          const x1 = a.left + a.width / 2 - box.left;
          const y1 = a.bottom - box.top;
          const x2 = b.left + b.width / 2 - box.left;
          const y2 = b.top - box.top;
          const my = (y1 + y2) / 2;
          d = `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
        }
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("class", "flow-wire");
        svg.append(path);
        if (reduce) return;
        for (let i = 0; i < dots; i++) {
          const dot = document.createElementNS(SVG_NS, "circle");
          dot.setAttribute("r", "2.6");
          dot.setAttribute("class", "flow-dot");
          svg.append(dot);
          const tween = gsap.to(dot, {
            motionPath: { path, align: path, alignOrigin: [0.5, 0.5] },
            duration: speed + (k % 3) * 0.25,
            ease: "none",
            repeat: -1,
          });
          tween.progress(i / dots);
          tweens.push(tween);
        }
      });
    };

    build();
    const visibility = new IntersectionObserver(([entry]) => {
      const on = Boolean(entry?.isIntersecting);
      tweens.forEach((tween) => (on ? tween.resume() : tween.pause()));
    });
    visibility.observe(root);
    const observer = new ResizeObserver(() => build());
    observer.observe(root);
    // Positions shift once web fonts land.
    document.fonts?.ready.then(build);
    return () => {
      observer.disconnect();
      visibility.disconnect();
      tweens.forEach((tween) => tween.kill());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export const metaphorFactories: Record<string, () => StateDef> = {
  graph: flowGraph,
  lanes: packetLanes,
  clock: clockFace,
  bars: risingBars,
  hub: gatheringHub,
  hourglass,
  orbit: orbitingSegments,
  forecast: forecastLine,
  torus: circulatingTorus,
  nested: nestedRings,
};

/** A dark card whose particles gather into a small living picture of what it does. */
export function MetaphorCard({
  metaphor,
  index,
  kicker,
  title,
  children,
  href,
  linkLabel,
  className = "",
}: {
  metaphor?: keyof typeof metaphorFactories;
  index?: string;
  kicker?: string;
  title: string;
  children?: ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  const body = (
    <>
      <div className="mcard-top">
        {index && <span className="mcard-index">{index}</span>}
        {kicker && <span className="mcard-kicker">{kicker}</span>}
      </div>
      {metaphor && <ParticleStage className="mcard-stage" />}
      <div className="mcard-copy">
        <h3>{title}</h3>
        {children && <p>{children}</p>}
        {linkLabel && (
          <span className="mcard-link">
            {linkLabel} <span aria-hidden="true">→</span>
          </span>
        )}
      </div>
      <i className="mcard-edge" aria-hidden="true" />
    </>
  );
  const cls = `mcard ${className}`;
  return href ? (
    <a className={cls} href={href} data-metaphor={metaphor}>
      {body}
    </a>
  ) : (
    <article className={cls} data-metaphor={metaphor}>
      {body}
    </article>
  );
}

/** Mounts a particle field in every MetaphorCard inside `scope`; hover speeds it up. */
export function useMetaphorCards(scope: RefObject<HTMLElement | null>) {
  useScene(scope, (conditions, el) => {
    const cards = Array.from(el.querySelectorAll<HTMLElement>("[data-metaphor]"));
    const cleanups: Array<() => void> = [];
    cards.forEach((card, index) => {
      const make = metaphorFactories[card.dataset["metaphor"] ?? ""];
      if (!make) return;
      const field = mountField(
        card.querySelector(".mcard-stage"),
        ({ desktop }) => ({
          count: desktop ? 750 : 500,
          theme: "dark",
          glow: 0,
          size: 1.35,
          accentRatio: 0.45,
          radius: [0.3, 0.4],
          pointer: 0.9,
          pointerEl: card,
          tilt: 0.1,
          seed: 120 + index,
          states: [
            // Start loose across the whole card, then gather into the picture.
            {
              shape: (_i, _n, r) => [(r() * 2 - 1) * 2.3, (r() * 2 - 1) * 1.3, (r() * 2 - 1) * 0.6],
              motion: motions.drift(0.04),
            },
            make(),
          ],
        }),
        conditions,
      );
      if (!field) return;
      cleanups.push(() => field.destroy());
      if (conditions.reduce) return;
      field.morph = 0;
      ScrollTrigger.create({
        trigger: card,
        start: "top 80%",
        once: true,
        onEnter: () =>
          void gsap.to(field, {
            morph: 1,
            duration: 2,
            delay: (index % 4) * 0.12,
            ease: "power2.inOut",
          }),
      });
      const enter = () => gsap.to(field, { timeScale: 2.4, duration: 0.8, ease: "power2.out" });
      const leave = () => gsap.to(field, { timeScale: 1, duration: 1.2, ease: "power2.out" });
      card.addEventListener("pointerenter", enter);
      card.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        card.removeEventListener("pointerenter", enter);
        card.removeEventListener("pointerleave", leave);
      });
    });
    if (!conditions.reduce && cards.length) {
      gsap.from(cards, {
        y: 50,
        autoAlpha: 0,
        duration: 1.1,
        stagger: 0.09,
        scrollTrigger: { trigger: cards[0] ?? el, start: "top 85%", once: true },
      });
    }
    return () => cleanups.forEach((cleanup) => cleanup());
  });
}
