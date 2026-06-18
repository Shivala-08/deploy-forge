"use client";

import { useSites } from "@/hooks/useSites";
import { Card } from "@/components/ui/card";
import { Rocket, FolderOpen, CheckCircle, AlertTriangle } from "lucide-react";

export function MetricsPanel() {
  const { sites } = useSites();

  const totalSites = sites.length;
  const totalDeployments =
    sites.reduce((acc, s) => acc + (s.deployments?.length || 0), 0) || 0;
  const readyDeployments =
    sites.reduce(
      (acc, s) =>
        acc +
        (s.deployments?.filter((d) => d.status === "READY").length || 0),
      0
    ) || 0;
  const errorDeployments =
    sites.reduce(
      (acc, s) =>
        acc +
        (s.deployments?.filter((d) => d.status === "ERROR").length || 0),
      0
    ) || 0;

  const metrics = [
    {
      label: "Active Sites",
      value: totalSites,
      icon: FolderOpen,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Total Deploys",
      value: totalDeployments,
      icon: Rocket,
      color: "text-slate-300",
      bg: "bg-white/5",
    },
    {
      label: "Ready Mesh",
      value: readyDeployments,
      icon: CheckCircle,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Errors",
      value: errorDeployments,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} className="p-4 border-white/5 bg-[#0f0f1a]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{m.value}</div>
              <div className="text-xs text-slate-500">{m.label}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
