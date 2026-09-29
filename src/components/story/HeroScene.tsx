import { useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import { gsap, SplitText, useScene } from "@/animations/gsap";
import { onIntro } from "@/animations/intro";
import { SignalField } from "./signal-field";
import {
  frac,
  imageShape,
  type ImageSample,
  ParticleField,
  sampleImage,
  type StateDef,
} from "./particles";
import { StoryButton } from "./StoryButton";
import { DEMO_URL } from "./Navigation";

const signals = [
  "Sales",
  "Customers",
  "Branches",
  "Revenue",
  "Operations",
  "Inventory",
  "Bookings",
  "Feedback",
  "Reports",
];

/**
 * The logo in particles, kept alive: data keeps rising through the blue bars,
 * a pulse runs around the cloud outline, and every point shimmers gently.
 */
function livingLogo(sample: ImageSample, width: number): StateDef {
  const base = imageShape(sample, width);
  const height = width * sample.aspect;
  const toY = (v: number) => (v - 0.5) * height;
  // Vertical extent of the blue in each narrow column of the image.
  const bins = 90;
  const top = new Array<number>(bins).fill(1);
  const bottom = new Array<number>(bins).fill(0);
  sample.points.forEach(([u, v], k) => {
    if (!sample.accent[k]) return;
    const b = Math.min(bins - 1, Math.floor(u * bins));
    top[b] = Math.min(top[b] ?? 1, v);
    bottom[b] = Math.max(bottom[b] ?? 0, v);
  });
  const home: Array<[number, number, number]> = [];
  const blue: boolean[] = [];
  const col: number[] = [];
  const u0: number[] = [];
  const speed: number[] = [];
  const angle: number[] = [];
  return {
    shape: (i, n, r) => {
      const p = base(i, n, r);
      home[i] = p;
      const k = i % sample.points.length;
      blue[i] = sample.accent[k] ?? false;
      col[i] = Math.min(bins - 1, Math.floor((sample.points[k]?.[0] ?? 0.5) * bins));
      u0[i] = r();
      speed[i] = 0.00012 + r() * 0.00008;
      angle[i] = Math.atan2(p[1], p[0]);
      return p;
    },
    motion: (i, t, p) => {
      const h0 = home[i] ?? [0, 0, 0];
      const b = col[i] ?? 0;
      const topV = top[b] ?? 1;
      const bottomV = bottom[b] ?? 0;
      if (blue[i] && bottomV > topV) {
        // Rising data inside the bar.
        const v = bottomV - frac((u0[i] ?? 0) + t * (speed[i] ?? 0.00015)) * (bottomV - topV);
        p[0] = h0[0];
        p[1] = toY(v);
        p[2] = h0[2];
        return;
      }
      // A pulse that travels around the cloud, pushing points gently outward.
      const run = ((t * 0.0011) % (Math.PI * 2)) - Math.PI;
      let diff = (angle[i] ?? 0) - run;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      const bump = Math.exp(-(diff * diff) / 0.09) * 0.075;
      const len = Math.hypot(h0[0], h0[1]) || 1;
      const ph = i * 1.618;
      p[0] = h0[0] + (h0[0] / len) * bump + Math.sin(t * 0.0009 + ph) * 0.004;
      p[1] = h0[1] + (h0[1] / len) * bump + Math.cos(t * 0.0008 + ph) * 0.004;
      p[2] = h0[2];
    },
  };
}

export function HeroScene() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, ({ desktop, reduce }, el) => {
    const canvas = el.querySelector<HTMLCanvasElement>(".hero-canvas");
    const pin = el.querySelector<HTMLElement>(".hero-pin");
    const title = el.querySelector<HTMLElement>(".hero-title");
    const resolution = el.querySelector<HTMLElement>(".hero-resolution");
    if (!canvas || !pin || !title || !resolution) return;

    const labels = gsap.utils.toArray<HTMLElement>(".hero-signal", el);
    let field: SignalField;
    try {
      field = new SignalField(
        canvas,
        labels,
        el.querySelector(".hero-core"),
        desktop ? 4200 : 1100,
        el.querySelector<HTMLElement>(".hero-logo-stage"),
      );
    } catch {
      return;
    }

    if (reduce) {
      field.morph = 1;
      field.fade = 1;
      field.labelAlpha = 1;
      field.still();
      return () => field.destroy();
    }

    field.start();

    // The logo at the end of the streams, drawn in the same particles; it simply holds its shape.
    let logoField: ParticleField | null = null;
    let logoRunning = false;
    // The logo only animates while it is actually on screen.
    const syncLogo = () => {
      const want = field.morph > 1.5;
      if (!logoField || want === logoRunning) return;
      logoRunning = want;
      if (want) logoField.start();
      else logoField.stop();
    };
    let cancelled = false;
    const logoCanvas = el.querySelector<HTMLCanvasElement>(".hero-logo-stage canvas");
    if (desktop && logoCanvas) {
      sampleImage("/brand/symbol-on-dark.svg")
        .then((sample) => {
          if (cancelled) return;
          logoField = new ParticleField(logoCanvas, {
            count: 3600,
            theme: "dark",
            glow: 0.17,
            radius: [0.48, 0.8],
            bright: true,
            accentFor: (i) => sample.accent[i % sample.accent.length] ?? false,
            seed: 41,
            states: [livingLogo(sample, 2)],
          });
          syncLogo();
        })
        .catch(() => undefined);
    }
    const titleSplit = SplitText.create(title, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
    });
    const resolutionSplit = SplitText.create(resolution, {
      type: "lines",
      mask: "lines",
      linesClass: "split-line",
    });

    // Opening: the field breathes in, then the words rise through it.
    const intro = gsap
      .timeline({ paused: true })
      .to(field, { fade: 1, duration: 2.4, ease: "power2.out" }, 0)
      .from(
        titleSplit.lines,
        { yPercent: 110, stagger: 0.12, duration: 1.4, ease: "storyOut" },
        0.15,
      )
      .from(
        el.querySelectorAll("[data-intro]"),
        { y: 24, autoAlpha: 0, stagger: 0.08, duration: 1.1, ease: "storyOut" },
        0.5,
      )
      .to(field, { labelAlpha: 1, duration: 1.6, ease: "power2.out" }, 0.8);
    if (!desktop) intro.to(field, { morph: 1, duration: 3.2, ease: "power2.inOut" }, 1.4);
    const pending = onIntro(() => void intro.play());
    if (!pending.pending) intro.progress(1);

    if (!desktop) {
      gsap.from(resolutionSplit.lines, {
        yPercent: 110,
        stagger: 0.1,
        duration: 1.2,
        scrollTrigger: { trigger: resolution, start: "top 85%", once: true },
      });
      return () => {
        pending.cancel();
        field.destroy();
        titleSplit.revert();
        resolutionSplit.revert();
      };
    }

    const move = (event: PointerEvent) => {
      field.setPointer(
        event.clientX / window.innerWidth - 0.5,
        event.clientY / window.innerHeight - 0.5,
      );
    };
    window.addEventListener("pointermove", move);

    // Scroll story: clusters → one sphere → nine streams → one point of action.
    gsap
      .timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: pin, start: "top top", end: "+=320%", pin: true, scrub: 1 },
        onUpdate: () => syncLogo(),
      })
      .to(title, { yPercent: -18, autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
      .to(".hero-top", { autoAlpha: 0, duration: 0.15 }, 0)
      .to(".hero-bottom", { y: 30, autoAlpha: 0, duration: 0.18 }, 0)
      .to(field, { morph: 1, duration: 0.5, ease: "power1.inOut" }, 0.06)
      .to(field, { morph: 2, duration: 0.4, ease: "power1.inOut" }, 0.72)
      // The closing line lands while the streams settle, then holds so it can be read.
      .from(
        resolutionSplit.lines,
        { yPercent: 115, stagger: 0.05, duration: 0.18, ease: "power3.out" },
        1.12,
      )
      .to({}, { duration: 0.4 });

    return () => {
      cancelled = true;
      logoField?.destroy();
      pending.cancel();
      window.removeEventListener("pointermove", move);
      field.destroy();
      titleSplit.revert();
      resolutionSplit.revert();
    };
  });

  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero-pin">
        <div
          className="hero-field"
          aria-label="Business information converging into one business view"
        >
          <canvas className="hero-canvas" aria-hidden="true" />
          {signals.map((signal, index) => (
            <span className="hero-signal" key={signal}>
              <span className="hero-signal-body">
                <i aria-hidden="true" />
                <span className="hero-signal-text">
                  <b>{String(index + 1).padStart(2, "0")}</b>
                  {signal}
                </span>
              </span>
            </span>
          ))}
          <div className="hero-logo-stage" aria-label="QuantumDataLytica">
            <canvas aria-hidden="true" />
          </div>
          <div className="hero-core">
            <span className="hero-core-ring" aria-hidden="true" />
            <small>ONE</small> BUSINESS VIEW
          </div>
        </div>

        <div className="hero-top">
          <p className="kicker" data-intro>
            One business. One clear view.
          </p>
          <span className="scroll-cue" data-intro>
            <i />
            Scroll to connect <ArrowDownRight />
          </span>
        </div>

        <h1 className="hero-title">
          Your business creates <em>data</em> every second. Turn it into <em>clear decisions.</em>
        </h1>

        <div className="hero-bottom">
          <p className="hero-intro" data-intro>
            Bring every report, branch and team into one place, and get answers you can act on.
          </p>
          <div className="hero-actions" data-intro>
            <StoryButton href="#transformation" icon={<ArrowDownRight />}>
              See how it works
            </StoryButton>
            <StoryButton href={DEMO_URL} variant="storyOutline" track="demo">
              Book a demo
            </StoryButton>
          </div>
        </div>

        <p className="hero-resolution">
          From scattered information
          <br />
          to <em>meaningful action.</em>
        </p>
      </div>
    </section>
  );
}
