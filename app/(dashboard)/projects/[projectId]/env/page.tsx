"use client";

import { useState, useEffect } from "react";
import { EnvEditor } from "@/components/deploy/EnvEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Save } from "lucide-react";
import type { EnvVar } from "@/types";

export default function EnvPage({
  params,
}: {
  params: { projectId: string };
}) {
  const { projectId } = params;
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/env`)
      .then((r) => r.json())
      .then((data) => {
        setEnvVars(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/projects/${projectId}/env`, {
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
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Environment Variables</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage environment variables for your deployments.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-1.5" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
        </Button>
      </div>

      {loading ? (
        <Card className="h-40 animate-pulse" />
      ) : (
        <Card>
          <EnvEditor value={envVars} onChange={setEnvVars} />
        </Card>
      )}
    </div>
  );
}
