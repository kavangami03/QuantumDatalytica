import { type RefObject } from "react";
import { gsap, ScrollTrigger, SplitText, splitReveal, useScene } from "./gsap";

/**
 * Page-wide motion vocabulary, driven by data attributes:
 *   data-split   masked line reveal for headings
 *   data-reveal  soft rise-in for supporting copy
 *   data-fill    words fill from muted to ink while scrolling
 *   data-rule    hairlines draw from the left
 *   data-magnetic  elements lean toward the pointer
 */
export function useStoryMotion(root: RefObject<HTMLElement | null>) {
  useScene(root, ({ desktop, reduce }, el) => {
    // Difference-blended chrome turns orange over the cobalt chapter; keep it plain white there.
    const accent = el.querySelector(".question-trail");
    if (accent) {
      ScrollTrigger.create({
        trigger: accent,
        start: "top 60px",
        end: "bottom 60px",
        toggleClass: { targets: document.documentElement, className: "nav-on-accent" },
      });
    }
    if (reduce) return;
    const splits: SplitText[] = [];

    el.querySelectorAll<HTMLElement>("[data-split]").forEach((heading) => {
      splits.push(splitReveal(heading));
    });

    el.querySelectorAll<HTMLElement>("[data-reveal]").forEach((item) => {
      gsap.from(item, {
        y: 40,
        autoAlpha: 0,
        duration: 1.2,
        scrollTrigger: { trigger: item, start: "top 88%", once: true },
      });
    });

    el.querySelectorAll<HTMLElement>("[data-fill]").forEach((block) => {
      const split = SplitText.create(block, { type: "words", wordsClass: "fill-word" });
      splits.push(split);
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.08,
          scrollTrigger: { trigger: block, start: "top 80%", end: "bottom 45%", scrub: true },
        },
      );
    });

    el.querySelectorAll<HTMLElement>("[data-rule]").forEach((rule) => {
      gsap.from(rule, {
        scaleX: 0,
        transformOrigin: "left center",
        duration: 1.6,
        ease: "story",
        scrollTrigger: { trigger: rule, start: "top 92%", once: true },
      });
    });

    // Chapter rail: fill plus live chapter number.
    const bar = document.querySelector<HTMLElement>("[data-progress-bar]");
    const current = document.querySelector<HTMLElement>("[data-progress-current]");
    if (bar) {
      gsap.fromTo(
        bar,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 0.3 },
        },
      );
    }
    if (current) {
      el.querySelectorAll<HTMLElement>("[data-chapter]").forEach((section) => {
        const label = section.dataset["chapter"] ?? "";
        ScrollTrigger.create({
          trigger: section,
          start: "top 50%",
          end: "bottom 50%",
          onToggle: (self) => {
            if (self.isActive && current.textContent !== label) {
              gsap.to(current, {
                duration: 0.6,
                scrambleText: { text: label, chars: "0123456789" },
              });
            }
          },
        });
      });
    }

    // Navigation tucks away on the way down and returns on the way up.
    const nav = document.querySelector<HTMLElement>("[data-nav]");
    if (nav) {
      const hide = gsap.to(nav, { yPercent: -140, duration: 0.6, ease: "story", paused: true });
      ScrollTrigger.create({
        start: 240,
        end: "max",
        onUpdate: (self) => (self.direction === 1 ? hide.play() : hide.reverse()),
        onLeaveBack: () => hide.reverse(),
      });
    }

    const cleanups: Array<() => void> = [];
    if (desktop && window.matchMedia("(pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((item) => {
        const xTo = gsap.quickTo(item, "x", { duration: 0.6, ease: "power3.out" });
        const yTo = gsap.quickTo(item, "y", { duration: 0.6, ease: "power3.out" });
        const move = (event: PointerEvent) => {
          const box = item.getBoundingClientRect();
          xTo((event.clientX - box.left - box.width / 2) * 0.35);
          yTo((event.clientY - box.top - box.height / 2) * 0.35);
        };
        const leave = () => {
          gsap.to(item, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.4)" });
        };
        item.addEventListener("pointermove", move);
        item.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          item.removeEventListener("pointermove", move);
          item.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      splits.forEach((split) => split.revert());
    };
  });
}
