import { cn } from "@/lib/utils";

export type KeyStatus = "available" | "booked" | "key-out";

const MAP: Record<KeyStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-success/15 text-success border-success/40" },
  booked: { label: "Booked", className: "bg-warning/15 text-warning border-warning/40" },
  "key-out": { label: "Key Out", className: "bg-destructive/15 text-destructive border-destructive/40" },
};

export function KeyStatusBadge({ status, className }: { status: KeyStatus; className?: string }) {
  const { label, className: tone } = MAP[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide",
        tone,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
