import { useEffect, useRef } from "react";
import { gsap } from "@/animations/gsap";

/** A trailing ring that swells over anything interactive. Fine pointers only. */
export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    if (!fine.matches) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });

    const move = (event: PointerEvent) => {
      // Appear only once there is a real pointer position to sit on.
      if (!el.classList.contains("is-ready")) {
        gsap.set(el, { x: event.clientX, y: event.clientY });
        el.classList.add("is-ready");
      }
      xTo(event.clientX);
      yTo(event.clientY);
    };
    const over = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest("a, button, [role='tab']");
      el.classList.toggle("is-hover", Boolean(target));
    };
    const leave = () => el.classList.add("is-hidden");
    const enter = () => el.classList.remove("is-hidden");

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("pointerenter", enter);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.removeEventListener("pointerenter", enter);
    };
  }, []);

  return <div className="cursor" ref={ref} aria-hidden="true" />;
}
