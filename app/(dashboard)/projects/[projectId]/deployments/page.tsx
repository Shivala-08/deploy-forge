"use client";

import { useDeployments } from "@/hooks/useDeployments";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Card } from "@/components/ui/card";

export default function DeploymentsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const { deployments, isLoading } = useDeployments(projectId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Deployments</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl border border-white/6 bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : deployments.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-400">No deployments yet. Push code to trigger one.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {deployments.map((d) => (
            <Card key={d.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <StatusBadge status={d.status as "QUEUED" | "BUILDING" | "READY" | "ERROR" | "CANCELED"} />
                <div>
                  {d.commitSha && (
                    <span className="font-mono text-sm text-slate-400">
                      {d.commitSha.slice(0, 7)}
                    </span>
                  )}
                  {d.commitMessage && (
                    <span className="text-sm text-slate-400 ml-2">
                      {d.commitMessage}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {new Date(d.triggeredAt).toLocaleString()}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
