import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

interface GradientTextProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  variant?: "default" | "vivid";
}

export function GradientText({
  as: Tag = "span",
  className,
  children,
  variant = "default",
}: GradientTextProps) {
  return (
    <Tag
      className={cn(
        variant === "vivid" ? "brand-gradient-text-vivid" : "brand-gradient-text",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
