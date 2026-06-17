"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), {
  ssr: false,
});

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-base">
      {/* 3D Hero Background */}
      <HeroScene />

      {/* Hero Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            Ship everything.{" "}
            <span className="text-gradient">Host forever.</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 mb-10 max-w-xl mx-auto">
            Connect GitHub. Push code. DeployForge handles the rest.
          </p>

          <Link href="/dashboard">
            <Button size="lg" className="text-base px-8 shimmer-btn bg-gradient-to-r from-brand to-brand-glow">
              Start deploying
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-16">
          {[
            "GitHub Integration",
            "Zero-Config Deploys",
            "Real-time Logs",
            "Custom Domains",
            "Env Variables",
            "Instant Rollbacks",
          ].map((feature) => (
            <div
              key={feature}
              className="px-4 py-2 rounded-full border border-white/6 bg-white/5 text-sm text-slate-400"
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
