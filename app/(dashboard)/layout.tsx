"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { TopNav } from "@/components/dashboard/TopNav";
import dynamic from "next/dynamic";

const ParticleField = dynamic(
  () => import("@/components/3d/ParticleField"),
  { ssr: false }
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <ParticleField />

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
