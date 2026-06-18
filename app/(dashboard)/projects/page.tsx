"use client";

import { useSites } from "@/hooks/useSites";
import { SiteCard } from "@/components/dashboard/SiteCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";

export default function ProjectsPage() {
  const { sites, isLoading } = useSites();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Sites</h1>
        <Link href="/projects/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Plus className="h-4 w-4 mr-1.5" />
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
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-white/5 bg-[#0f0f1a]">
          <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            No active sites yet
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Deploy your first static site to get started.
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
  );
}
