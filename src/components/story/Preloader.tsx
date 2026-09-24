import { useRef } from "react";
import { gsap, useScene } from "@/animations/gsap";
import { fireIntro } from "@/animations/intro";
import { setScrollLock } from "@/animations/smooth";
import { imageShape, motions, ParticleField, sampleImage, shapes } from "./particles";

const SEEN_KEY = "qdl-intro-seen";

/**
 * Scattered data points assemble into the QuantumDataLytica symbol, the
 * wordmark reveals beneath it, and the curtain lifts into the hero.
 * Rendered on the server so the hero never flashes; a CSS fallback removes it
 * if scripts never run.
 */
export function Preloader() {
  const ref = useRef<HTMLDivElement>(null);

  useScene(ref, ({ reduce, desktop }, el) => {
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
    const wordmark = el.querySelector<HTMLElement>(".preloader-wordmark");
    const canvas = el.querySelector<HTMLCanvasElement>(".p-canvas");
    const counter = { value: 0 };
    let field: ParticleField | null = null;
    let tl: gsap.core.Timeline | null = null;
    let cancelled = false;

    setScrollLock("intro", true);

    const play = () => {
      if (cancelled) return;
      const full = !seen;
      tl = gsap.timeline({
        defaults: { ease: "story" },
        onComplete: () => {
          el.style.display = "none";
          field?.destroy();
          setScrollLock("intro", false);
        },
      });
      if (field) {
        tl.to(field, { fade: 1, duration: 0.8, ease: "power2.out" }, 0).to(
          field,
          { morph: 1, duration: full ? 2.3 : 1.2, ease: "power3.inOut" },
          0.2,
        );
      }
      tl.to(
        counter,
        {
          value: 100,
          duration: full ? 2.6 : 1.4,
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
          { scaleX: 1, duration: full ? 2.6 : 1.4, ease: "power2.inOut" },
          0,
        )
        .fromTo(
          wordmark,
          { clipPath: "inset(0% 100% 0% 0%)", y: 12 },
          { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 1, ease: "storyOut" },
          full ? 2.1 : 1.1,
        )
        .to({}, { duration: full ? 0.9 : 0.35 })
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1 })
        .call(fireIntro, [], "-=0.6");
    };

    // Sample the real symbol, then let the particles find their places in it.
    if (canvas) {
      sampleImage("/brand/symbol-on-dark.svg")
        .then((sample) => {
          if (cancelled) return;
          field = new ParticleField(canvas, {
            count: desktop ? 3600 : 1800,
            theme: "dark",
            glow: 0.16,
            radius: [0.45, 0.3],
            accentFor: (i) => sample.accent[i % sample.accent.length] ?? false,
            seed: 3,
            states: [
              { shape: shapes.nebula(2.2, 1.3, 1), motion: motions.swirl(0.00035, 0.03) },
              {
                shape: (i, n, r) => {
                  const p = imageShape(sample, 1.6)(i, n, r);
                  return [p[0], p[1] - 0.32, p[2]];
                },
                motion: motions.drift(0.004),
              },
            ],
          });
          field.fade = 0;
          field.morph = 0;
          field.start();
          play();
        })
        .catch(() => play());
    } else {
      play();
    }

    return () => {
      cancelled = true;
      tl?.kill();
      field?.destroy();
      setScrollLock("intro", false);
      fireIntro();
    };
  });

  return (
    <div className="preloader" ref={ref} aria-hidden="true">
      <div className="p-stage preloader-stage">
        <canvas className="p-canvas" />
      </div>
      <img
        className="preloader-wordmark"
        src="/brand/wordmark-on-dark.svg"
        alt=""
        width={266}
        height={35}
      />
      <div className="preloader-foot">
        <div className="preloader-meta">
          <span>Information, made useful.</span>
          <span data-count>000</span>
        </div>
        <div className="preloader-bar">
          <i />
        </div>
      </div>
    </div>
  );
}
