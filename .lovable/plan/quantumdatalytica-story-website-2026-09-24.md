# QuantumDataLytica Story Website

## Goal
Build a single, continuous editorial experience that shows how scattered business information becomes understanding, automation, and action. The copy stays concise and non-technical; the visual system does most of the explaining.

## Visual direction
- Deep ink and warm off-white foundation with one cobalt accent, fine rules, subtle paper-like texture, and no prominent gradients.
- Oversized grotesk typography, asymmetric Swiss-editorial composition, sharp geometry, small uppercase labels, and restrained controls.
- One consistent metaphor language: labels are information, lines are connections, organized patterns are clarity, directional movement is action.
- No stock photography, fake dashboards, invented proof, glowing effects, glass panels, or generic SaaS card grids.

## Build
1. **Foundation and navigation**
   - Define the full semantic color, type, spacing, border, focus, and motion system.
   - Add a compact responsive navigation, mobile menu, section links, persistent contact action, and understated chapter/progress rail.
   - Add Lenis smooth scrolling and reusable GSAP/ScrollTrigger helpers with cleanup, reduced-motion support, and responsive breakpoints.

2. **Opening narrative**
   - Build the pinned opening scene with scattered business labels, SVG connections, convergence into “One business view,” and the final scattered-to-action statement.
   - Follow with the fragmented-information problem scene, then reverse its visual language in the connection scene.

3. **Transformation and outcomes**
   - Build the pinned Data → Understanding → Action sequence with typography and diagram states changing together.
   - Present five large business outcomes as a paced, scroll-led editorial sequence rather than cards.
   - Build the repetitive-work loop that collapses into one continuous automated flow.
   - Build the revenue-question trail from question through business signals to understanding.

4. **Applications and comparison**
   - Create an accessible interactive industry explorer for Hospitality, Healthcare, Retail, Financial Services, and Manufacturing; selecting a sector reconfigures the central diagram and message.
   - Build the scroll-controlled Before/After divider showing the shift from fragmented work to connected action.
   - Present qualitative business impact and scenario-led use cases with small, consistent animated metaphors.

5. **Resolution**
   - Build the large “Your Business” ecosystem visualization that expands, contracts, and reorganizes.
   - Omit fabricated testimonials and logos; use an honest editorial transition into the final invitation.
   - Resolve all earlier visual elements into a calm final system, then add a concise footer with navigation, industries, contact, social, and legal labels.

## Responsive and accessibility
- Desktop receives the full cinematic pinned choreography; tablet uses fewer simultaneous nodes and shorter scenes; mobile gets a deliberately simplified vertical story rather than a scaled desktop layout.
- Every section remains understandable as static content without animation.
- Respect reduced motion, keyboard navigation, visible focus, semantic landmarks, contrast, and touch-friendly controls.

## Technical details
- Add only `gsap` and `lenis`; use SVG and CSS for the diagrams rather than WebGL or heavy media.
- Split the page into focused scene components and shared visual primitives; keep timelines in reusable hooks/utilities and destroy all GSAP contexts and ScrollTriggers on unmount.
- Pause nonessential work outside the viewport and favor transforms/opacity for performance.
- Add page-specific metadata and load the chosen webfont through the document head.

## Validation
- Check compilation, runtime console, navigation, industry switching, scroll choreography, and reduced-motion behavior.
- Visually inspect desktop and mobile layouts for hierarchy, overlaps, legibility, and whether the product’s business value is clear within the opening sequence.
