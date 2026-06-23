"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";

function MetricsBar() {
  const { data } = useSWR("/api/metrics", (url) => fetch(url).then((r) => r.json()), {
    refreshInterval: 15000,
  });

  if (!data || data.error) return null;

  return (
    <div className="flex items-center gap-4 text-xs font-mono text-slate-400 bg-white/2 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
      <div>Success: <span className="text-emerald-400 font-semibold">{data.successRate}%</span></div>
      <div className="h-3 w-px bg-white/10" />
      <div>Failed: <span className="text-red-400 font-semibold">{data.failedDeployments}</span></div>
      <div className="h-3 w-px bg-white/10" />
      <div>Avg Time: <span className="text-indigo-400 font-semibold">{data.avgBuildTimeSeconds}s</span></div>
    </div>
  );
}

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-white/6 bg-surface/50 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="text-sm text-slate-500">
          Mission Control
        </div>
        <MetricsBar />
      </div>

      <div className="flex items-center gap-4">
        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Deploy New
          </Button>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-slate-400">{session.user.name}</span>
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full border border-white/10"
              />
            )}
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs text-slate-400 hover:text-white border border-white/10 bg-white/2 hover:bg-white/5 px-2.5 h-7"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
}
