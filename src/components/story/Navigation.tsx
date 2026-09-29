import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap, useIsoLayoutEffect } from "@/animations/gsap";
import { scrollToHash, setScrollLock } from "@/animations/smooth";
import { StoryButton } from "./StoryButton";

export type NavLink = { label: string; href: string; active?: boolean };

export const DEMO_URL = "/request-demo/";

export const homeLinks: NavLink[] = [
  { label: "What We Solve", href: "#problem" },
  { label: "How It Works", href: "#transformation" },
  { label: "Industries", href: "#industries" },
  { label: "Business Impact", href: "#impact" },
  { label: "Platform", href: "/platform" },
];

type NavigationProps = {
  links?: NavLink[];
  homeHref?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export function Navigation({
  links = homeLinks,
  homeHref = "#top",
  ctaLabel = "Book a demo",
  ctaHref = DEMO_URL,
}: NavigationProps) {
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

  // In-page anchors scroll smoothly; real page links navigate normally.
  const go = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    if (!href.startsWith("#")) return;
    event.preventDefault();
    scrollToHash(href);
  };

  return (
    <>
      <header className="site-nav" data-nav>
        <a className="brand" href={homeHref} aria-label="QuantumDataLytica home">
          <img
            className="brand-logo"
            src="/brand/logo-on-dark.svg"
            alt="QuantumDataLytica"
            width={327}
            height={35}
          />
        </a>
        <nav className="nav-links" aria-label="Main navigation">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`nav-link ${link.active ? "is-active" : ""}`}
              aria-current={link.active ? "page" : undefined}
            >
              <span className="roll">
                <span>{link.label}</span>
                <span aria-hidden="true">{link.label}</span>
              </span>
            </a>
          ))}
        </nav>
        <div className="nav-cta">
          <StoryButton href={ctaHref} variant="storyOutline" track="demo">
            {ctaLabel}
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
          {links.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              className="menu-link"
              onClick={(event) => go(event, link.href)}
            >
              <small>0{index + 1}</small>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
        <div className="menu-foot" data-menu-fade>
          <a href={ctaHref} data-track="demo" onClick={(event) => go(event, ctaHref)}>
            {ctaLabel} →
          </a>
          <span>Turning business information into meaningful action.</span>
        </div>
      </div>
    </>
  );
}

export function ProgressRail({ total = "08" }: { total?: string }) {
  return (
    <aside className="progress-rail" aria-hidden="true">
      <span data-progress-current>01</span>
      <div>
        <i data-progress-bar />
      </div>
      <span>{total}</span>
    </aside>
  );
}
