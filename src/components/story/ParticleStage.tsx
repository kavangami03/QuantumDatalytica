import type { ReactNode } from "react";
import { ParticleField, type FieldOptions } from "./particles";
import type { MediaConditions } from "@/animations/gsap";

/** A floating annotation pinned to a point in a particle scene. */
export function PLabel({
  index,
  title,
  tag,
  variant = "default",
}: {
  index?: number;
  title: string;
  tag?: string | undefined;
  variant?: "default" | "large" | "center" | "column";
}) {
  return (
    <span className={`p-label p-label-${variant}`}>
      <span className="p-label-body">
        {variant !== "center" && <i aria-hidden="true" />}
        <span className="p-label-text">
          {index !== undefined && <small>{String(index + 1).padStart(2, "0")}</small>}
          <strong>{title}</strong>
          {tag && <em>{tag}</em>}
        </span>
      </span>
    </span>
  );
}

/** Canvas plus its labels. Labels stay in the DOM so the scene remains readable. */
export function ParticleStage({
  className = "",
  label,
  children,
}: {
  className?: string;
  label?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`p-stage ${className}`} aria-label={label} role={label ? "group" : undefined}>
      <canvas className="p-canvas" aria-hidden="true" />
      {children}
    </div>
  );
}

/**
 * Builds a field inside a stage. Under reduced motion it renders one still
 * frame of its final state and never animates.
 */
export function mountField(
  stage: Element | null,
  options: (conditions: MediaConditions) => FieldOptions,
  conditions: MediaConditions,
): ParticleField | null {
  const canvas = stage?.querySelector<HTMLCanvasElement>(".p-canvas");
  if (!stage || !canvas) return null;
  const opts = options(conditions);
  const anchors = opts.anchors ?? [];
  try {
    const field = new ParticleField(canvas, { ...opts, anchors });
    if (conditions.reduce) field.still();
    else field.start();
    return field;
  } catch {
    return null;
  }
}

/** Labels in DOM order, as elements. */
export function labelsIn(stage: Element | null) {
  return Array.from(stage?.querySelectorAll<HTMLElement>(".p-label") ?? []);
}
