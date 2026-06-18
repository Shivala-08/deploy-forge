"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ExternalLink, Save, CheckCircle, AlertTriangle } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage({
  params,
}: {
  params: { siteId: string };
}) {
  const { siteId } = params;
  const { data: site, isLoading, mutate } = useSWR(`/api/projects/${siteId}`, fetcher);

  const [name, setName] = useState("");
  const [repoBranch, setRepoBranch] = useState("");
  const [buildCommand, setBuildCommand] = useState("");
  const [outputDir, setOutputDir] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (site) {
      setName(site.name || "");
      setRepoBranch(site.repoBranch || "main");
      setBuildCommand(site.buildCommand || "");
      setOutputDir(site.outputDir || "");
    }
  }, [site]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch(`/api/projects/${siteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          repoBranch,
          buildCommand,
          outputDir,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update configuration");
      }

      await mutate();
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error occurred saving configuration");
    } finally {
      setIsSaving(false);
    }
  };

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
          <form onSubmit={handleSave}>
            <Card className="p-6 border-white/5 bg-[#0f0f1a] space-y-6">
              <h3 className="font-semibold text-white border-b border-white/5 pb-3">Configuration</h3>
              
              {saveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Configuration updated successfully!</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{saveError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Site Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Repository</label>
                  <div className="w-full h-9 rounded-lg border border-white/5 bg-white/2 px-3 text-sm text-slate-500 font-mono flex items-center select-none">
                    {site.repoFullName}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Branch</label>
                  <input
                    value={repoBranch}
                    onChange={(e) => setRepoBranch(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Framework</label>
                  <div className="w-full h-9 rounded-lg border border-white/5 bg-white/2 px-3 text-sm text-slate-400 capitalize flex items-center select-none">
                    {site.framework || "static"}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Build Command</label>
                  <input
                    value={buildCommand}
                    onChange={(e) => setBuildCommand(e.target.value)}
                    placeholder="e.g. npm run build"
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Output Directory</label>
                  <input
                    value={outputDir}
                    onChange={(e) => setOutputDir(e.target.value)}
                    placeholder="e.g. out or dist"
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Live Mesh URL</label>
                  <div className="h-9 flex items-center">
                    {site.liveUrl ? (
                      <a
                        href={site.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
                      >
                        {site.liveUrl} <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">Not deployed yet</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 text-xs font-medium">Created At</label>
                  <div className="w-full h-9 rounded-lg border border-white/5 bg-white/2 px-3 text-sm text-slate-400 flex items-center select-none">
                    {new Date(site.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-white/5">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </Card>
          </form>

          <Card className="p-6 border-red-500/20 bg-red-500/5">
            <h3 className="font-semibold text-red-400 mb-2">Danger Zone</h3>
            <p className="text-xs text-slate-400 mb-4">
              Permanently delete this site from the monorepo mesh. All deployed static files and build history will be removed.
            </p>
            <Button variant="danger" size="sm" onClick={handleDelete} type="button">
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
