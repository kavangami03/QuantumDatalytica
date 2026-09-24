import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap, useIsoLayoutEffect } from "@/animations/gsap";
import { scrollToHash, setScrollLock } from "@/animations/smooth";
import { StoryButton } from "./StoryButton";

const links = [
  ["What We Solve", "problem"],
  ["How It Works", "transformation"],
  ["Industries", "industries"],
  ["Business Impact", "impact"],
] as const;

export function Navigation() {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);

  useIsoLayoutEffect(() => {
    const el = menu.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      timeline.current = gsap
        .timeline({ paused: true, defaults: { ease: "story" } })
        .fromTo(
          el,
          { clipPath: "inset(0% 0% 100% 0%)" },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 0.8 },
        )
        .from(
          el.querySelectorAll(".menu-link span"),
          { yPercent: 110, stagger: 0.06, duration: 0.9, ease: "storyOut" },
          0.3,
        )
        .from(el.querySelectorAll("[data-menu-fade]"), { autoAlpha: 0, y: 20, duration: 0.6 }, 0.6);
    }, el);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const tl = timeline.current;
    setScrollLock("menu", open);
    if (open) tl?.timeScale(1).play();
    else tl?.timeScale(1.6).reverse();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const go = (event: MouseEvent<HTMLAnchorElement>, target: string) => {
    event.preventDefault();
    setOpen(false);
    scrollToHash(`#${target}`);
  };

  return (
    <>
      <header className="site-nav" data-nav>
        <a className="brand" href="#top">
          <img
            className="brand-logo"
            src="/brand/logo-on-dark.svg"
            alt="QuantumDataLytica"
            width={327}
            height={35}
          />
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map(([label, target]) => (
            <a key={target} href={`#${target}`} className="nav-link">
              <span className="roll">
                <span>{label}</span>
                <span aria-hidden="true">{label}</span>
              </span>
            </a>
          ))}
        </nav>
        <div className="nav-cta">
          <StoryButton href="#contact" variant="storyOutline">
            Talk to us
          </StoryButton>
        </div>
        <button
          className="menu-toggle"
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-menu"
        >
          <span className={open ? "is-open" : ""}>
            <i />
            <i />
          </span>
        </button>
      </header>
      <div className="site-menu" id="site-menu" ref={menu} inert={!open}>
        <nav aria-label="Mobile navigation">
          {links.map(([label, target], index) => (
            <a
              key={target}
              href={`#${target}`}
              className="menu-link"
              onClick={(event) => go(event, target)}
            >
              <small>0{index + 1}</small>
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="menu-foot" data-menu-fade>
          <a href="#contact" onClick={(event) => go(event, "contact")}>
            Talk to us →
          </a>
          <span>Turning business information into meaningful action.</span>
        </div>
      </div>
    </>
  );
}

export function ProgressRail() {
  return (
    <aside className="progress-rail" aria-hidden="true">
      <span data-progress-current>01</span>
      <div>
        <i data-progress-bar />
      </div>
      <span>08</span>
    </aside>
  );
}
