"use client";

import { useState } from "react";
import useSWR from "swr";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  ExternalLink,
  Rocket,
  Settings,
  Terminal,
  Key,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const { data: project, isLoading, mutate } = useSWR(
    `/api/projects/${projectId}`,
    fetcher
  );
  const [isDeploying, setIsDeploying] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
        <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Project not found.</p>
      </div>
    );
  }

  const latestDeploy = project.deployments?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-sm text-slate-500 font-mono mt-1">
            {project.repoFullName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {project.vercelUrl && (
            <a href={project.vercelUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Open Site
              </Button>
            </a>
          )}
          <Button
            size="sm"
            disabled={isDeploying}
            onClick={async () => {
              setIsDeploying(true);
              try {
                await fetch(`/api/projects/${projectId}/deploy`, {
                  method: "POST",
                });
                await mutate();
              } finally {
                setIsDeploying(false);
              }
            }}
          >
            <Rocket className="h-4 w-4 mr-1.5" />
            {isDeploying ? "Deploying..." : "Deploy"}
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-4">
        <Link href={`/projects/${projectId}/deployments`}>
          <Card className="hover:border-brand/30 cursor-pointer transition-colors">
            <Rocket className="h-5 w-5 text-brand-glow mb-2" />
            <h3 className="font-medium text-sm">Deployments</h3>
            <p className="text-xs text-slate-500">View deploy history</p>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/logs`}>
          <Card className="hover:border-brand/30 cursor-pointer transition-colors">
            <Terminal className="h-5 w-5 text-brand-glow mb-2" />
            <h3 className="font-medium text-sm">Logs</h3>
            <p className="text-xs text-slate-500">Build & runtime logs</p>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/env`}>
          <Card className="hover:border-brand/30 cursor-pointer transition-colors">
            <Key className="h-5 w-5 text-brand-glow mb-2" />
            <h3 className="font-medium text-sm">Environment</h3>
            <p className="text-xs text-slate-500">Manage env vars</p>
          </Card>
        </Link>
        <Link href={`/projects/${projectId}/settings`}>
          <Card className="hover:border-brand/30 cursor-pointer transition-colors">
            <Settings className="h-5 w-5 text-brand-glow mb-2" />
            <h3 className="font-medium text-sm">Settings</h3>
            <p className="text-xs text-slate-500">Project configuration</p>
          </Card>
        </Link>
      </div>

      {/* Latest deployment */}
      {latestDeploy && (
        <Card>
          <h3 className="font-semibold mb-3">Latest Deployment</h3>
          <div className="flex items-center gap-4">
            <StatusBadge status={latestDeploy.status} />
            {latestDeploy.commitSha && (
              <span className="font-mono text-sm text-slate-400">
                {latestDeploy.commitSha.slice(0, 7)}
              </span>
            )}
            {latestDeploy.commitMessage && (
              <span className="text-sm text-slate-400">
                {latestDeploy.commitMessage}
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
