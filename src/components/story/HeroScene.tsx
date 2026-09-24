import { useRef } from "react";
import { ArrowDownRight } from "lucide-react";
import { gsap, SplitText, useScene } from "@/animations/gsap";
import { onIntro } from "@/animations/intro";
import { SignalField } from "./signal-field";
import { StoryButton } from "./StoryButton";

const signals = [
  "Sales",
  "Customers",
  "Orders",
  "Revenue",
  "Operations",
  "Inventory",
  "Bookings",
  "Feedback",
  "Marketing",
];

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
        desktop ? 2200 : 1100,
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
        scrollTrigger: { trigger: pin, start: "top top", end: "+=300%", pin: true, scrub: 1 },
      })
      .to(
        title,
        { yPercent: -18, autoAlpha: 0, filter: "blur(14px)", duration: 0.28, ease: "power2.in" },
        0,
      )
      .to(".hero-top", { autoAlpha: 0, duration: 0.15 }, 0)
      .to(".hero-bottom", { y: 30, autoAlpha: 0, duration: 0.18 }, 0)
      .to(field, { morph: 1, duration: 0.5, ease: "power1.inOut" }, 0.06)
      .to(field, { morph: 2, duration: 0.4, ease: "power1.inOut" }, 0.72)
      // The closing line lands while the streams settle, then holds so it can be read.
      .from(
        resolutionSplit.lines,
        { yPercent: 115, stagger: 0.05, duration: 0.18, ease: "power3.out" },
        0.95,
      )
      .to({}, { duration: 0.45 });

    return () => {
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
          <div className="hero-core">
            <span className="hero-core-ring" aria-hidden="true" />
            <small>ONE</small> BUSINESS VIEW
          </div>
        </div>

        <div className="hero-top">
          <p className="kicker" data-intro>
            Information, made useful.
          </p>
          <span className="scroll-cue" data-intro>
            <i />
            Scroll to connect <ArrowDownRight />
          </span>
        </div>

        <h1 className="hero-title">
          Your business creates <em>data</em> every second.
        </h1>

        <div className="hero-bottom">
          <p className="hero-intro" data-intro>
            We turn that information into clearer decisions, smarter operations, and automated
            business processes.
          </p>
          <div className="hero-actions" data-intro>
            <StoryButton href="#transformation" icon={<ArrowDownRight />}>
              See how it works
            </StoryButton>
            <StoryButton href="#industries" variant="storyOutline">
              Explore the possibilities
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
