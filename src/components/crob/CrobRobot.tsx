import { cn } from "@/lib/utils";

interface CrobRobotProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: "w-32 h-32 md:w-40 md:h-40",
  md: "w-48 h-48 md:w-64 md:h-64",
  lg: "w-56 h-56 md:w-80 md:h-80",
} as const;

export function CrobRobot({ className, size = "md" }: CrobRobotProps) {
  return (
    <div className={cn("relative select-none", className)}>
      {/* Decorative surrounding elements */}
      <div className="absolute -top-4 -right-4 size-3 rounded-full bg-primary/30 animate-float-slow" />
      <div className="absolute -bottom-6 -left-2 size-2 rounded-full bg-accent/40 animate-float-gentle" />
      <div className="absolute top-1/4 -left-8 size-1.5 rounded-full bg-primary/20 animate-particle-drift-1" />
      <div className="absolute bottom-1/4 -right-10 size-1 rounded-full bg-accent/30 animate-particle-drift-2" />
      <div className="absolute top-[10%] right-[15%] text-primary/20 text-[12px] font-mono animate-gear-spin">
        ⚙
      </div>
      <div className="absolute top-[30%] -left-[5%] text-primary/10 text-[18px] font-mono animate-gear-spin-reverse">
        ⚙
      </div>
      <div className="absolute bottom-[20%] -right-[10%] text-accent/15 text-[10px] font-mono animate-float-slow">
        ◈
      </div>
      <div className="absolute top-[60%] -left-[12%] text-primary/15 text-[10px] font-mono animate-pulse">
        01
      </div>

      {/* Ambient glow behind robot */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl animate-robot-glow origin-center" />

      {/* Robot image wrapper for complex combined movement if needed, but we'll apply it to the image */}
      <img
        src="/crob-robot.png"
        alt="C-ROB Robot"
        className={cn(
          sizeMap[size],
          "relative z-10 object-contain drop-shadow-[0_0_15px_rgba(98,30,258,0.2)] animate-robot-idle",
        )}
        draggable={false}
      />
    </div>
  );
}
