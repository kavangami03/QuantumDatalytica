import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

type StoryButtonProps = {
  href: string;
  children: string;
  icon?: ReactNode;
  variant?: "story" | "storyOutline";
};

/** Pill link whose label rolls on hover and which leans toward the pointer. */
export function StoryButton({ href, children, icon, variant = "story" }: StoryButtonProps) {
  return (
    <span className="magnetic" data-magnetic>
      <Button asChild variant={variant} size="story">
        <a href={href}>
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
