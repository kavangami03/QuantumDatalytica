import { useRef } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { gsap, ScrollTrigger, SplitText, useScene } from "@/animations/gsap";
import {
  flowState,
  motions,
  type ParticleField,
  rainState,
  sampleText,
  shapes,
  spokesState,
  type StateDef,
  type Vec,
} from "@/components/story/particles";
import { labelsIn, mountField, ParticleStage, PLabel } from "@/components/story/ParticleStage";
import { StoryButton } from "@/components/story/StoryButton";
import { DEMO_URL } from "@/components/story/Navigation";
import { MetaphorCard, useFlowWires, useMetaphorCards } from "./visuals";
import {
  iconsState,
  industryState,
  shieldState,
  stationsState,
} from "@/components/story/connection-shapes";
import { forecastLine, selfBuildingReport } from "@/components/story/metaphors";
import { dotGrid, fitState, pulseLine, railScatter, syncChain, textMark } from "./platform-shapes";

/** Client approval to name Hotel Switchboard is still open (handoff §9); keep hidden until confirmed. */
export const SHOW_PROOF = false;

function Chapter({ n, label }: { n: string; label: string }) {
  return (
    <div className="chapter-number">
      <span>
        {n} / {label}
      </span>
      <i data-rule />
    </div>
  );
}

/* ─────────────── P01 · Hero ─────────────── */

const sources = ["CRM", "Bookings", "Spreadsheets", "Database"];
const machines = ["Extract", "Clean", "Merge", "Analyse"];
const delivered = ["Dashboard", "Daily report", "Team alert"];
const heroEdges: Array<[string, string]> = [
  ...sources.map((_, i) => [`s${i}`, "m0"] as [string, string]),
  ["m0", "m1"],
  ["m1", "m2"],
  ["m2", "m3"],
  ...delivered.map((_, i) => ["m3", `d${i}`] as [string, string]),
];

/**
 * Platform hero: a river of data runs across the whole screen and narrows into
 * a live pipeline card, where each machine lights up in turn and the result
 * comes out the other side.
 */
export function PlatformHero() {
  const ref = useRef<HTMLElement>(null);
  const diagram = useRef<HTMLDivElement>(null);
  useFlowWires(diagram, heroEdges, { dots: 2, speed: 1.6 });

  useScene(ref, (conditions, el) => {
    const field = mountField(
      el.querySelector(".pf-hero-field"),
      ({ desktop }) => ({
        count: desktop ? 700 : 350,
        theme: "dark",
        glow: 0,
        bright: true,
        radius: [0.22, 0.42],
        pointer: 0.2,
        accentRatio: 0.45,
        seed: 404,
        states: [
          {
            ...flowState({
              lanes: 5,
              spread: 0.45,
              from: desktop ? -0.9 : -2.4,
              to: desktop ? 0.25 : 2.4,
              converge: true,
              speed: 0.00007,
              y: desktop ? 0.05 : 0.6,
            }),
            trail: 0.3,
          },
        ],
      }),
      conditions,
    );
    if (conditions.reduce) return () => field?.destroy();

    // The machines light up one after another, as if the pipeline is running.
    const steps = gsap.utils.toArray<HTMLElement>(".pipe-machine", el);
    let current = 0;
    const timer = window.setInterval(() => {
      steps.forEach((step, index) => step.classList.toggle("is-running", index === current));
      current = (current + 1) % steps.length;
    }, 900);

    gsap
      .timeline({ delay: 0.2 })
      .from(el.querySelectorAll("[data-hero-in]"), {
        y: 28,
        autoAlpha: 0,
        stagger: 0.08,
        duration: 1.1,
        ease: "storyOut",
      })
      .from(
        el.querySelector(".pipe"),
        { x: 60, autoAlpha: 0, scale: 0.96, duration: 1.4, ease: "storyOut" },
        0.25,
      );
    return () => {
      window.clearInterval(timer);
      field?.destroy();
    };
  });

  return (
    <section className="pf-hero pf-hero-v2" id="top" ref={ref}>
      <ParticleStage className="pf-hero-field" />
      <div className="pf-hero-grid">
        <div className="pf-hero-copy">
          <nav className="breadcrumb" aria-label="Breadcrumb" data-hero-in>
            <a href="/">Home</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Platform</span>
          </nav>
          <h1 data-split>
            The no-code data pipeline platform that <em>keeps your business moving.</em>
          </h1>
          <p className="pf-hero-intro" data-hero-in>
            Connect every system you use, shape the data visually, and let routine data work run on
            schedule. No code, no long IT project, and nothing to install.
          </p>
          <div className="hero-actions" data-hero-in>
            <StoryButton href={DEMO_URL} icon={<ArrowUpRight />} track="demo">
              Request a demo
            </StoryButton>
            <StoryButton href="#how" variant="storyOutline" icon={<ArrowDownRight />}>
              See how it works
            </StoryButton>
          </div>
          <ul className="pf-chips" data-hero-in>
            {[
              "Visual builder",
              "Reusable machines",
              "Scheduling",
              "Live monitoring",
              "Pay as you go",
            ].map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <figure
          className="pipe"
          aria-label="Illustrative pipeline: CRM, bookings, spreadsheets and a database flow through Extract, Clean, Merge and Analyse into a dashboard, a daily report and a team alert."
        >
          <header className="pipe-head">
            <span>Pipeline · Nightly revenue view</span>
            <span className="pipe-status">
              <i aria-hidden="true" />
              Running
            </span>
          </header>
          <div className="pipe-body" ref={diagram}>
            <svg className="flow-wires" aria-hidden="true" />
            <div className="pipe-col">
              <small>Sources</small>
              {sources.map((source, i) => (
                <div className="pipe-node" data-node={`s${i}`} key={source}>
                  <b>0{i + 1}</b>
                  {source}
                </div>
              ))}
            </div>
            <div className="pipe-col pipe-col-machines">
              <small>Machines</small>
              {machines.map((machine, i) => (
                <div className="pipe-node pipe-machine" data-node={`m${i}`} key={machine}>
                  <b>M{i + 1}</b>
                  {machine}
                </div>
              ))}
            </div>
            <div className="pipe-col">
              <small>Delivered</small>
              {delivered.map((out, i) => (
                <div className="pipe-node pipe-out" data-node={`d${i}`} key={out}>
                  <b aria-hidden="true">→</b>
                  {out}
                </div>
              ))}
            </div>
          </div>
          <footer className="pipe-foot">
            <span>Schedule · 02:00 daily</span>
            <span>Last run · 41s · no errors</span>
          </footer>
        </figure>
      </div>
    </section>
  );
}

/* ─────────────── P02 · 01 / The platform ─────────────── */

export function PlatformPillars() {
  const ref = useRef<HTMLElement>(null);
  useMetaphorCards(ref);
  return (
    <section className="pf-pillars chapter" id="platform" ref={ref} data-chapter="01">
      <Chapter n="01" label="The platform" />
      <div className="split-heading">
        <h2 data-split>
          One platform. <em>Every step</em> from raw data to action.
        </h2>
        <p data-reveal>
          Most businesses hold their data together with scripts, spreadsheets and separate tools.
          QuantumDataLytica replaces all of that with one data automation platform, where every
          pipeline is built, run and watched in the same place.
        </p>
      </div>
      <div className="mcard-grid mcard-grid-4">
        <MetaphorCard
          metaphor="graph"
          index="01"
          kicker="Build"
          title="Workflow Designer"
          href="/platform/workflow-designer/"
          linkLabel="Explore the designer"
        >
          A drag-and-drop canvas for building data pipelines. Anyone on the team can see how the
          data moves.
        </MetaphorCard>
        <MetaphorCard
          metaphor="lanes"
          index="02"
          kicker="Assemble"
          title="Quantum Machines"
          href="/platform/quantum-machines/"
          linkLabel="Meet the machines"
        >
          Ready-made, reusable steps that extract, clean, merge and analyse data. Snap them
          together; no code needed.
        </MetaphorCard>
        <MetaphorCard
          metaphor="clock"
          index="03"
          kicker="Automate"
          title="Scheduling & Automation"
          href="/platform/scheduling/"
          linkLabel="See scheduling"
        >
          Run pipelines on a timetable, on an event, or right after another workflow finishes.
        </MetaphorCard>
        <MetaphorCard
          metaphor="bars"
          index="04"
          kicker="Watch"
          title="Real-Time Monitoring"
          href="/platform/monitoring/"
          linkLabel="View monitoring"
        >
          See every run as it happens, and get alerted the moment something needs attention.
        </MetaphorCard>
      </div>
      <div className="pf-also" data-reveal>
        <span className="kicker">Also inside</span>
        <ul>
          {[
            ["Data Integration", "/platform/data-integration/"],
            ["QuantumLoop", "/platform/quantumloop/"],
            ["Nested Workflows", "/platform/nested-workflows/"],
            ["Security & Compliance", "/platform/security/"],
            ["Templates Hub", "/templates/"],
          ].map(([label, href]) => (
            <li key={label}>
              <a href={href}>{label}</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ─────────────── P03 · 02 / How it works ─────────────── */

const howSteps = [
  [
    "01",
    "Connect",
    "Link the systems you already use: databases, SaaS tools, cloud storage, files and APIs.",
  ],
  [
    "02",
    "Build",
    "Drag Quantum Machines onto the canvas and join them into a flow. Filter, clean, merge and enrich your data visually.",
  ],
  [
    "03",
    "Automate",
    "Run it on a schedule, on an event, or after another workflow. Loop through large batches without extra work.",
  ],
  [
    "04",
    "Monitor",
    "Watch every run live. If something fails, you’re alerted right away and can see exactly which step failed.",
  ],
];

export function PlatformHow() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    // A rail above the four steps: loose data sweeps into one stream that runs
    // through a station over each step, lighting the steps as it arrives.
    const scatter = railScatter();
    const field = mountField(
      el.querySelector(".pf-how-rail"),
      () => ({
        count: 1500,
        theme: "dark",
        bright: true,
        glow: 0.1,
        size: 1.1,
        radius: [0.147, 10],
        accentRatio: 0.45,
        seed: 88,
        states: [scatter.state, stationsState([-2.55, -0.85, 0.85, 2.55], { from: -3.4, to: 3.4 })],
        localMorph: (i, morph) => {
          const k = Math.min(Math.max(morph * 1.5 - scatter.xAt(i) * 0.5, 0), 1);
          return k * k * (3 - 2 * k);
        },
      }),
      conditions,
    );
    const steps = gsap.utils.toArray<HTMLElement>(".pf-step", el);
    if (conditions.reduce) {
      if (field) field.morph = 1;
      steps.forEach((step) => step.classList.add("is-lit"));
      return () => field?.destroy();
    }
    const progress = { value: 0 };
    const bars = gsap.utils.toArray<HTMLElement>(".pf-step-bar i", el);
    gsap.to(progress, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: el.querySelector(".pf-steps"),
        start: "top 85%",
        end: "bottom 45%",
        scrub: 1,
      },
      onUpdate: () => {
        const v = progress.value;
        if (field) field.morph = Math.min(v * 1.15, 0.999);
        steps.forEach((step, k) => step.classList.toggle("is-lit", v > (k + 0.6) / 4.4));
        bars.forEach((bar, k) => {
          const fill = Math.min(Math.max(v * 4.4 - k - 0.2, 0), 1);
          bar.style.transform = `scaleX(${fill})`;
        });
      },
    });
    gsap.from(el.querySelectorAll(".pf-step"), {
      y: 40,
      autoAlpha: 0,
      stagger: 0.12,
      duration: 1,
      scrollTrigger: { trigger: el.querySelector(".pf-steps"), start: "top 80%", once: true },
    });
    return () => field?.destroy();
  });

  return (
    <section className="pf-how chapter on-dark" id="how" ref={ref} data-chapter="02">
      <Chapter n="02" label="How it works" />
      <div className="split-heading">
        <h2 data-split>
          From scattered sources to an <em>automated data pipeline</em> in four steps.
        </h2>
        <p data-reveal>
          No tickets to engineering and no months-long implementation. Here is how a pipeline gets
          from idea to running.
        </p>
      </div>
      <ParticleStage className="pf-how-rail" />
      <ol className="pf-steps">
        {howSteps.map(([n, title, text]) => (
          <li className="pf-step" key={n}>
            <span className="pf-step-num">{n}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="pf-step-bar" aria-hidden="true">
              <i />
            </span>
          </li>
        ))}
      </ol>
      <p className="pf-statement" data-fill>
        Clean data, on time, <em>where decisions get made.</em>
      </p>
    </section>
  );
}

/* ─────────────── P04 · 03 / Workflow Designer ─────────────── */

const designerEdges: Array<[string, string]> = [
  ["reviews", "score"],
  ["booking", "score"],
  ["score", "alert"],
  ["score", "report"],
];

export function PlatformDesigner() {
  const ref = useRef<HTMLElement>(null);
  const board = useRef<HTMLDivElement>(null);
  useFlowWires(board, designerEdges, { dots: 3, speed: 1.9 });

  // The canvas itself is alive: a ripple of light runs through its dot grid.
  useScene(ref, (conditions, el) => {
    const field = mountField(
      el.querySelector(".dz-grid"),
      () => ({
        count: 34 * 16,
        theme: "dark",
        size: 1.15,
        radius: [0.5, 0.5],
        accentRatio: 0.18,
        seed: 31,
        states: [dotGrid()],
      }),
      conditions,
    );
    return () => field?.destroy();
  });

  useScene(ref, ({ reduce }, el) => {
    if (reduce) return;
    gsap.from(el.querySelectorAll(".dz-node"), {
      scale: 0.6,
      autoAlpha: 0,
      stagger: 0.12,
      duration: 0.9,
      ease: "back.out(1.8)",
      scrollTrigger: { trigger: el.querySelector(".dz"), start: "top 75%", once: true },
    });
    gsap.from(el.querySelectorAll(".pf-bullets li"), {
      x: -20,
      autoAlpha: 0,
      stagger: 0.08,
      scrollTrigger: { trigger: el.querySelector(".pf-bullets"), start: "top 85%", once: true },
    });
  });

  return (
    <section className="pf-designer chapter" id="designer" ref={ref} data-chapter="03">
      <Chapter n="03" label="Workflow Designer" />
      <div className="pf-split">
        <div className="pf-split-copy">
          <p className="kicker" data-reveal>
            Build visually
          </p>
          <h2 data-split>
            A visual data pipeline builder <em>your whole team can read.</em>
          </h2>
          <p className="section-lead" data-reveal>
            The Workflow Designer is a drag-and-drop canvas. Each block is a step and each line is
            data moving between steps. Operations leads can follow the logic, and data teams can go
            further with conditions, loops and reusable sub-workflows.
          </p>
          <ul className="pf-bullets">
            <li>Drag-and-drop canvas, no code to write</li>
            <li>Conditional branches for “if this, then that” logic</li>
            <li>Loops over large batches with QuantumLoop</li>
            <li>Workflows inside workflows for complex jobs</li>
          </ul>
          <a className="text-link" href="/platform/workflow-designer/" data-reveal>
            Explore the Workflow Designer <span aria-hidden="true">→</span>
          </a>
        </div>
        <figure
          className="dz"
          aria-label="Illustrative Workflow Designer canvas: review sites and the booking system feed a sentiment score, which alerts the general manager and builds a weekly report."
        >
          <header className="dz-bar">
            <span className="dz-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>Guest review insights</span>
            <span className="dz-saved">Saved</span>
          </header>
          <div className="dz-board" ref={board}>
            <ParticleStage className="dz-grid" />
            <svg className="flow-wires" aria-hidden="true" />
            <div className="dz-col">
              <div className="dz-node" data-node="reviews">
                <small>Source</small>Review sites
              </div>
              <div className="dz-node" data-node="booking">
                <small>Source</small>Booking system
              </div>
            </div>
            <div className="dz-col">
              <div className="dz-node dz-node-accent" data-node="score">
                <small>Machine</small>Sentiment score
              </div>
            </div>
            <div className="dz-col">
              <div className="dz-node" data-node="alert">
                <small>Action</small>Alert GM
              </div>
              <div className="dz-node" data-node="report">
                <small>Action</small>Weekly report
              </div>
            </div>
          </div>
        </figure>
      </div>
    </section>
  );
}

/* ─────────────── P05 · 04 / Quantum Machines ─────────────── */

export function PlatformMachines() {
  const ref = useRef<HTMLElement>(null);
  useMetaphorCards(ref);
  return (
    <section className="pf-machines chapter on-dark" id="machines" ref={ref} data-chapter="04">
      <Chapter n="04" label="Quantum Machines" />
      <div className="split-heading">
        <h2 data-split>
          Building blocks, <em>not code.</em>
        </h2>
        <p data-reveal>
          Quantum Machines are ready-made, reusable data services. Each one does a single job well.
          Snap them together and your pipeline is built. Use the same machine in many workflows, and
          swap one out without rebuilding the rest.
        </p>
      </div>
      <div className="mcard-grid mcard-grid-3">
        <MetaphorCard metaphor="hub" index="01" kicker="Extract" title="Pull data in">
          Collect records from databases, apps, files and websites on a schedule.
        </MetaphorCard>
        <MetaphorCard metaphor="hourglass" index="02" kicker="Transform" title="Clean & shape">
          Fix formats, remove duplicates and standardise fields so every number matches.
        </MetaphorCard>
        <MetaphorCard metaphor="orbit" index="03" kicker="Integrate" title="Join the pieces">
          Merge data from different systems into one consistent view of the business.
        </MetaphorCard>
        <MetaphorCard metaphor="bars" index="04" kicker="Analyse" title="Find what matters">
          Calculate trends, scores and summaries that are ready for a report or dashboard.
        </MetaphorCard>
        <MetaphorCard metaphor="forecast" index="05" kicker="Predict" title="Look ahead">
          Run machine-learning models inside the pipeline to forecast demand and flag what’s
          unusual.
        </MetaphorCard>
        <MetaphorCard
          index="06"
          kicker="Developer Hub"
          title="Build your own →"
          href="/developer/"
          className="mcard-accent"
        >
          Developers can build custom machines in Python with the Quantum CLI and publish them for
          any team to use.
        </MetaphorCard>
      </div>
      <a className="text-link pf-after-link" href="/platform/quantum-machines/" data-reveal>
        How Quantum Machines work <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

/* ─────────────── P06 · 05 / Automation ─────────────── */

export function PlatformAutomation() {
  const ref = useRef<HTMLElement>(null);
  useMetaphorCards(ref);
  return (
    <section className="pf-automation chapter" id="automation" ref={ref} data-chapter="05">
      <Chapter n="05" label="Automation" />
      <div className="split-heading">
        <h2 data-split>
          Set it once. <em>It keeps running.</em>
        </h2>
        <p data-reveal>
          Data workflow automation built into the platform, not bolted on. Three ways to take
          routine data work off your team’s plate.
        </p>
      </div>
      <div className="mcard-grid mcard-grid-3">
        <MetaphorCard
          metaphor="clock"
          index="01"
          kicker="Scheduling"
          title="Runs by the clock or by the event"
          href="/platform/scheduling/"
          linkLabel="Scheduling"
        >
          Trigger pipelines on a timetable, when new data arrives, or when another job completes.
          Your reports are ready before the morning meeting.
        </MetaphorCard>
        <MetaphorCard
          metaphor="torus"
          index="02"
          kicker="QuantumLoop"
          title="Repeat at scale, build once"
          href="/platform/quantumloop/"
          linkLabel="QuantumLoop"
        >
          Apply the same steps to thousands of records, files or locations without copying a single
          block.
        </MetaphorCard>
        <MetaphorCard
          metaphor="nested"
          index="03"
          kicker="Nested workflows"
          title="Reuse what already works"
          href="/platform/nested-workflows/"
          linkLabel="Nested workflows"
        >
          Package a proven workflow and drop it inside others. Complex pipelines stay modular and
          easy to maintain.
        </MetaphorCard>
      </div>
      <p className="pf-statement" data-fill>
        ETL automation, <em>without the ETL project.</em>
      </p>
    </section>
  );
}

/* ─────────────── P07 · 06 / Monitoring ─────────────── */

const runs = [
  { name: "Nightly revenue view", state: "ok", label: "OK" },
  { name: "Guest review sentiment", state: "ok", label: "OK" },
  { name: "Rate shopping · 120 properties", state: "running", label: "Running", loop: true },
  { name: "Inventory sync", state: "retry", label: "Retrying" },
  { name: "Weekly branch report", state: "queued", label: "Queued" },
] as const;

export function PlatformMonitoring() {
  const ref = useRef<HTMLElement>(null);

  // A heartbeat of pipeline activity across the top of the run log.
  useScene(ref, (conditions, el) => {
    const field = mountField(
      el.querySelector(".runlog-pulse"),
      () => ({
        count: 900,
        theme: "dark",
        glow: 0.14,
        size: 1.1,
        radius: [1 / 6.4, 10],
        accentRatio: 0.55,
        seed: 61,
        states: [pulseLine({ width: 3.2, amp: 0.3, period: 2.1 })],
      }),
      conditions,
    );
    return () => field?.destroy();
  });

  useScene(ref, ({ reduce }, el) => {
    const count = el.querySelector<HTMLElement>("[data-loop-count]");
    const bar = el.querySelector<HTMLElement>(".run-progress i");
    if (reduce || !count || !bar) return;
    const state = { n: 0 };
    gsap
      .timeline({
        scrollTrigger: { trigger: el.querySelector(".runlog"), start: "top 75%", once: true },
      })
      .from(el.querySelectorAll(".run"), { x: -30, autoAlpha: 0, stagger: 0.1, duration: 0.8 })
      .to(
        state,
        {
          n: 84,
          duration: 2.2,
          ease: "power2.out",
          onUpdate: () => {
            count.textContent = String(Math.round(state.n));
            bar.style.transform = `scaleX(${state.n / 120})`;
          },
        },
        0.3,
      )
      .from(el.querySelector(".run-alert"), { y: 24, autoAlpha: 0, duration: 0.8 }, 1.4);
  });

  return (
    <section className="pf-monitoring chapter on-dark" id="monitoring" ref={ref} data-chapter="06">
      <Chapter n="06" label="Monitoring" />
      <div className="pf-split pf-split-reverse">
        <figure
          className="runlog"
          aria-label="Illustrative run log of five pipelines and an alert."
        >
          <header className="runlog-head">
            <span>Runs · today</span>
            <span className="runlog-live">
              <i aria-hidden="true" />
              Live
            </span>
          </header>
          <ParticleStage className="runlog-pulse" />
          <ul>
            {runs.map((run) => (
              <li className={`run run-${run.state}`} key={run.name}>
                <span className="run-dot" aria-hidden="true" />
                <span className="run-name">
                  {run.name}
                  {"loop" in run && (
                    <span className="run-loop">
                      QuantumLoop <b data-loop-count>84</b>/120
                      <span className="run-progress" aria-hidden="true">
                        <i />
                      </span>
                    </span>
                  )}
                </span>
                <span className="run-state">{run.label}</span>
              </li>
            ))}
          </ul>
          <div className="run-alert" role="note">
            <span className="run-alert-icon" aria-hidden="true">
              !
            </span>
            <span>
              <strong>Inventory sync is retrying.</strong> The right person has been alerted before
              the number reaches a report.
            </span>
          </div>
        </figure>
        <div className="pf-split-copy">
          <p className="kicker" data-reveal>
            Real-time monitoring
          </p>
          <h2 data-split>
            See every run. <em>Catch every failure.</em>
          </h2>
          <p className="section-lead" data-reveal>
            One screen shows what has run, what is running and what needs attention. Alerts reach
            the right person before a wrong number reaches a report.
          </p>
          <ul className="pf-bullets">
            <li>Live status for every pipeline and step</li>
            <li>Instant alerts when a run fails or slows down</li>
            <li>Run history to see what changed and when</li>
          </ul>
          <a className="text-link" href="/platform/monitoring/" data-reveal>
            Explore real-time monitoring <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── P08 · 07 / Integrations ─────────────── */

const integrations = [
  [
    "01",
    "Databases",
    "Read from and write to the databases behind your operations.",
    "/integrations/databases/",
  ],
  [
    "02",
    "SaaS tools",
    "CRM, marketing, finance and booking platforms your teams use every day.",
    "/integrations/saas-tools/",
  ],
  [
    "03",
    "Cloud storage",
    "Pick up and drop off files in the cloud automatically.",
    "/integrations/cloud-storage/",
  ],
  [
    "04",
    "APIs & webhooks",
    "Connect any system with an API, and trigger pipelines from events.",
    "/integrations/apis-webhooks/",
  ],
  [
    "05",
    "Files & sheets",
    "Spreadsheets and exports come in and are cleaned automatically.",
    "/platform/data-integration/",
  ],
] as const;
const integrationNodes: Vec[] = [
  [-1.75, -0.62, 0.2],
  [1.7, -0.62, -0.2],
  [2.05, 0.5, 0.2],
  [0, 0.95, -0.2],
  [-2.05, 0.5, -0.2],
];

export function PlatformIntegrations() {
  const ref = useRef<HTMLElement>(null);

  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".pf-int-stage");
    const labels = labelsIn(stage);
    const field = mountField(
      stage,
      ({ desktop }) => ({
        count: desktop ? 2600 : 1100,
        theme: "dark",
        glow: 0.13,
        radius: [0.2, 0.4],
        pointer: 0.3,
        tilt: 0.06,
        seed: 57,
        states: [
          { shape: shapes.nebula(1.8, 1, 0.9), motion: motions.swirl(0.0003, 0.02) },
          spokesState(integrationNodes, { speed: 0.00011 }),
        ],
        anchors: [
          ...labels
            .slice(0, 5)
            .map((label, i) => ({ el: label, at: [null, integrationNodes[i] ?? null] })),
          ...(labels[5] ? [{ el: labels[5], at: [null, [0, 0.62, 0] as Vec] }] : []),
        ],
      }),
      conditions,
    );
    if (!field || conditions.reduce) return () => field?.destroy();
    field.morph = 0;
    ScrollTrigger.create({
      trigger: stage,
      start: "top 70%",
      once: true,
      onEnter: () => void gsap.to(field, { morph: 1, duration: 2.2, ease: "power2.inOut" }),
    });
    gsap.from(el.querySelectorAll(".pf-rows li"), {
      y: 30,
      autoAlpha: 0,
      stagger: 0.08,
      scrollTrigger: { trigger: el.querySelector(".pf-rows"), start: "top 85%", once: true },
    });
    return () => field.destroy();
  });

  return (
    <section className="pf-integrations chapter" id="integrations" ref={ref} data-chapter="07">
      <Chapter n="07" label="Integrations" />
      <div className="split-heading">
        <h2 data-split>
          Connect the tools <em>you already run on.</em>
        </h2>
        <p data-reveal>
          Keep the systems your teams rely on. QuantumDataLytica connects to them and moves the data
          where it’s needed.
        </p>
      </div>
      <div className="pf-int-bleed">
        <ParticleStage
          className="pf-int-stage p-panel"
          label="Databases, SaaS tools, cloud storage, APIs and files connected to QuantumDataLytica"
        >
          {integrations.map(([n, title]) => (
            <PLabel key={n} index={Number(n) - 1} title={title} />
          ))}
          <PLabel title="QUANTUMDATALYTICA" variant="center" />
        </ParticleStage>
      </div>
      <ul className="pf-rows">
        {integrations.map(([n, title, text, href]) => (
          <li key={n}>
            <a href={href}>
              <span className="pf-row-num">{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
              <ArrowUpRight className="pf-row-arrow" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
      <a className="text-link pf-after-link" href="/integrations/" data-reveal>
        See all integrations <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

/* ─────────────── P09 · 08 / Templates ─────────────── */

const templates = [
  [
    "01",
    "Hotel Rate Intelligence",
    "Track competitor rates automatically, every day.",
    "Hospitality",
    "/templates/hotel-rate-intelligence/",
  ],
  [
    "02",
    "Hotel Sentiment Analysis",
    "Score guest reviews across sites and spot trends.",
    "Hospitality",
    "/templates/hotel-sentiment-analysis/",
  ],
  [
    "03",
    "Clinical Data Pipeline",
    "Bring trial data together, clean and ready to review.",
    "Healthcare",
    "/templates/clinical-data-pipeline/",
  ],
  [
    "04",
    "HubSpot → Airtable → Gmail Sync",
    "Keep CRM, tracker and inbox in step without copy-paste.",
    "Sales & Ops",
    "/templates/hubspot-airtable-sync/",
  ],
] as const;

/** One particle picture per template, in the same order as `templates`. */
const templateShapes: Array<() => StateDef> = [
  forecastLine,
  () =>
    iconsState(
      [
        [-0.95, -0.3, 0.1],
        [0.15, 0.3, -0.1],
        [1, -0.35, 0.1],
      ],
      ["chat", "chat", "chat"],
      1.55,
    ),
  () => pulseLine({ width: 1.7, amp: 0.55, period: 1.7 }),
  syncChain,
];

export function PlatformTemplates() {
  const ref = useRef<HTMLElement>(null);
  useScene(ref, (conditions, el) => {
    const rows = gsap.utils.toArray<HTMLElement>(".pf-rows-templates li", el);
    const title = el.querySelector<HTMLElement>("[data-tpl-title]");
    const tag = el.querySelector<HTMLElement>("[data-tpl-tag]");
    const field: ParticleField | null = mountField(
      el.querySelector(".tpl-stage"),
      () => ({
        count: 1100,
        theme: "dark",
        bright: true,
        glow: 0.12,
        size: 1.2,
        radius: [0.3, 0.4],
        accentRatio: 0.45,
        seed: 77,
        states: [templateShapes[0]!()],
      }),
      conditions,
    );
    let active = 0;
    const show = (index: number) => {
      if (index === active) return;
      active = index;
      rows.forEach((row, k) => row.classList.toggle("is-active", k === index));
      const [, name, , label] = templates[index] ?? templates[0];
      if (title) title.textContent = name;
      if (tag) tag.textContent = label;
      if (!field) return;
      field.retarget(templateShapes[index]!());
      if (conditions.reduce) field.morph = 1;
      else gsap.to(field, { morph: 1, duration: 1.3, ease: "power2.inOut", overwrite: true });
    };
    rows[0]?.classList.add("is-active");

    // Cycle on its own; a hover or focus takes over and holds for a while.
    let hold = 0;
    const timer = conditions.reduce
      ? 0
      : window.setInterval(() => {
          if (Date.now() < hold || !field?.isVisible) return;
          show((active + 1) % rows.length);
        }, 3200);
    const cleanups = rows.map((row, k) => {
      const take = () => {
        hold = Date.now() + 6000;
        show(k);
      };
      row.addEventListener("pointerenter", take);
      row.addEventListener("focusin", take);
      return () => {
        row.removeEventListener("pointerenter", take);
        row.removeEventListener("focusin", take);
      };
    });
    if (!conditions.reduce) {
      gsap.from(rows, {
        y: 30,
        autoAlpha: 0,
        stagger: 0.08,
        scrollTrigger: { trigger: el.querySelector(".pf-rows"), start: "top 85%", once: true },
      });
      gsap.from(el.querySelector(".tpl-preview"), {
        y: 50,
        autoAlpha: 0,
        duration: 1.2,
        scrollTrigger: { trigger: el.querySelector(".tpl-layout"), start: "top 80%", once: true },
      });
    }
    return () => {
      window.clearInterval(timer);
      cleanups.forEach((cleanup) => cleanup());
      field?.destroy();
    };
  });
  return (
    <section className="pf-templates chapter" id="templates" ref={ref} data-chapter="08">
      <Chapter n="08" label="Templates" />
      <div className="split-heading">
        <h2 data-split>
          Don’t start from a <em>blank canvas.</em>
        </h2>
        <p data-reveal>
          The Templates Hub has ready-to-run pipelines for common jobs. Pick one, connect your
          systems and change whatever you need.
        </p>
      </div>
      <div className="tpl-layout">
        <ul className="pf-rows pf-rows-templates">
          {templates.map(([n, title, text, tag, href]) => (
            <li key={n}>
              <a href={href}>
                <span className="pf-row-num">{n}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="pf-tag">{tag}</span>
                <ArrowUpRight className="pf-row-arrow" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
        <figure className="tpl-preview" aria-hidden="true">
          <header>
            <span data-tpl-tag>{templates[0][3]}</span>
            <span className="tpl-live">
              <i />
            </span>
          </header>
          <ParticleStage className="tpl-stage" />
          <figcaption data-tpl-title>{templates[0][1]}</figcaption>
        </figure>
      </div>
      <div className="pf-after-button" data-reveal>
        <StoryButton href="/templates/" icon={<ArrowUpRight />}>
          Browse all templates
        </StoryButton>
      </div>
    </section>
  );
}

/* ─────────────── P10 · 09 / Proof (hidden until approved) ─────────────── */

export function PlatformProof() {
  const ref = useRef<HTMLElement>(null);
  useScene(ref, ({ reduce }, el) => {
    const number = el.querySelector<HTMLElement>("[data-count-to]");
    if (reduce || !number) return;
    const state = { n: 0 };
    gsap.to(state, {
      n: 51,
      duration: 2.2,
      ease: "power3.out",
      onUpdate: () => (number.textContent = `${Math.round(state.n)}%`),
      scrollTrigger: { trigger: el, start: "top 70%", once: true },
    });
  });
  if (!SHOW_PROOF) return null;
  return (
    <section className="pf-proof chapter on-dark" id="proof" ref={ref} data-chapter="09">
      <Chapter n="09" label="Proof" />
      <p className="pf-proof-number" data-count-to="51">
        51%
      </p>
      <p className="kicker">Hotel Switchboard · Hospitality</p>
      <p className="pf-proof-line" data-reveal>
        Lower cloud costs across more than 500 properties, after moving their data pipelines onto
        QuantumDataLytica.
      </p>
      <a className="text-link" href="/case-studies/hotel-switchboard/" data-reveal>
        Read the case study <span aria-hidden="true">→</span>
      </a>
    </section>
  );
}

/* ─────────────── P11 · 10 / Built for ─────────────── */

const audiences = [
  [
    "Leaders",
    "See the business clearly",
    "Get reports and alerts that build themselves, from every branch and system, without asking IT for another export.",
    "Solutions by industry",
    "/solutions/",
  ],
  [
    "Data & ops teams",
    "Ship pipelines in days",
    "Build, schedule and monitor data pipelines visually, and spend your time on analysis instead of fixing broken scripts.",
    "Start from a template",
    "/templates/",
  ],
  [
    "Developers",
    "Extend it in Python",
    "Build custom Quantum Machines with the CLI, Docker and Git, then publish them for your team or the community.",
    "Visit the Developer Hub",
    "/developer/",
  ],
] as const;

/** A picture per audience: a report assembling, machines turning, code. */
const audienceShapes: Array<() => StateDef> = [
  selfBuildingReport,
  () => fitState(industryState("gears").state, 0.62),
  () => textMark(sampleText("</>", "500 170px Geist, sans-serif"), 2.9),
];

export function PlatformTeams() {
  const ref = useRef<HTMLElement>(null);
  useScene(ref, (conditions, el) => {
    const cards = gsap.utils.toArray<HTMLElement>(".pf-audience", el);
    const fields = cards.map((card, k) =>
      mountField(
        card.querySelector(".pf-audience-stage"),
        () => ({
          count: 650,
          theme: "light",
          accentOnly: true,
          size: 1.25,
          radius: [0.3, 0.42],
          pointer: 0.6,
          pointerEl: card,
          seed: 140 + k,
          states: [audienceShapes[k]!()],
        }),
        conditions,
      ),
    );
    return () => fields.forEach((field) => field?.destroy());
  });
  useScene(ref, ({ reduce }, el) => {
    if (reduce) return;
    gsap.from(el.querySelectorAll(".pf-audience"), {
      y: 50,
      autoAlpha: 0,
      stagger: 0.12,
      duration: 1.1,
      scrollTrigger: { trigger: el.querySelector(".pf-audiences"), start: "top 80%", once: true },
    });
  });
  const offset = SHOW_PROOF ? 0 : -1;
  const n = String(10 + offset).padStart(2, "0");
  return (
    <section className="pf-teams chapter" id="teams" ref={ref} data-chapter={n}>
      <Chapter n={n} label="Built for" />
      <h2 data-split>
        One platform. <em>Three ways to use it.</em>
      </h2>
      <div className="pf-audiences">
        {audiences.map(([who, title, text, link, href], index) => (
          <a className="pf-audience" href={href} key={who}>
            <span className="pf-audience-num">0{index + 1}</span>
            <ParticleStage className="pf-audience-stage" />
            <span className="kicker">{who}</span>
            <h3>{title}</h3>
            <p>{text}</p>
            <span className="mcard-link">
              {link} <span aria-hidden="true">→</span>
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

/* ─────────────── P12 · 11 / Security & pricing ─────────────── */

const trustRows = [
  ["Encryption", "In transit and at rest"],
  ["Access control", "Role-based permissions per team"],
  ["Audit trail", "Every run and change is logged"],
  ["Compliance", "Built to support regulated industries"],
] as const;

export function PlatformTrust() {
  const ref = useRef<HTMLElement>(null);
  // Scattered points close ranks into a locked shield as the section arrives.
  useScene(ref, (conditions, el) => {
    const stage = el.querySelector(".pf-shield");
    const field = mountField(
      stage,
      () => ({
        count: 1500,
        theme: "dark",
        bright: true,
        glow: 0.14,
        radius: [0.3, 0.4],
        pointer: 0.35,
        accentRatio: 0.5,
        seed: 508,
        states: [
          { shape: shapes.nebula(2.2, 1.1, 0.8, 3), motion: motions.swirl(0.0003, 0.03) },
          shieldState(0, -0.08, 0.95),
        ],
      }),
      conditions,
    );
    if (!field) return;
    if (conditions.reduce) field.morph = 1;
    else {
      field.morph = 0;
      gsap.to(field, {
        morph: 1,
        duration: 2.4,
        ease: "power2.inOut",
        scrollTrigger: { trigger: stage, start: "top 80%", once: true },
      });
    }
    return () => field.destroy();
  });
  useScene(ref, ({ reduce }, el) => {
    if (reduce) return;
    gsap.from(el.querySelectorAll(".pf-trust-rows li"), {
      x: -30,
      autoAlpha: 0,
      stagger: 0.1,
      scrollTrigger: { trigger: el.querySelector(".pf-trust-rows"), start: "top 80%", once: true },
    });
    gsap.from(el.querySelector(".pf-price"), {
      y: 50,
      autoAlpha: 0,
      duration: 1.2,
      scrollTrigger: { trigger: el.querySelector(".pf-price"), start: "top 85%", once: true },
    });
  });
  const n = String(SHOW_PROOF ? 11 : 10).padStart(2, "0");
  return (
    <section className="pf-trust chapter on-dark" id="trust" ref={ref} data-chapter={n}>
      <Chapter n={n} label="Security & pricing" />
      <div className="pf-trust-grid">
        <div>
          <h2 data-split>
            Built for data <em>that matters.</em>
          </h2>
          <ul className="pf-trust-rows">
            {trustRows.map(([title, text]) => (
              <li key={title}>
                <span className="pf-lock" aria-hidden="true" />
                <strong>{title}</strong>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <a className="text-link" href="/platform/security/" data-reveal>
            Security &amp; compliance <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="pf-trust-side">
          <ParticleStage className="pf-shield" />
          <div className="pf-price">
          <span className="kicker">Pricing</span>
          <p className="pf-price-title">
            Pay as you go. <em>Only for what runs.</em>
          </p>
          <p>
            No upfront licence and no minimum seat count. You pay for the compute your pipelines
            use, so cost grows only as your usage grows.
          </p>
          <StoryButton href="/pricing/" icon={<ArrowUpRight />}>
            See pricing
          </StoryButton>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────── P14 · 13 / Get started ─────────────── */

export function PlatformCTA({ chapter }: { chapter: string }) {
  const ref = useRef<HTMLElement>(null);
  useScene(ref, (conditions, el) => {
    const field = mountField(
      el.querySelector(".pf-cta-field"),
      ({ desktop }) => ({
        count: desktop ? 2400 : 1000,
        theme: "accent",
        accentRatio: 0,
        size: 1.3,
        radius: [0.3, 0.44],
        seed: 7,
        states: [rainState({ width: 3.2, top: -1.3, bottom: 1.3, lanes: 40 })],
      }),
      conditions,
    );
    if (conditions.reduce) return () => field?.destroy();
    const heading = el.querySelector<HTMLElement>("h2");
    const split = heading ? SplitText.create(heading, { type: "lines", mask: "lines" }) : null;
    gsap.from(split?.lines ?? [], {
      yPercent: 110,
      stagger: 0.08,
      duration: 1.2,
      scrollTrigger: { trigger: el, start: "top 70%", once: true },
    });
    return () => {
      field?.destroy();
      split?.revert();
    };
  });
  return (
    <section className="pf-cta chapter" id="contact" ref={ref} data-chapter={chapter}>
      <ParticleStage className="pf-cta-field" />
      <Chapter n={chapter} label="Get started" />
      <h2>
        Your data is ready to work. <em>Let’s build your first pipeline.</em>
      </h2>
      <p data-reveal>
        In a 30-minute demo, we’ll map one routine data job in your business and show you what it
        looks like running on its own.
      </p>
      <div className="hero-actions" data-reveal>
        <StoryButton href={DEMO_URL} icon={<ArrowUpRight />} track="demo">
          Request a demo
        </StoryButton>
        <StoryButton href="/templates/" variant="storyOutline">
          Browse templates
        </StoryButton>
      </div>
    </section>
  );
}
