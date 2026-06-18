"use client";

import { useState } from "react";
import useSWR from "swr";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Rocket,
  Settings,
  History,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SiteOverviewPage({
  params,
}: {
  params: { siteId: string };
}) {
  const { siteId } = params;
  const router = useRouter();
  const { data: site, isLoading, mutate } = useSWR(
    `/api/projects/${siteId}`,
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

  if (!site) {
    return (
      <div className="text-center py-20 rounded-xl border border-white/5 bg-[#0f0f1a]">
        <p className="text-slate-400">Site not found.</p>
      </div>
    );
  }

  const latestDeploy = site.deployments?.[0];

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const res = await fetch(`/api/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.siteId,
          repoFullName: site.repoFullName,
          repoBranch: site.repoBranch,
          buildCommand: site.buildCommand,
          outputDir: site.outputDir,
        }),
      });
      if (res.ok) {
        await mutate();
        router.push(`/projects/${siteId}/deployments`);
      }
    } catch (err) {
      console.error("Failed to deploy", err);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{site.name}</h1>
          <p className="text-sm text-slate-500 font-mono mt-1">
            {site.repoFullName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {site.liveUrl && (
            <a href={site.liveUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Open Site
              </Button>
            </a>
          )}
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
            disabled={isDeploying || latestDeploy?.status === "BUILDING" || latestDeploy?.status === "QUEUED"}
            onClick={handleDeploy}
          >
            <Rocket className="h-4 w-4 mr-1.5" />
            {isDeploying ? "Deploying..." : "Deploy"}
          </Button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link href={`/projects/${siteId}/deployments`}>
          <Card className="p-5 border-white/5 bg-[#0f0f1a] hover:border-indigo-500/30 cursor-pointer transition-all hover:bg-[#0f0f1a]/80">
            <History className="h-5 w-5 text-indigo-400 mb-2" />
            <h3 className="font-medium text-sm text-white">Deployments</h3>
            <p className="text-xs text-slate-500">View deploy history and terminal progress</p>
          </Card>
        </Link>
        <Link href={`/projects/${siteId}/settings`}>
          <Card className="p-5 border-white/5 bg-[#0f0f1a] hover:border-indigo-500/30 cursor-pointer transition-all hover:bg-[#0f0f1a]/80">
            <Settings className="h-5 w-5 text-indigo-400 mb-2" />
            <h3 className="font-medium text-sm text-white">Settings</h3>
            <p className="text-xs text-slate-500">Site configuration and deletion</p>
          </Card>
        </Link>
      </div>

      {/* Latest deployment */}
      {latestDeploy && (
        <Card className="p-5 border-white/5 bg-[#0f0f1a]">
          <h3 className="font-semibold text-white mb-3">Latest Deployment</h3>
          <div className="flex items-center gap-4">
            <StatusBadge status={latestDeploy.status} />
            {latestDeploy.commitSha && (
              <span className="font-mono text-sm text-slate-400">
                {latestDeploy.commitSha.slice(0, 7)}
              </span>
            )}
            {latestDeploy.commitMessage && (
              <span className="text-sm text-slate-400 truncate">
                {latestDeploy.commitMessage}
              </span>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
