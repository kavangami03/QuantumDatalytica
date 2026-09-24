import { useRef } from "react";
import { gsap, ScrollTrigger, useScene } from "@/animations/gsap";

/** An endless band of words whose speed and direction follow the scroll. */
export function Marquee({
  words,
  tone = "light",
}: {
  words: readonly string[];
  tone?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useScene(ref, ({ reduce }, el) => {
    if (reduce) return;
    const track = el.querySelector<HTMLElement>(".marquee-track");
    if (!track) return;
    const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const boost = Math.min(Math.abs(self.getVelocity()) / 250, 6);
        gsap.to(loop, { timeScale: self.direction * (1 + boost), duration: 0.3, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.2, delay: 0.3, overwrite: false });
      },
      onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
    });
    return () => trigger.kill();
  });

  const row = words.flatMap((word) => [word, "·"]);
  return (
    <div className={`marquee marquee-${tone}`} ref={ref} aria-hidden="true">
      <div className="marquee-track">
        {[...row, ...row].map((word, index) => (
          <span key={index} className={word === "·" ? "marquee-dot" : undefined}>
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}
