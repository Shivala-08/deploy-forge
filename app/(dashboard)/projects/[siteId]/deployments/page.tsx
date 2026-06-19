"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";
import { Terminal, Loader2, RotateCcw } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface WorkflowStep {
  name: string;
  status: string;
  conclusion: string | null;
}

function TerminalLogs({ deploymentId }: { deploymentId: string }) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [status, setStatus] = useState<string>("QUEUED");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!deploymentId) return;

    let intervalId: NodeJS.Timeout;
    
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/logs/${deploymentId}`);
        if (!res.ok) throw new Error("Failed to fetch logs");
        const data = await res.json();
        setStatus(data.status);
        if (data.steps) setSteps(data.steps);
        if (data.status === "READY" || data.status === "ERROR") {
          clearInterval(intervalId);
        }
      } catch (err) {
        setError("Could not retrieve build steps.");
      }
    };

    fetchLogs();
    intervalId = setInterval(fetchLogs, 3000);

    return () => clearInterval(intervalId);
  }, [deploymentId]);

  return (
    <div className="rounded-xl border border-white/5 bg-[#080810] overflow-hidden font-mono text-xs shadow-2xl h-80 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/2 border-b border-white/5 text-slate-400 shrink-0">
        <div className="flex items-center gap-1.5">
          <Terminal className="h-3.5 w-3.5" />
          <span>deployforge-runner.sh --id={deploymentId.slice(0, 8)}</span>
        </div>
        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-indigo-400 uppercase tracking-widest font-semibold">
          {status}
        </span>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {error ? (
          <div className="text-red-400">{error}</div>
        ) : steps.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500 gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Contacting GitHub Actions runner...</span>
          </div>
        ) : (
          steps.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-white/2 pb-1.5 last:border-0 last:pb-0">
              <span className={s.status === "in_progress" ? "text-amber-400 animate-pulse" : s.conclusion === "failure" ? "text-red-400" : "text-slate-300"}>
                {s.status === "in_progress" && <span className="mr-2">❯</span>}
                {s.name}
              </span>
              
              <div className="flex items-center gap-1.5">
                {s.status === "in_progress" && (
                  <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                )}
                {s.status === "queued" && (
                  <span className="text-[10px] text-slate-600 font-semibold">queued</span>
                )}
                {s.status === "completed" && s.conclusion === "success" && (
                  <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded font-bold">SUCCESS</span>
                )}
                {s.status === "completed" && s.conclusion === "failure" && (
                  <span className="text-red-500 text-[10px] bg-red-500/10 px-2 py-0.5 rounded font-bold">FAILED</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function DeploymentsPage({
  params,
}: {
  params: { siteId: string };
}) {
  const { siteId } = params;
  const { data: site, isLoading, mutate } = useSWR(`/api/projects/${siteId}`, fetcher, {
    refreshInterval: 5000,
  });
  const [selectedDeployId, setSelectedDeployId] = useState<string | null>(null);

  const deployments = site?.deployments || [];

  // Set default selected deploy
  useEffect(() => {
    if (deployments.length > 0 && !selectedDeployId) {
      setSelectedDeployId(deployments[0].id);
    }
  }, [deployments, selectedDeployId]);

  const handleRollback = async (deploymentId: string) => {
    if (!confirm("Are you sure you want to roll back to this version?")) return;
    try {
      const res = await fetch("/api/deploy/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deploymentId }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Rollback failed");
      }
      const data = await res.json();
      alert("Rollback initiated successfully!");
      if (data.deployment) {
        setSelectedDeployId(data.deployment.id);
      }
      mutate();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Deployments: {site?.name}</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-white/5 bg-[#0f0f1a] animate-pulse"
            />
          ))}
        </div>
      ) : deployments.length === 0 ? (
        <Card className="text-center py-12 border-white/5 bg-[#0f0f1a]">
          <p className="text-slate-400">No deployments yet. Click Deploy from the Site Overview.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start">
          {/* Deployments List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {deployments.map((d: any) => (
              <div
                key={d.id}
                onClick={() => setSelectedDeployId(d.id)}
                className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                  selectedDeployId === d.id
                    ? "border-indigo-500/40 bg-indigo-500/5"
                    : "border-white/5 bg-[#0f0f1a] hover:border-white/10 hover:bg-[#0f0f1a]/80"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={d.status as any} />
                  <span className="text-[10px] text-slate-500">
                    {new Date(d.triggeredAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                  <div className="flex items-center gap-2 text-xs text-slate-300 overflow-hidden mr-2">
                    {d.commitSha && (
                      <span className="font-mono text-slate-500 font-semibold">{d.commitSha.slice(0, 7)}</span>
                    )}
                    {d.commitMessage && (
                      <span className="truncate">{d.commitMessage}</span>
                    )}
                  </div>
                  {d.status === "READY" && d.previousCommitSha && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRollback(d.id);
                      }}
                      className="text-[10px] text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1 font-semibold shrink-0"
                    >
                      <RotateCcw size={10} />
                      Rollback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Terminal Console */}
          <div>
            {selectedDeployId ? (
              <TerminalLogs deploymentId={selectedDeployId} />
            ) : (
              <div className="text-slate-500 text-sm font-mono text-center py-16">
                Select a deployment to view build details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
