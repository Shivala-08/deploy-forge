"use client";

import Link from "next/link";
import useSWR from "swr";
import { StatusBadge } from "./StatusBadge";
import { Rocket } from "lucide-react";
import type { Deployment, Site } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface FeedItem extends Deployment {
  site?: Site;
}

export function DeploymentFeed() {
  const { data: sites } = useSWR<Site[]>("/api/projects", fetcher, {
    refreshInterval: 5000,
  });

  const deployments: FeedItem[] =
    sites
      ?.flatMap((s) =>
        (s.deployments || []).map((d: Deployment) => ({ ...d, site: s }))
      )
      .sort(
        (a, b) =>
          new Date(b.triggeredAt).getTime() -
          new Date(a.triggeredAt).getTime()
      )
      .slice(0, 20) || [];

  return (
    <div className="h-full flex flex-col bg-[#0f0f1a] border-white/5">
      <div className="px-4 py-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-slate-300">Live Feed</h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {deployments.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">
            No deployments yet. Push code to trigger one.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {deployments.map((d) => (
              <div
                key={d.id}
                className="px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-300 truncate">
                    {d.site?.name || "Unknown"}
                  </span>
                  <StatusBadge status={d.status as "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED"} />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {d.commitSha && (
                    <span className="font-mono">{d.commitSha.slice(0, 7)}</span>
                  )}
                  {d.commitMessage && (
                    <span className="truncate">{d.commitMessage}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-600">
                    {timeAgo(d.triggeredAt)}
                  </span>
                  {d.site?.siteId && (
                    <Link href={`/projects/${d.site.siteId}`} className="text-slate-500 hover:text-indigo-400 transition-colors">
                      <Rocket className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
