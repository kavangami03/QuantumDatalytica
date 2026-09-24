import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "./gsap";

let lenis: Lenis | null = null;
const locks = new Set<string>();

function applyLocks() {
  if (!lenis) return;
  if (locks.size) lenis.stop();
  else lenis.start();
}

/** Pause or resume smooth scrolling for a named reason (intro, menu…). */
export function setScrollLock(key: string, locked: boolean) {
  if (locked) locks.add(key);
  else locks.delete(key);
  applyLocks();
}

/** Smoothly scroll to an in-page hash, falling back to native scrolling. */
export function scrollToHash(hash: string) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target) return;
  if (lenis) {
    lenis.scrollTo(target, { duration: 1.6, force: true });
  } else {
    target.scrollIntoView({ behavior: "auto" });
  }
}

export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ duration: 1.15, smoothWheel: true, anchors: { duration: 1.6 } });
    lenis = instance;
    applyLocks();
    const update = (time: number) => instance.raf(time * 1000);
    instance.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    // Web fonts change line lengths, so trigger positions must be re-measured once they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(update);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenis = null;
    };
  }, []);
}
