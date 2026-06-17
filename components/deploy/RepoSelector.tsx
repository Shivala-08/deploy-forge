"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { GitHubRepo } from "@/types";

interface RepoSelectorProps {
  onSelect: (repo: GitHubRepo) => void;
  selected: GitHubRepo | null;
}

export function RepoSelector({ onSelect, selected }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/github/repos")
      .then((r) => r.json())
      .then((data) => {
        setRepos(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
