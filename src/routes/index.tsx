import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Navigation, ProgressRail } from "@/components/story/Navigation";
import { HeroScene } from "@/components/story/HeroScene";
import { ConnectionScene, ProblemScene, TransformationScene } from "@/components/story/CoreStory";
import { AutomationScene, Outcomes, QuestionTrail } from "@/components/story/Outcomes";
import { BeforeAfter, IndustryExplorer } from "@/components/story/IndustryExplorer";
import { BusinessImpact, Ecosystem, FinalCTA, UseCases } from "@/components/story/ImpactAndFooter";
import { Preloader } from "@/components/story/Preloader";
import { Cursor } from "@/components/story/Cursor";
import { Marquee } from "@/components/story/Marquee";
import { Faq, faqSchema, type FaqItem } from "@/components/site/Faq";
import { organizationSchema, SITE_URL } from "@/lib/seo";
import { useCtaTracking } from "@/lib/analytics";
import { useStoryMotion } from "@/animations/useStoryMotion";
import { useSmoothScroll } from "@/animations/smooth";

const TITLE = "Unified Data Platform for Clear Decisions | QuantumDataLytica";
const DESCRIPTION =
  "Bring every branch, report and system into one place. QuantumDataLytica automates routine work and turns business data into faster, clearer decisions.";

const faqs: FaqItem[] = [
  {
    q: "What does QuantumDataLytica do?",
    a: "QuantumDataLytica is a unified data platform for multi-branch businesses. It brings your reports, documents and systems into one place, automates routine reporting, and turns it all into clear decisions.",
  },
  {
    q: "Do we need a technical team?",
    a: "No. QuantumDataLytica runs no-code data pipeline automation behind the scenes, so information is collected, cleaned and combined automatically. Your team just gets the answers.",
  },
  {
    q: "How is it different from a dashboard?",
    a: "A dashboard shows what happened. QuantumDataLytica also explains why and points to what needs attention next, making data-driven decision making part of everyday work.",
  },
  {
    q: "What information can we bring in?",
    a: "Branch and sales reports, spreadsheets, documents, handover notes, and customer, finance and booking data. Together they become a single source of truth for every team.",
  },
  {
    q: "Which industries do you serve?",
    a: "Hospitality leads, from hotel data analytics to multi-property reporting. We also support healthcare, retail, financial services and manufacturing businesses.",
  },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "QuantumDataLytica — From Information to Action" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: `${SITE_URL}/` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "QuantumDataLytica — From Information to Action" },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [organizationSchema, faqSchema(faqs)],
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const root = useRef<HTMLElement>(null);
  useSmoothScroll();
  useStoryMotion(root);
  useCtaTracking();
  return (
    <>
      <Preloader />
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <main ref={root}>
        <a className="skip-link" href="#problem">
          Skip to main story
        </a>
        <Navigation />
        <ProgressRail />
        <HeroScene />
        <Marquee words={["From scattered information to meaningful action."]} />
        <ProblemScene />
        <ConnectionScene />
        <TransformationScene />
        <Outcomes />
        <AutomationScene />
        <QuestionTrail />
        <IndustryExplorer />
        <BeforeAfter />
        <BusinessImpact />
        <UseCases />
        <Ecosystem />
        <FinalCTA>
          <Faq items={faqs} />
        </FinalCTA>
      </main>
    </>
  );
}
