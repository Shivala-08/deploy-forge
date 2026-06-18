"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Rocket } from "lucide-react";
import type { Site, DeploymentStatus } from "@/types";

const beamVariants = {
  idle: { opacity: 0, scaleY: 0 },
  firing: {
    opacity: [0, 1, 1, 0],
    scaleY: [0, 1, 1, 0],
    transition: { duration: 1.2, times: [0, 0.1, 0.8, 1] },
  },
};

function FrameworkIcon({ framework }: { framework?: string | null }) {
  const icons: Record<string, string> = {
    nextjs: "▲",
    vite: "⚡",
    react: "⚛",
    static: "📄",
    astro: "🚀",
  };
  return (
    <span className="text-lg">{icons[framework || "static"] || "📄"}</span>
  );
}

export function SiteCard({ site }: { site: Site }) {
  const router = useRouter();
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<DeploymentStatus | null>(
    null
  );

  const latestDeployment = site.deployments?.[0];

  const handleDeploy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeploying(true);
    setDeployStatus("QUEUED");

    try {
      const res = await fetch(`/api/deploy`, {
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
      if (res.ok) {
        setDeployStatus("BUILDING");
        setTimeout(() => setDeployStatus(null), 4000);
      }
    } catch {
      setDeployStatus("ERROR");
      setTimeout(() => setDeployStatus(null), 3000);
    } finally {
      setIsDeploying(false);
    }
  };

  const displayStatus = deployStatus || latestDeployment?.status || "QUEUED";

  return (
    <motion.div
      onClick={() => router.push(`/projects/${site.siteId}`)}
      className="relative rounded-xl border border-white/5 bg-[#0f0f1a] p-5 transition-all duration-200 hover:border-white/10 hover:bg-[#0f0f1a]/80 cursor-pointer overflow-hidden group"
      whileHover={{ y: -2 }}
    >
      {/* Deploy Beam Animation */}
      <AnimatePresence>
        {isDeploying && (
          <motion.div
            variants={beamVariants}
            initial="idle"
            animate="firing"
            exit="idle"
            className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-indigo-500 via-indigo-400 to-transparent origin-bottom"
            style={{ transformOrigin: "bottom" }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <FrameworkIcon framework={site.framework} />
            <h3 className="font-semibold text-white">{site.name}</h3>
          </div>
          <StatusBadge status={displayStatus as DeploymentStatus} />
        </div>

        {/* Repo info */}
        <div className="text-xs text-slate-500 font-mono mb-3 truncate">
          {site.repoFullName}
        </div>

        {/* Latest deployment */}
        {latestDeployment && (
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
            {latestDeployment.commitSha && (
              <span className="font-mono text-slate-500">
                {latestDeployment.commitSha.slice(0, 7)}
              </span>
            )}
            {latestDeployment.commitMessage && (
              <span className="truncate">{latestDeployment.commitMessage}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            onClick={handleDeploy}
            disabled={isDeploying || displayStatus === "BUILDING" || displayStatus === "QUEUED"}
          >
            <Rocket className="h-3.5 w-3.5 mr-1" />
            {isDeploying ? "Deploying..." : "Deploy"}
          </Button>
          {site.liveUrl && (
            <a
              href={site.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
