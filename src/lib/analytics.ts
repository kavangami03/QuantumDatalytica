import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Reports every click on an element marked data-track (e.g. each "Book a demo"
 * button) to GA4 as `cta_click`. Safe no-op until the GA4 tag is installed.
 */
export function useCtaTracking() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (!el) return;
      const detail = {
        cta: el.dataset["track"],
        label: el.textContent?.trim().slice(0, 60),
        href: el.getAttribute("href"),
        page: window.location.pathname,
      };
      if (typeof window.gtag === "function") window.gtag("event", "cta_click", detail);
      else window.dataLayer?.push({ event: "cta_click", ...detail });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
}
