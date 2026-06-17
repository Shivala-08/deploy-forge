export interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  githubId?: string | null;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  repoFullName: string;
  repoBranch: string;
  buildCommand?: string | null;
  outputDir?: string | null;
  framework?: string | null;
  vercelProjectId?: string | null;
  vercelUrl?: string | null;
  customDomain?: string | null;
  userId: string;
  deployments: Deployment[];
  envVars: EnvVar[];
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  vercelDeployId?: string | null;
  status: DeploymentStatus;
  commitSha?: string | null;
  commitMessage?: string | null;
  url?: string | null;
  errorMessage?: string | null;
  projectId: string;
  triggeredAt: string;
  completedAt?: string | null;
}

export type DeploymentStatus = "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED";

export interface EnvVar {
  id: string;
  key: string;
  value: string;
  target: string;
  projectId: string;
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  updated_at: string;
  language: string | null;
  default_branch: string;
}

export interface VercelProject {
  id: string;
  name: string;
  framework: string;
  link?: {
    deployHooks?: Array<{ url: string }>;
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
  };
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
