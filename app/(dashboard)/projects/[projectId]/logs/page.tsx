"use client";

import { useDeployments } from "@/hooks/useDeployments";
import { LogStream } from "@/components/logs/LogStream";
import { Card } from "@/components/ui/card";

export default function LogsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const { deployments, isLoading } = useDeployments(projectId);

  const latestDeploy = deployments
    .filter((d) => d.status === "BUILDING" || d.status === "QUEUED" || d.status === "READY" || d.status === "ERROR")
    .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())[0];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Build Logs</h1>

      {isLoading ? (
        <Card className="h-80 animate-pulse" />
      ) : !latestDeploy ? (
        <Card className="text-center py-12">
          <p className="text-slate-400">
            No active deployments. Deploy your project to see build logs.
          </p>
        </Card>
      ) : (
        <LogStream deploymentId={latestDeploy.id} />
      )}
    </div>
  );
}
