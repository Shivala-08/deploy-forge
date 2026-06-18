"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AntigravityPlayground, PhysicsMode } from "@/components/interactive/AntigravityPlayground";
import { ArrowRight, Move, Sparkles, Orbit, Landmark } from "lucide-react";

const HeroScene = dynamic(() => import("@/components/3d/HeroScene"), {
  ssr: false,
});

export default function LandingPage() {
  const [physicsMode, setPhysicsMode] = useState<PhysicsMode>("antigravity");

  return (
    <div className="relative min-h-screen overflow-hidden bg-base">
      {/* 3D Hero Background */}
      <HeroScene mode={physicsMode} />

      {/* Physics Wrapper for DOM Elements */}
      <AntigravityPlayground mode={physicsMode} className="flex flex-col items-center justify-center">
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center select-none pointer-events-none">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            {/* Title */}
            <h1
              data-antigravity
              className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 pointer-events-auto cursor-grab active:cursor-grabbing inline-block"
            >
              Ship everything.{" "}
              <span className="text-gradient">Host forever.</span>
            </h1>

            {/* Subtext */}
            <p
              data-antigravity
              className="text-lg sm:text-xl text-slate-400 mb-10 max-w-xl mx-auto pointer-events-auto cursor-grab active:cursor-grabbing inline-block"
            >
              Connect GitHub. Push code. DeployForge handles the rest.
            </p>

            {/* CTA Button */}
            <div data-antigravity className="pointer-events-auto cursor-grab active:cursor-grabbing inline-block mb-16">
              <Link href="/dashboard" className="pointer-events-auto">
                <Button size="lg" className="text-base px-8 shimmer-btn bg-gradient-to-r from-brand to-brand-glow">
                  Start deploying
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
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
                data-antigravity
                className="px-4 py-2 rounded-full border border-white/6 bg-white/5 text-sm text-slate-400 pointer-events-auto cursor-grab active:cursor-grabbing select-none"
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
      </AntigravityPlayground>

      {/* Interactive Control Pill (Floating UI) */}
      <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end gap-2.5">
        {physicsMode !== "standard" && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-[#090911]/60 text-xs font-mono text-slate-400 backdrop-blur-md animate-pulse">
            <Move className="h-3 w-3 text-indigo-400" />
            <span>Click & throw anything!</span>
          </div>
        )}
        
        <div className="flex items-center gap-1 p-1.5 rounded-full border border-white/10 bg-[#090911]/85 backdrop-blur-xl shadow-2xl">
          <button
            onClick={() => setPhysicsMode("standard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              physicsMode === "standard"
                ? "bg-white/10 text-white shadow-inner"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Landmark className="h-3.5 w-3.5" />
            Standard
          </button>
          
          <button
            onClick={() => setPhysicsMode("antigravity")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              physicsMode === "antigravity"
                ? "bg-brand/20 text-brand-glow border border-brand/20 shadow-lg shadow-brand/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            Antigravity 🛸
          </button>
          
          <button
            onClick={() => setPhysicsMode("gravity")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              physicsMode === "gravity"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Gravity 🌎
          </button>
        </div>
      </div>
    </div>
  );
}
