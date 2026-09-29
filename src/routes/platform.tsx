import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Navigation, ProgressRail, type NavLink } from "@/components/story/Navigation";
import { Cursor } from "@/components/story/Cursor";
import { Marquee } from "@/components/story/Marquee";
import { Faq, faqSchema, type FaqItem } from "@/components/site/Faq";
import { SiteFooter } from "@/components/site/SiteFooter";
import {
  PlatformAutomation,
  PlatformCTA,
  PlatformDesigner,
  PlatformHow,
  PlatformIntegrations,
  PlatformMachines,
  PlatformMonitoring,
  PlatformPillars,
  PlatformHero,
  PlatformProof,
  PlatformTeams,
  PlatformTemplates,
  PlatformTrust,
  SHOW_PROOF,
} from "@/components/platform/PlatformSections";
import { organizationSchema, SITE_URL } from "@/lib/seo";
import { useCtaTracking } from "@/lib/analytics";
import { useStoryMotion } from "@/animations/useStoryMotion";
import { useSmoothScroll } from "@/animations/smooth";

const URL = `${SITE_URL}/platform/`;
const TITLE = "No-Code Data Pipeline Platform | QuantumDataLytica";
const DESCRIPTION =
  "Build no-code data pipelines on one platform. Connect your systems, automate routine data work, schedule and monitor every run — pay only for what you use.";

const faqs: FaqItem[] = [
  {
    q: "What is a no-code data pipeline?",
    a: "A no-code data pipeline moves data from where it is created to where it is used, cleaning and combining it along the way, without anyone writing code. In QuantumDataLytica you build it by dragging ready-made steps, called Quantum Machines, onto a visual canvas and connecting them.",
  },
  {
    q: "Do I need engineers to use QuantumDataLytica?",
    a: "No. Operations and business teams can build and run pipelines in the visual Workflow Designer. Data teams can add conditions, loops and nested workflows, and developers can build custom Quantum Machines in Python when a job needs something specific.",
  },
  {
    q: "How is QuantumDataLytica different from traditional ETL tools?",
    a: "Traditional ETL tools usually need specialist engineers, long set-up projects and fixed licences. QuantumDataLytica gives you ETL automation through a visual builder and reusable building blocks, with pay-as-you-go pricing, so teams can launch and change pipelines in days instead of months.",
    render: (
      <>
        Traditional ETL tools usually need specialist engineers, long set-up projects and fixed
        licences. QuantumDataLytica gives you ETL automation through a visual builder and reusable
        building blocks, with pay-as-you-go pricing, so teams can launch and change pipelines in
        days instead of months.{" "}
        <a href="/blog/quantumdatalytica-vs-traditional-etl-tools/">Read the full comparison</a>.
      </>
    ),
  },
  {
    q: "Is QuantumDataLytica a data orchestration platform?",
    a: "Yes. Beyond moving data, QuantumDataLytica orchestrates the order and timing of every step: pipelines can run on a schedule, on an event, or after another workflow finishes, and the platform monitors each run and alerts you if something fails.",
  },
  {
    q: "What can QuantumDataLytica connect to?",
    a: "QuantumDataLytica connects to databases, SaaS tools, cloud storage, files, and any system with an API or webhook. See the Integrations directory for the full list of supported connections.",
    render: (
      <>
        QuantumDataLytica connects to databases, SaaS tools, cloud storage, files, and any system
        with an API or webhook. See the <a href="/integrations/">Integrations directory</a> for the
        full list of supported connections.
      </>
    ),
  },
  {
    q: "What are Quantum Machines?",
    a: "Quantum Machines are reusable, self-contained data services. Each one does a single job, such as extracting, transforming, integrating, analysing or scoring data, and they snap together to form a pipeline. Developers can also build and publish their own.",
  },
  {
    q: "How does QuantumDataLytica pricing work?",
    a: "QuantumDataLytica is pay as you go. You pay only for the compute your pipelines use, so it scales from a single workflow to thousands of runs without an upfront licence.",
    render: (
      <>
        QuantumDataLytica is pay as you go. You pay only for the compute your pipelines use, so it
        scales from a single workflow to thousands of runs without an upfront licence.{" "}
        <a href="/pricing/">See pricing</a>.
      </>
    ),
  },
  {
    q: "Can data pipelines run automatically?",
    a: "Yes. Data pipeline automation is built in. Schedule pipelines by time, trigger them from events, chain them after other workflows, and use QuantumLoop to repeat steps across large batches of records or files.",
    render: (
      <>
        Yes. Data pipeline automation is built in. Schedule pipelines by time, trigger them from
        events, chain them after other workflows, and use QuantumLoop to repeat steps across large
        batches of records or files. Learn more in our{" "}
        <a href="/blog/data-pipeline-automation-guide/">data pipeline automation guide</a>.
      </>
    ),
  },
];

const schema = {
  "@context": "https://schema.org",
  "@graph": [
    organizationSchema,
    {
      "@type": "SoftwareApplication",
      "@id": `${URL}#software`,
      name: "QuantumDataLytica",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "No-code data pipeline platform",
      operatingSystem: "Web",
      url: URL,
      description:
        "A no-code data pipeline and data automation platform. Connect business systems, build pipelines visually with reusable Quantum Machines, and schedule and monitor every run.",
      offers: {
        "@type": "Offer",
        description: "Pay-as-you-go pricing based on compute used",
        url: `${SITE_URL}/pricing/`,
      },
      featureList: [
        "Visual Workflow Designer",
        "Reusable Quantum Machines",
        "Scheduling and event triggers",
        "QuantumLoop batch processing",
        "Nested workflows",
        "Real-time monitoring and alerts",
        "Integrations with databases, SaaS tools, cloud storage and APIs",
        "Templates Hub",
      ],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Platform", item: URL },
      ],
    },
    faqSchema(faqs),
  ],
};

export const Route = createFileRoute("/platform")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content:
          "Connect every system, build pipelines visually and let routine data work run on its own.",
      },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(schema) }],
  }),
  component: PlatformPage,
});

const links: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Platform", href: "#platform", active: true },
  { label: "How it works", href: "#how" },
  { label: "Machines", href: "#machines" },
  { label: "Integrations", href: "#integrations" },
  { label: "FAQ", href: "#faq" },
];

function PlatformPage() {
  const root = useRef<HTMLElement>(null);
  useSmoothScroll();
  useStoryMotion(root);
  useCtaTracking();
  const faqChapter = SHOW_PROOF ? "12" : "11";
  const ctaChapter = SHOW_PROOF ? "13" : "12";
  return (
    <>
      <Cursor />
      <div className="grain" aria-hidden="true" />
      <main ref={root} className="platform-page">
        <a className="skip-link" href="#platform">
          Skip to content
        </a>
        <Navigation links={links} homeHref="/" ctaLabel="Request a demo" />
        <ProgressRail total={ctaChapter} />
        <PlatformHero />
        <Marquee words={["Connect", "Transform", "Automate", "Schedule", "Monitor", "Scale"]} />
        <PlatformPillars />
        <PlatformHow />
        <PlatformDesigner />
        <PlatformMachines />
        <PlatformAutomation />
        <PlatformMonitoring />
        <PlatformIntegrations />
        <PlatformTemplates />
        <PlatformProof />
        <PlatformTeams />
        <PlatformTrust />
        <Faq items={faqs} chapter={`${faqChapter} / FAQ`} firstOpen />
        <PlatformCTA chapter={ctaChapter} />
        <SiteFooter />
      </main>
    </>
  );
}
