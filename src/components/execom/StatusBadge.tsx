import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let variant: "default" | "secondary" | "destructive" | "outline" = "default";
  let customColor = "";

  switch (status.toLowerCase()) {
    case "available":
    case "active":
    case "approved":
    case "completed":
      variant = "outline";
      customColor = "border-success text-success bg-success/10";
      break;
    case "in use":
    case "reserved":
      variant = "outline";
      customColor = "border-info text-info bg-info/10";
      break;
    case "pending return":
    case "pending":
      variant = "outline";
      customColor = "border-warning text-warning bg-warning/10";
      break;
    case "overdue":
    case "rejected":
    case "maintenance":
    case "disabled":
      variant = "destructive";
      break;
    default:
      variant = "secondary";
  }

  return (
    <Badge variant={variant} className={cn(customColor, className)}>
      {status}
    </Badge>
  );
}
