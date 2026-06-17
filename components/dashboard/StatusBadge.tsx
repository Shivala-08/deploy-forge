import { cn } from "@/lib/utils";
import type { DeploymentStatus } from "@/types";

const STATUS_CONFIG: Record<
  DeploymentStatus,
  { label: string; color: string; dot: string }
> = {
  QUEUED: {
    label: "Queued",
    color: "bg-slate-700 text-slate-300",
    dot: "bg-slate-400",
  },
  BUILDING: {
    label: "Building",
    color: "bg-amber-950 text-amber-400",
    dot: "bg-amber-400 animate-pulse",
  },
  READY: {
    label: "Ready",
    color: "bg-emerald-950 text-emerald-400",
    dot: "bg-emerald-400",
  },
  ERROR: {
    label: "Error",
    color: "bg-red-950 text-red-400",
    dot: "bg-red-400",
  },
  CANCELED: {
    label: "Canceled",
    color: "bg-slate-800 text-slate-400",
    dot: "bg-slate-500",
  },
};

export function StatusBadge({ status }: { status: DeploymentStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.QUEUED;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.color
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
