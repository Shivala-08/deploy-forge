"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, ExternalLink } from "lucide-react";
import type { Project } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DomainsPage() {
  const { data: projects } = useSWR<Project[]>("/api/projects", fetcher);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [domain, setDomain] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!selectedProject || !domain) return;
    setAdding(true);
    try {
      await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selectedProject, domain }),
      });
      setDomain("");
    } catch (error) {
      console.error("Failed to add domain:", error);
    } finally {
      setAdding(false);
    }
  };

  const projectsWithDomains =
    projects?.filter((p) => p.customDomain) || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Domains</h1>

      {/* Add Domain */}
      <Card className="mb-6">
        <h3 className="font-semibold mb-4">Add Custom Domain</h3>
        <div className="flex gap-3">            <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
          >
            <option value="" className="bg-[#1a1a24] text-slate-300">Select project</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#1a1a24] text-slate-300">
                {p.name}
              </option>
            ))}
          </select>
          <Input
            placeholder="example.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAdd} disabled={adding || !selectedProject || !domain}>
            <Plus className="h-4 w-4 mr-1" />
            {adding ? "Adding..." : "Add"}
          </Button>
        </div>
      </Card>

      {/* Domain List */}
      {projectsWithDomains.length === 0 ? (
        <Card className="text-center py-12">
          <Globe className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No custom domains configured.</p>
          <p className="text-sm text-slate-500">
            Add a domain to your project above.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {projectsWithDomains.map((p) => (
            <Card key={p.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Globe className="h-5 w-5 text-brand-glow" />
                <div>
                  <p className="font-medium font-mono text-sm">
                    {p.customDomain}
                  </p>
                  <p className="text-xs text-slate-500">{p.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success">Active</Badge>
                <a
                  href={`https://${p.customDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
