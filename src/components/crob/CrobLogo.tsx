import { cn } from "@/lib/utils";

interface CrobLogoProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showSubtext?: boolean;
}

const sizeMap = {
  xs: "h-6",
  sm: "h-8",
  md: "h-10",
  lg: "h-14",
} as const;

export function CrobLogo({ size = "sm", className, showSubtext = true }: CrobLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <img
        src="/crob-logo.png"
        alt="C-ROB Logo"
        className={cn(sizeMap[size], "w-auto object-contain")}
        draggable={false}
      />
      {showSubtext && (
        <span className="font-display text-sm leading-tight">
          C-ROB
          <span className="block text-[9px] tracking-[0.22em] text-muted-foreground">
            SMART KEY LOCKER
          </span>
        </span>
      )}
    </div>
  );
}
