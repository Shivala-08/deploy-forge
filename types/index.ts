export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  githubId?: string | null;
}

export interface Site {
  id: string;
  siteId: string;
  name: string;
  repoFullName: string;
  repoBranch: string;
  buildCommand?: string | null;
  outputDir?: string | null;
  framework?: string | null;
  liveUrl?: string | null;
  userId: string;
  deployments?: Deployment[];
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  workflowRunId?: string | null;
  status: DeploymentStatus;
  commitSha?: string | null;
  commitMessage?: string | null;
  errorMessage?: string | null;
  siteId: string;
  triggeredAt: string;
  completedAt?: string | null;
}

export type DeploymentStatus = "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  updated_at: string;
  language: string | null;
  default_branch: string;
}

export interface LogEntry {
  timestamp: string;
  level: "stdout" | "stderr" | "system";
  message: string;
}

export const STATUS_CONFIG: Record<
  DeploymentStatus,
  { label: string; color: string; dot: string }
> = {
  QUEUED: {
    label: "Queued",
    color: "bg-slate-700 text-slate-300",
    dot: "bg-indigo-400 animate-pulse",
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
