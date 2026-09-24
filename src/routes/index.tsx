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
import { useStoryMotion } from "@/animations/useStoryMotion";
import { useSmoothScroll } from "@/animations/smooth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuantumDataLytica — From Information to Action" },
      {
        name: "description",
        content:
          "Bring business information together, understand what matters, automate routine work, and make better decisions.",
      },
      { property: "og:title", content: "QuantumDataLytica — From Information to Action" },
      {
        property: "og:description",
        content:
          "Bring business information together and turn it into clearer decisions and meaningful action.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

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

function Index() {
  const root = useRef<HTMLElement>(null);
  useSmoothScroll();
  useStoryMotion(root);
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
        <Marquee words={signals} />
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
        <FinalCTA />
      </main>
    </>
  );
}
