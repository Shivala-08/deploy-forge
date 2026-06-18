"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage({
  params,
}: {
  params: { siteId: string };
}) {
  const { siteId } = params;
  const { data: site, isLoading } = useSWR(`/api/projects/${siteId}`, fetcher);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this site from the mesh? This action is permanent.")) return;
    try {
      const res = await fetch(`/api/projects/${siteId}`, { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/projects";
      } else {
        alert("Failed to delete site.");
      }
    } catch (err) {
      console.error(err);
      alert("Error occurred deleting site.");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Site Settings: {site?.name}</h1>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-40 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-28 bg-white/5 rounded-xl animate-pulse" />
        </div>
      ) : site ? (
        <div className="space-y-6">
          <Card className="p-6 border-white/5 bg-[#0f0f1a]">
            <h3 className="font-semibold text-white mb-4">Configuration</h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-slate-500 block text-xs">Site Name</span>
                <p className="font-medium text-white mt-0.5">{site.name}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Repository</span>
                <p className="font-medium font-mono text-xs text-slate-300 mt-0.5">
                  {site.repoFullName}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Framework</span>
                <p className="font-medium text-white capitalize mt-0.5">
                  {site.framework || "static"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Branch</span>
                <p className="font-medium font-mono text-slate-300 mt-0.5">{site.repoBranch}</p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Build Command</span>
                <p className="font-medium font-mono text-xs text-slate-300 mt-0.5">
                  {site.buildCommand || "None (Static HTML)"}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Output Directory</span>
                <p className="font-medium font-mono text-xs text-slate-300 mt-0.5">
                  {site.outputDir}
                </p>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Live Mesh URL</span>
                {site.liveUrl ? (
                  <a
                    href={site.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-indigo-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    {site.liveUrl} <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <p className="font-medium text-slate-500 mt-0.5">Not deployed yet</p>
                )}
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Created At</span>
                <p className="font-medium text-slate-300 mt-0.5">
                  {new Date(site.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-red-500/20 bg-red-500/5">
            <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-xs text-slate-400 mb-4">
              Permanently delete this site from the monorepo mesh. All deployed static files and build history will be removed.
            </p>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Site
            </Button>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">Site configuration not found.</div>
      )}
    </div>
  );
}
