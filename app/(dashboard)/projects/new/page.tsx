"use client";

import { DeployWizard } from "@/components/deploy/DeployWizard";

export default function NewProjectPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Deploy New Project</h1>
        <p className="text-sm text-slate-400 mt-1">
          Connect a GitHub repository and deploy it in minutes.
        </p>
      </div>
      <DeployWizard />
    </div>
  );
}
