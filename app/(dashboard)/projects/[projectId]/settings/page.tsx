"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const { data: project } = useSWR(`/api/projects/${projectId}`, fetcher);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    window.location.href = "/projects";
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Project Settings</h1>

      {project && (
        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold mb-4">General</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Name</span>
                <p className="font-medium">{project.name}</p>
              </div>
              <div>
                <span className="text-slate-500">Repository</span>
                <p className="font-medium font-mono text-xs">
                  {project.repoFullName}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Framework</span>
                <p className="font-medium capitalize">
                  {project.framework || "Unknown"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Branch</span>
                <p className="font-medium font-mono">{project.repoBranch}</p>
              </div>
              <div>
                <span className="text-slate-500">Build Command</span>
                <p className="font-medium font-mono text-xs">
                  {project.buildCommand || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Output Directory</span>
                <p className="font-medium font-mono text-xs">
                  {project.outputDir || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Custom Domain</span>
                <p className="font-medium font-mono text-xs">
                  {project.customDomain || "Not set"}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Created</span>
                <p className="font-medium">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-danger/20">
            <h3 className="font-semibold text-danger mb-2">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-4">
              Permanently delete this project and all its deployments.
            </p>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete Project
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
