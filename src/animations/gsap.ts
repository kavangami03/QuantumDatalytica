import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useEffect, useLayoutEffect, type DependencyList, type RefObject } from "react";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, CustomEase);

CustomEase.create("story", "0.7, 0, 0.15, 1");
CustomEase.create("storyOut", "0.16, 1, 0.3, 1");
gsap.defaults({ ease: "storyOut", duration: 1 });

export { gsap, ScrollTrigger, SplitText };

export const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** Media conditions shared by every scene: full choreography, simplified, or none. */
export const MEDIA = {
  desktop: "(min-width: 901px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 900px) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
};

export type MediaConditions = { desktop: boolean; mobile: boolean; reduce: boolean };

/**
 * Runs a scene's GSAP setup inside a scoped matchMedia, so every tween,
 * ScrollTrigger and SplitText is reverted on unmount or breakpoint change.
 */
export function useScene(
  scope: RefObject<HTMLElement | null>,
  setup: (conditions: MediaConditions, el: HTMLElement) => void | (() => void),
  deps: DependencyList = [],
) {
  useIsoLayoutEffect(() => {
    const el = scope.current;
    if (!el) return;
    const mm = gsap.matchMedia(el);
    mm.add(MEDIA, (context) => setup(context.conditions as MediaConditions, el));
    return () => mm.revert();
  }, deps);
}

/** Masked line reveal for a heading, replayed correctly when lines re-flow. */
export function splitReveal(
  target: Element,
  vars: {
    trigger?: Element;
    start?: string;
    delay?: number;
    stagger?: number;
    scroll?: boolean;
  } = {},
) {
  const { trigger = target, start = "top 82%", delay = 0, stagger = 0.09, scroll = true } = vars;
  return SplitText.create(target, {
    type: "lines",
    mask: "lines",
    linesClass: "split-line",
    autoSplit: true,
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 110,
        duration: 1.25,
        stagger,
        delay,
        ...(scroll && { scrollTrigger: { trigger, start, once: true } }),
      });
    },
  });
}
