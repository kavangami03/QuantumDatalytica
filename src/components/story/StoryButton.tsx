import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type StoryButtonProps = {
  href: string;
  children: string;
  icon?: ReactNode;
  variant?: "story" | "storyOutline";
  /** Analytics label; "Request a demo" style links are reported to GA4 (see analytics.ts). */
  track?: string;
};

/** Pill link whose label rolls on hover and which leans toward the pointer. */
export function StoryButton({ href, children, icon, variant = "story", track }: StoryButtonProps) {
  return (
    <span className="magnetic" data-magnetic>
      <Button asChild variant={variant} size="story">
        <a href={href} data-track={track}>
          <span className="roll">
            <span>{children}</span>
            <span aria-hidden="true">{children}</span>
          </span>
          {icon && <span className="btn-icon">{icon}</span>}
        </a>
      </Button>
    </span>
  );
}
