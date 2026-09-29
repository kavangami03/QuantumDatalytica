import { useRef, type ReactNode } from "react";
import { gsap, useScene } from "@/animations/gsap";

export type FaqItem = {
  q: string;
  /** Plain answer: this exact text also goes into the FAQPage schema. */
  a: string;
  /** Optional visible version with links; must say the same thing as `a`. */
  render?: ReactNode;
};

/** JSON-LD for a FAQPage built from the same items the page shows. */
export function faqSchema(items: FaqItem[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

type FaqProps = {
  items: FaqItem[];
  chapter?: string;
  firstOpen?: boolean;
};

/**
 * Accordion on native <details>, so every answer is real HTML on page load.
 * Opening animates the height; with reduced motion it simply opens.
 */
export function Faq({ items, chapter, firstOpen = false }: FaqProps) {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, ({ reduce }, el) => {
    const rows = Array.from(el.querySelectorAll<HTMLDetailsElement>("details"));
    const cleanups = rows.map((row) => {
      const summary = row.querySelector("summary");
      const body = row.querySelector<HTMLElement>(".faq-answer");
      if (!summary || !body) return () => {};
      const toggle = (event: Event) => {
        if (reduce) return;
        event.preventDefault();
        if (row.open) {
          row.classList.remove("is-open");
          gsap.to(body, {
            height: 0,
            duration: 0.5,
            ease: "story",
            onComplete: () => {
              row.open = false;
              gsap.set(body, { clearProps: "height" });
            },
          });
        } else {
          row.open = true;
          row.classList.add("is-open");
          gsap.fromTo(body, { height: 0 }, { height: "auto", duration: 0.6, ease: "story" });
        }
      };
      if (row.open) row.classList.add("is-open");
      summary.addEventListener("click", toggle);
      return () => summary.removeEventListener("click", toggle);
    });
    if (!reduce) {
      gsap.from(rows, {
        y: 30,
        autoAlpha: 0,
        stagger: 0.07,
        duration: 1,
        scrollTrigger: { trigger: el.querySelector(".faq-list"), start: "top 80%", once: true },
      });
    }
    return () => cleanups.forEach((cleanup) => cleanup());
  });

  return (
    <section className="faq chapter" id="faq" ref={ref}>
      {chapter && (
        <div className="chapter-number">
          <span>{chapter}</span>
          <i data-rule />
        </div>
      )}
      <div className="faq-layout">
        <div className="faq-head">
          <h2 data-split>
            Questions,
            <br />
            <em>answered.</em>
          </h2>
        </div>
        <div className="faq-list">
          {items.map((item, index) => (
            <details key={item.q} open={firstOpen && index === 0}>
              <summary>
                <span className="faq-num">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.q}</h3>
                <span className="faq-icon" aria-hidden="true">
                  <i />
                  <i />
                </span>
              </summary>
              <div className="faq-answer">
                <p>{item.render ?? item.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
