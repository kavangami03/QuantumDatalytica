import { useRef, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { gsap, SplitText, useScene } from "@/animations/gsap";
import { DEMO_URL } from "@/components/story/Navigation";

export const CONTACT_EMAIL = "info@quantumdatalytica.com";
export const CONTACT_PHONE = "+1 (512) 733-3085";
export const CONTACT_PHONE_HREF = "tel:+15127333085";

type Link = { label: string; href: string };

const columns: Array<{ title: string; links: Link[] }> = [
  {
    title: "Platform",
    links: [
      { label: "Overview", href: "/" },
      { label: "Workflow Designer", href: "/platform/workflow-designer/" },
      { label: "Quantum Machines", href: "/platform/quantum-machines/" },
      { label: "Data Integration", href: "/platform/data-integration/" },
      { label: "Monitoring", href: "/platform/monitoring/" },
      { label: "Security", href: "/platform/security/" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Hospitality", href: "/solutions/hospitality/" },
      { label: "Healthcare", href: "/solutions/healthcare/" },
      { label: "Retail", href: "/solutions/retail/" },
      { label: "Financial Services", href: "/solutions/financial-services/" },
      { label: "Manufacturing", href: "/solutions/manufacturing/" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Templates Hub", href: "/templates/" },
      { label: "Integrations", href: "/integrations/" },
      { label: "Case Studies", href: "/case-studies/" },
      { label: "Blog", href: "/blog/" },
      { label: "Developer Hub", href: "/developer/" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about/" },
      { label: "Pricing", href: "/pricing/" },
      { label: "Contact", href: "/contact/" },
      { label: "Request a demo", href: DEMO_URL },
    ],
  },
];

/** Site-wide footer. The homepage adds its own "Navigate" column of in-page anchors. */
export function SiteFooter({ navigate, homeHref = "/" }: { navigate?: Link[]; homeHref?: string }) {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, ({ reduce }, el) => {
    if (reduce) return;
    const wordmark = el.querySelector<HTMLElement>(".footer-wordmark");
    if (!wordmark) return;
    const split = SplitText.create(wordmark, { type: "chars" });
    gsap.from(split.chars, {
      yPercent: 105,
      stagger: 0.03,
      duration: 1.4,
      scrollTrigger: { trigger: wordmark, start: "top 95%", once: true },
    });
    gsap.from(el.querySelectorAll(".footer-col"), {
      y: 24,
      autoAlpha: 0,
      stagger: 0.08,
      duration: 1,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
    return () => split.revert();
  });

  const all = navigate ? [{ title: "Navigate", links: navigate }, ...columns] : columns;

  return (
    <footer className="footer" ref={ref}>
      <div className="footer-grid" style={{ "--cols": all.length } as CSSProperties}>
        <div className="footer-brand">
          <a className="brand" href={homeHref} aria-label="QuantumDataLytica home">
            <img
              className="brand-logo brand-logo-footer"
              src="/brand/logo-on-dark.svg"
              alt="QuantumDataLytica"
              width={327}
              height={35}
            />
          </a>
          <p>Turning business information into meaningful action.</p>
          <div className="footer-contact">
            <a href={DEMO_URL} data-track="demo" className="footer-demo">
              Request a demo <ArrowUpRight />
            </a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE}</a>
            <span>LinkedIn</span>
          </div>
        </div>
        {all.map((column) => (
          <nav className="footer-col" key={column.title} aria-label={column.title}>
            <strong>{column.title}</strong>
            {column.links.map((link) => (
              <a key={link.href + link.label} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ))}
      </div>
      <p className="footer-wordmark" aria-hidden="true">
        QuantumDataLytica
      </p>
      <div className="footer-legal">
        <small>© 2026 QuantumDataLytica</small>
        <a href="/privacy-policy/">Privacy Policy</a>
        <a href="/terms-and-conditions/">Terms &amp; Conditions</a>
      </div>
    </footer>
  );
}
