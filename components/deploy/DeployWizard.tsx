"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RepoSelector } from "./RepoSelector";
import { BuildConfig } from "./BuildConfig";
import { ArrowLeft, ArrowRight, Rocket, Check, Terminal, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import type { GitHubRepo } from "@/types";

const STEPS = ["Repository", "Build Config", "Review", "Deploy Progress"];

interface WorkflowStep {
  name: string;
  status: string; // "queued", "in_progress", "completed"
  conclusion: string | null; // "success", "failure", "skipped", null
}

export function DeployWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  
  // Build config state
  const [projectName, setProjectName] = useState("");
  const [siteId, setSiteId] = useState("");
  const [framework, setFramework] = useState("static");
  const [buildCommand, setBuildCommand] = useState("");
  const [outputDir, setOutputDir] = useState(".");
  const [branch, setBranch] = useState("main");
  
  // Framework detection state
  const [detecting, setDetecting] = useState(false);

  // Deploy state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployedSiteId, setDeployedSiteId] = useState<string | null>(null);
  const [deployedDeploymentId, setDeployedDeploymentId] = useState<string | null>(null);

  // Poll state
  const [workflowStatus, setWorkflowStatus] = useState<string>("QUEUED");
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [pollError, setPollError] = useState<string | null>(null);

  // Auto-detect framework when repo is selected
  const handleRepoSelect = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setProjectName(repo.name);
    
    // Slugify name
    const slug = repo.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setSiteId(slug);
    setBranch(repo.default_branch || "main");

    setDetecting(true);
    try {
      const res = await fetch(`/api/github/detect-framework?repoFullName=${encodeURIComponent(repo.full_name)}`);
      if (res.ok) {
        const data = await res.json();
        setFramework(data.framework);
        setBuildCommand(data.buildCommand);
        setOutputDir(data.outputDir);
      }
    } catch (err) {
      console.error("Framework detection error:", err);
    } finally {
      setDetecting(false);
      setStep(1); // Proceed to build config
    }
  };

  const handleDeploy = async () => {
    if (!selectedRepo) return;
    setIsDeploying(true);
    setDeployError(null);

    try {
      // 1. Create site record
      const siteRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName || selectedRepo.name,
          siteId,
          repoFullName: selectedRepo.full_name,
          repoBranch: branch,
          framework,
          buildCommand,
          outputDir,
        }),
      });

      if (!siteRes.ok) {
        const errorData = await siteRes.json();
        throw new Error(errorData.error || "Failed to create site record");
      }
      
      const site = await siteRes.json();

      // 2. Trigger deployment
      const deployRes = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: site.siteId,
          repoFullName: site.repoFullName,
          repoBranch: site.repoBranch,
          buildCommand: site.buildCommand,
          outputDir: site.outputDir,
        }),
      });

      if (!deployRes.ok) {
        const errorData = await deployRes.json();
        throw new Error(errorData.error || "Failed to trigger deployment pipeline");
      }

      const deployData = await deployRes.json();

      setDeployedSiteId(site.siteId);
      setDeployedDeploymentId(deployData.deployment.id);
      setStep(3); // Go to progress step
    } catch (err) {
      setDeployError(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setIsDeploying(false);
    }
  };

  // Poll workflow status
  useEffect(() => {
    if (!deployedDeploymentId || step !== 3) return;

    let intervalId: NodeJS.Timeout;
    
    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/logs/${deployedDeploymentId}`);
        if (!res.ok) throw new Error("Failed to poll deployment status");
        
        const data = await res.json();
        setWorkflowStatus(data.status);
        if (data.steps) {
          setWorkflowSteps(data.steps);
        }
        
        if (data.status === "READY" || data.status === "ERROR") {
          clearInterval(intervalId);
        }
      } catch (err) {
        setPollError("Failed to fetch build steps from GitHub");
      }
    };

    // Run immediately and then poll every 3 seconds
    pollStatus();
    intervalId = setInterval(pollStatus, 3000);

    return () => clearInterval(intervalId);
  }, [deployedDeploymentId, step]);

  const canProceed = () => {
    switch (step) {
      case 0:
        return selectedRepo !== null;
      case 1:
        return projectName.trim() !== "" && siteId.trim() !== "";
      default:
        return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-indigo-600 text-white"
                    : "bg-white/5 text-slate-500"
              }`}
            >
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                i === step ? "text-white animate-pulse" : "text-slate-500"
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
        <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-500/20 text-sm text-red-400 flex gap-2">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Deployment Error</p>
            <p className="mt-1 text-red-400/80">{deployError}</p>
            <button
              onClick={() => setDeployError(null)}
              className="mt-2 text-xs text-red-400 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
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
              <h2 className="text-xl font-semibold mb-4 text-white">Choose Repository</h2>
              {detecting ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-4" />
                  <p className="text-sm text-slate-400">Analyzing repository file structure...</p>
                </div>
              ) : (
                <RepoSelector
                  onSelect={handleRepoSelect}
                  selected={selectedRepo}
                />
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-white">Configure Build</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Project Name
                  </label>
                  <input
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      setSiteId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                    }}
                    className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                    placeholder="my-project"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Site ID (URL Slug)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono">/sites/</span>
                    <input
                      value={siteId}
                      onChange={(e) => setSiteId(e.target.value.toLowerCase().replace(/[^a-z0-9-/]+/g, ""))}
                      className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white font-mono focus:border-indigo-500 focus:outline-none"
                      placeholder="site-slug"
                    />
                  </div>
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
              <h2 className="text-xl font-semibold mb-4 text-white">Review & Launch</h2>
              <div className="space-y-5">
                <div className="space-y-4 rounded-xl border border-white/5 bg-[#0f0f1a] p-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Site Name</span>
                      <p className="font-medium text-white">{projectName}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Repository</span>
                      <p className="font-medium font-mono text-xs text-slate-300 truncate">
                        {selectedRepo?.full_name}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Framework</span>
                      <p className="font-medium text-white capitalize">{framework}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Branch</span>
                      <p className="font-medium font-mono text-slate-300">{branch}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Build Command</span>
                      <p className="font-medium font-mono text-xs text-slate-300">
                        {buildCommand || "None (Static serving)"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Output Folder</span>
                      <p className="font-medium font-mono text-xs text-slate-300">
                        {outputDir}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-slate-500 text-xs">Live URL Preview</span>
                    <p className="font-mono text-xs text-indigo-400 font-semibold mt-0.5">
                      https://deploy-forge-4klc.vercel.app/sites/{siteId}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-white/5 bg-white/2 p-4 text-xs text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-300">How Monorepo Static Mesh works:</p>
                  <p>DeployForge compiles your site using GitHub Actions (completely free), then commits the built output directly to DeployForge's own repository. Vercel auto-redeploys DeployForge in 30s to make the site live under one project.</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-6">
                {workflowStatus === "READY" ? (
                  <div className="text-5xl mb-3 animate-bounce">🎉</div>
                ) : workflowStatus === "ERROR" ? (
                  <div className="text-5xl mb-3">❌</div>
                ) : (
                  <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mx-auto mb-3" />
                )}
                <h2 className="text-xl font-bold text-white">
                  {workflowStatus === "READY"
                    ? "Site is Live!"
                    : workflowStatus === "ERROR"
                      ? "Deployment Failed"
                      : "Building site on GitHub..."}
                </h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
                  {workflowStatus === "READY"
                    ? "Deployment completed successfully. Your site is active in the mesh."
                    : workflowStatus === "ERROR"
                      ? "Review build logs below for detailed errors."
                      : "GitHub Actions runner is compiling and copying your site to the mesh..."}
                </p>
              </div>

              {/* Steps checklist Terminal */}
              <div className="rounded-xl border border-white/5 bg-[#080810] overflow-hidden font-mono text-xs shadow-2xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-white/2 border-b border-white/5 text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>deployforge-runner.sh</span>
                  </div>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-indigo-400 uppercase tracking-widest font-semibold">
                    {workflowStatus}
                  </span>
                </div>

                <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
                  {workflowSteps.length === 0 ? (
                    <div className="flex items-center justify-center py-8 text-slate-500 gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Contacting GitHub Actions dispatcher...</span>
                    </div>
                  ) : (
                    workflowSteps.map((s, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-white/2 pb-1.5 last:border-0 last:pb-0">
                        <span className={s.status === "in_progress" ? "text-amber-400" : s.conclusion === "failure" ? "text-red-400" : "text-slate-300"}>
                          {s.status === "in_progress" && <span className="mr-2 animate-pulse">❯</span>}
                          {s.name}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          {s.status === "in_progress" && (
                            <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                          )}
                          {s.status === "queued" && (
                            <span className="text-[10px] text-slate-600">queued</span>
                          )}
                          {s.status === "completed" && s.conclusion === "success" && (
                            <span className="text-emerald-500 text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded font-semibold">SUCCESS</span>
                          )}
                          {s.status === "completed" && s.conclusion === "failure" && (
                            <span className="text-red-500 text-[10px] bg-red-500/10 px-2 py-0.5 rounded font-semibold">FAILED</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {workflowStatus === "READY" && (
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 text-slate-300"
                    onClick={() => router.push(`/projects/${deployedSiteId}`)}
                  >
                    View Project
                  </Button>
                  <Button
                    className="bg-indigo-600 hover:bg-indigo-500 text-white"
                    onClick={() => window.open(`/sites/${deployedSiteId}`, "_blank")}
                  >
                    Open Live Site
                    <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </div>
              )}

              {workflowStatus === "ERROR" && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    className="border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                    onClick={() => setStep(1)}
                  >
                    Adjust Build Config
                  </Button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation buttons */}
      {step < 3 && (
        <div className="flex justify-between mt-8 pt-4 border-t border-white/5">
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back
          </Button>

          {step < 2 ? (
            <Button
              className="bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          ) : (
            <Button
              onClick={handleDeploy}
              disabled={isDeploying}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"
            >
              <Rocket className="h-4 w-4 mr-1.5" />
              {isDeploying ? "Deploying..." : "Launch Deploy"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
