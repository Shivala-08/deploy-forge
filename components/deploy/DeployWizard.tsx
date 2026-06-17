"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RepoSelector } from "./RepoSelector";
import { BuildConfig } from "./BuildConfig";
import { EnvEditor } from "./EnvEditor";
import { LogStream } from "@/components/logs/LogStream";
import { ArrowLeft, ArrowRight, Rocket, Check } from "lucide-react";
import type { GitHubRepo, EnvVar } from "@/types";

const STEPS = ["Repository", "Build Config", "Environment", "Review & Deploy"];

export function DeployWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [projectName, setProjectName] = useState("");
  const [framework, setFramework] = useState("nextjs");
  const [buildCommand, setBuildCommand] = useState("npm run build");
  const [outputDir, setOutputDir] = useState(".next");
  const [branch, setBranch] = useState("main");
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployedProjectId, setDeployedProjectId] = useState<string | null>(
    null
  );
  const [deployedDeploymentId, setDeployedDeploymentId] = useState<string | null>(
    null
  );

  const canProceed = () => {
    switch (step) {
      case 0:
        return selectedRepo !== null;
      case 1:
        return projectName.trim() !== "";
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleDeploy = async () => {
    if (!selectedRepo) return;
    setIsDeploying(true);
    setDeployError(null);

    try {
      // Create project
      const createRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName || selectedRepo.name,
          repoFullName: selectedRepo.full_name,
          repoBranch: branch,
          framework,
          buildCommand,
          outputDir,
        }),
      });

      if (!createRes.ok) throw new Error("Failed to create project");
      const project = await saveEnvVars(await createRes.json());

      // Trigger deployment
      const deployRes = await fetch(`/api/projects/${project.id}/deploy`, {
        method: "POST",
      });

      if (!deployRes.ok) throw new Error("Failed to trigger deployment");
      const deployment = await deployRes.json();

      setDeployedProjectId(project.id);
      setDeployedDeploymentId(deployment.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Deployment failed. Please try again.";
      setDeployError(message);
    } finally {
      setIsDeploying(false);
    }
  };

  const saveEnvVars = async (project: { id: string }) => {
    if (envVars.length > 0) {
      await fetch(`/api/projects/${project.id}/env`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vars: envVars.map((v) => ({
            key: v.key,
            value: v.value,
            target: v.target,
          })),
        }),
      });
    }
    return project;
  };

  if (deployedProjectId) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold mb-2">Deployment Triggered!</h2>
          <p className="text-slate-400 mb-6">
            Your project is being deployed. Watch the build logs below.
          </p>
        </div>
        <LogStream deploymentId={deployedDeploymentId!} />
        <div className="flex justify-center">
          <Button onClick={() => router.push(`/projects/${deployedProjectId}`)}>
            View Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                i < step
                  ? "bg-success text-white"
                  : i === step
                    ? "bg-brand text-white"
                    : "bg-white/5 text-slate-500"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                i === step ? "text-white" : "text-slate-500"
              }`}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-white/10 mx-3 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Error banner */}
      {deployError && (
        <div className="mb-6 p-4 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger">
          <p className="font-medium">Deployment Error</p>
          <p className="mt-1 text-danger/80">{deployError}</p>
          <button
            onClick={() => setDeployError(null)}
            className="mt-2 text-xs text-danger underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Choose Repository
              </h2>
              <RepoSelector
                onSelect={(repo) => {
                  setSelectedRepo(repo);
                  setProjectName(repo.name);
                }}
                selected={selectedRepo}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Configure Build</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Project Name
                  </label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
                    placeholder="my-project"
                  />
                </div>
                <BuildConfig
                  framework={framework}
                  buildCommand={buildCommand}
                  outputDir={outputDir}
                  branch={branch}
                  onFrameworkChange={setFramework}
                  onBuildCommandChange={setBuildCommand}
                  onOutputDirChange={setOutputDir}
                  onBranchChange={setBranch}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Environment Variables
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Add environment variables for your deployment. You can paste
                KEY=VALUE pairs.
              </p>
              <EnvEditor value={envVars} onChange={setEnvVars} />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Review & Deploy</h2>
              <div className="space-y-4 rounded-xl border border-white/6 bg-surface p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Project</span>
                    <p className="font-medium">{projectName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Repository</span>
                    <p className="font-medium font-mono text-xs">
                      {selectedRepo?.full_name}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Framework</span>
                    <p className="font-medium capitalize">{framework}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Branch</span>
                    <p className="font-medium font-mono">{branch}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Build Command</span>
                    <p className="font-medium font-mono text-xs">
                      {buildCommand}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Env Variables</span>
                    <p className="font-medium">{envVars.length} variables</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="bg-brand hover:bg-brand/90"
          >
            <Rocket className="h-4 w-4 mr-1.5" />
            {isDeploying ? "Deploying..." : "Launch Deploy"}
          </Button>
        )}
      </div>
    </div>
  );
}
