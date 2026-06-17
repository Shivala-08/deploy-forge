"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Rocket, FolderOpen, CheckCircle, AlertTriangle } from "lucide-react";
import type { Project } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function MetricsPanel() {
  const { data: projects } = useSWR<Project[]>("/api/projects", fetcher, {
    refreshInterval: 10000,
  });

  const totalProjects = projects?.length || 0;
  const totalDeployments =
    projects?.reduce((acc, p) => acc + (p.deployments?.length || 0), 0) || 0;
  const readyDeployments =
    projects?.reduce(
      (acc, p) =>
        acc +
        (p.deployments?.filter((d) => d.status === "READY").length || 0),
      0
    ) || 0;
  const errorDeployments =
    projects?.reduce(
      (acc, p) =>
        acc +
        (p.deployments?.filter((d) => d.status === "ERROR").length || 0),
      0
    ) || 0;

  const metrics = [
    {
      label: "Projects",
      value: totalProjects,
      icon: FolderOpen,
      color: "text-brand-glow",
      bg: "bg-brand/10",
    },
    {
      label: "Total Deploys",
      value: totalDeployments,
      icon: Rocket,
      color: "text-slate-300",
      bg: "bg-white/5",
    },
    {
      label: "Ready",
      value: readyDeployments,
      icon: CheckCircle,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Errors",
      value: errorDeployments,
      icon: AlertTriangle,
      color: "text-danger",
      bg: "bg-danger/10",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${m.bg}`}>
              <m.icon className={`h-4 w-4 ${m.color}`} />
            </div>
            <div>
              <div className="text-2xl font-bold">{m.value}</div>
              <div className="text-xs text-slate-500">{m.label}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
