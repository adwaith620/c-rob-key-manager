import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CrobCardProps {
  icon?: ReactNode;
  iconColor?: string;
  title?: string;
  description?: string;
  featured?: boolean;
  className?: string;
  children?: ReactNode;
}

export function CrobCard({
  icon,
  iconColor = "bg-primary/20 text-primary",
  title,
  description,
  featured = false,
  className,
  children,
}: CrobCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-6 transition-all duration-300",
        featured
          ? "border-primary/40 bg-card/90 shadow-lg animate-pulse-glow"
          : "border-border/60 bg-card/70 hover:border-border hover:bg-card/80",
        "backdrop-blur-sm",
        className,
      )}
    >
      {icon && (
        <div className={cn("mb-4 flex size-12 items-center justify-center rounded-xl", iconColor)}>
          {icon}
        </div>
      )}
      {title && (
        <h3
          className={cn(
            "text-base font-semibold",
            featured ? "brand-gradient-text" : "text-foreground",
          )}
        >
          {title}
        </h3>
      )}
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}
