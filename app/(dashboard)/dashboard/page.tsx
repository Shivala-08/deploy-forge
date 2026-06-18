"use client";

import { useSites } from "@/hooks/useSites";
import { SiteCard } from "@/components/dashboard/SiteCard";
import { DeploymentFeed } from "@/components/dashboard/DeploymentFeed";
import { MetricsPanel } from "@/components/dashboard/MetricsPanel";
import { MeshMap } from "@/components/dashboard/MeshMap";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";

export default function DashboardPage() {
  const { sites, isLoading } = useSites();

  // Format sites for MeshMap
  const meshSites = sites.map((s) => ({
    siteId: s.siteId,
    name: s.name,
    status: s.deployments?.[0]?.status ?? "NEVER_DEPLOYED",
  }));

  return (
    <div className="h-full flex flex-col gap-6">
      {/* 3D Mesh Tree Map */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Live Node Mesh</h2>
          <div className="text-xs text-slate-500 font-mono">Star Topology Visualizer</div>
        </div>
        <MeshMap sites={meshSites} />
      </div>

      {/* Metrics */}
      <MetricsPanel />

      {/* Main content */}
      <div className="flex-1 grid grid-cols-[1fr_320px] gap-6 min-h-0">
        {/* Project Grid */}
        <div className="overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Sites</h2>
            <Link href="/projects/new">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Plus className="h-4 w-4 mr-1" />
                New Site
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-xl border border-white/5 bg-[#0f0f1a] animate-pulse"
                />
              ))}
            </div>
          ) : sites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-xl border border-white/5 bg-[#0f0f1a]">
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-slate-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">
                No active sites in the mesh
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Deploy your first static site or template repo to get started.
              </p>
              <Link href="/projects/new">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Deploy First Site
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} />
              ))}
            </div>
          )}
        </div>

        {/* Live Feed */}
        <div className="rounded-xl border border-white/5 bg-[#0f0f1a] overflow-hidden">
          <DeploymentFeed />
        </div>
      </div>
    </div>
  );
}
