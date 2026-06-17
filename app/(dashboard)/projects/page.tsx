"use client";

import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FolderOpen } from "lucide-react";

export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-1.5" />
            New Project
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-40 rounded-xl border border-white/6 bg-surface animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
            <FolderOpen className="h-8 w-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-medium text-slate-300 mb-2">
            No projects yet
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Deploy your first repo to get started.
          </p>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Deploy First Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
