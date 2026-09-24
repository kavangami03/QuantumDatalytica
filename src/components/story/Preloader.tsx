import { useRef } from "react";
import { gsap, useScene } from "@/animations/gsap";
import { fireIntro } from "@/animations/intro";
import { setScrollLock } from "@/animations/smooth";

const SEEN_KEY = "qdl-intro-seen";

/**
 * Counts in, lifts away, and signals the hero to open.
 * Rendered on the server so the hero never flashes before it; a CSS
 * fallback removes it if scripts never run.
 */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useScene(ref, ({ reduce }, el) => {
    if (reduce) {
      el.style.display = "none";
      fireIntro();
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable: play the full intro */
    }

    const count = el.querySelector<HTMLElement>("[data-count]");
    const counter = { value: 0 };
    const letters = el.querySelectorAll(".preloader-brand span");

    setScrollLock("intro", true);
    const tl = gsap.timeline({
      defaults: { ease: "story" },
      onComplete: () => {
        el.style.display = "none";
        setScrollLock("intro", false);
      },
    });

    if (!seen) {
      tl.from(letters, { yPercent: 110, stagger: 0.035, duration: 0.9, ease: "storyOut" })
        .to(
          counter,
          {
            value: 100,
            duration: 1.4,
            ease: "power2.inOut",
            onUpdate: () => {
              if (count) count.textContent = String(Math.round(counter.value)).padStart(3, "0");
            },
          },
          0,
        )
        .fromTo(
          el.querySelector(".preloader-bar i"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.4, ease: "power2.inOut" },
          0,
        )
        .to(letters, { yPercent: -110, stagger: 0.02, duration: 0.6 }, "+=0.1");
    }

    tl.to(
      el,
      { clipPath: "inset(0% 0% 100% 0%)", duration: seen ? 0.7 : 1.1 },
      seen ? 0 : "-=0.35",
    ).call(fireIntro, [], "-=0.6");

    return () => {
      setScrollLock("intro", false);
      fireIntro();
    };
  });

  return (
    <div className="preloader" ref={ref} aria-hidden="true">
      <div className="preloader-brand">
        {"QuantumDataLytica".split("").map((char, index) => (
          <span key={index}>{char}</span>
        ))}
      </div>
      <div className="preloader-meta">
        <span>Information, made useful.</span>
        <span data-count>000</span>
      </div>
      <div className="preloader-bar">
        <i />
      </div>
    </div>
  );
}
