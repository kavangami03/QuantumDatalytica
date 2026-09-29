import { useRef } from "react";
import { gsap, useScene } from "@/animations/gsap";
import { fireIntro } from "@/animations/intro";
import { setScrollLock } from "@/animations/smooth";
import {
  imageShape,
  type ImageSample,
  motions,
  ParticleField,
  rainState,
  sampleImage,
} from "./particles";

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
          // Only a finished intro counts as seen (dev mode runs setup twice).
          try {
            sessionStorage.setItem(SEEN_KEY, "1");
          } catch {
            /* storage unavailable */
          }
          el.style.display = "none";
          field?.destroy();
          setScrollLock("intro", false);
        },
      });
      if (field) {
        tl.to(
          field,
          { morph: 1, duration: full ? 1.6 : 0.9, ease: "power2.inOut" },
          full ? 0.55 : 0.2,
        );
      }
      tl.to(
        counter,
        {
          value: 100,
          duration: full ? 1.8 : 1,
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
          { scaleX: 1, duration: full ? 1.8 : 1, ease: "power2.inOut" },
          0,
        )
        .fromTo(
          wordmark,
          { clipPath: "inset(0% 100% 0% 0%)", y: 12 },
          { clipPath: "inset(0% 0% 0% 0%)", y: 0, duration: 0.8, ease: "storyOut" },
          full ? 1.2 : 0.55,
        )
        // Hold on the finished logo for a beat, then lift the curtain.
        .to({}, { duration: full ? 0.35 : 0.15 })
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8 })
        .call(fireIntro, [], "-=0.5");
    };

    // The rain starts at once; the logo shape is swapped in as soon as the image is read.
    let sample: ImageSample | null = null;
    const rain = rainState({ width: 3.7, top: -1.8, bottom: 1.8 });
    if (canvas) {
      try {
        field = new ParticleField(canvas, {
          count: desktop ? 3600 : 1800,
          theme: "dark",
          glow: 0.16,
          radius: [0.45, 0.3],
          bright: true,
          accentFor: (i) => (i * 7) % 10 < 3,
          seed: 3,
          // Data rains down the screen, then gathers into the logo, top first.
          localMorph: (i, morph) => {
            if (!sample) return 0;
            const landY = sample.points[i % sample.points.length]?.[1] ?? 0.5;
            const k = morph * 1.7 - landY * 0.55 - (((i * 37) % 100) / 100) * 0.15;
            const c = k < 0 ? 0 : k > 1 ? 1 : k;
            return c * c * (3 - 2 * c);
          },
          states: [rain, rain],
        });
        field.fade = 1;
        field.morph = 0;
        field.start();
        el.classList.add("is-live");
      } catch {
        field = null;
      }
    }
    sampleImage("/brand/symbol-on-dark.svg")
      .then((result) => {
        if (cancelled) return;
        sample = result;
        field?.setState(1, {
          shape: (i, n, r) => {
            const p = imageShape(result, 1.6)(i, n, r);
            return [p[0], p[1] - 0.32, p[2]];
          },
          motion: motions.drift(0.004),
        });
        play();
      })
      .catch(() => play());

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
