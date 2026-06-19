"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import type { GitHubRepo } from "@/types";

interface RepoSelectorProps {
  onSelect: (repo: GitHubRepo) => void;
  selected: GitHubRepo | null;
}

export function RepoSelector({ onSelect, selected }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/github/repos")
      .then(async (r) => {
        const data = await r.json();
        if (r.ok && Array.isArray(data)) {
          setRepos(data);
        } else {
          console.error("Failed to fetch repos:", data);
          setError(data?.error || "Failed to load repositories.");
          setRepos([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch repos:", err);
        setError("Failed to fetch repositories. Please check your network connection.");
        setRepos([]);
        setLoading(false);
      });
  }, []);


  const filtered = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="bg-white/5"
      />

      {error && (
        <div className="p-4 rounded-lg bg-red-950/20 border border-red-500/20 text-sm text-red-400 flex gap-2">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white">Repository Sync Issue</p>
            <p className="mt-0.5 text-xs text-red-400/80">{error}</p>
            <p className="mt-2 text-xs text-slate-400 font-sans">
              This is usually caused by database migrations or expired session tokens. Please try signing out and signing back in to refresh your GitHub permissions.
            </p>
          </div>
        </div>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {loading ? (
          <div className="text-center py-8 text-sm text-slate-500">
            Loading repositories...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-500">
            {search ? "No repos match your search." : "No repositories found."}
          </div>
        ) : (
          filtered.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onSelect(repo)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-150 ${
                selected?.id === repo.id
                  ? "border-brand/50 bg-brand/5"
                  : "border-white/6 bg-white/2 hover:border-white/10 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{repo.name}</span>
                  <Badge variant={repo.private ? "warning" : "muted"}>
                    {repo.private ? "Private" : "Public"}
                  </Badge>
                </div>
                {repo.language && (
                  <span className="text-xs text-slate-500">{repo.language}</span>
                )}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-mono">
                {repo.full_name}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
