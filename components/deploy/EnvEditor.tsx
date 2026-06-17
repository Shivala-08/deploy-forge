"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Eye, EyeOff } from "lucide-react";
import type { EnvVar } from "@/types";

interface EnvEditorProps {
  value: EnvVar[];
  onChange: (vars: EnvVar[]) => void;
}

export function EnvEditor({ value, onChange }: EnvEditorProps) {
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});

  const addVar = () => {
    onChange([
      ...value,
      { id: `new-${Date.now()}`, key: "", value: "", target: "production", projectId: "" },
    ]);
  };

  const removeVar = (id: string) => {
    onChange(value.filter((v) => v.id !== id));
  };

  const updateVar = (id: string, field: "key" | "value", newValue: string) => {
    onChange(value.map((v) => (v.id === id ? { ...v, [field]: newValue } : v)));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (text.includes("=") && text.includes("\n")) {
      e.preventDefault();
      const vars = text
        .split("\n")
        .filter((line) => line.includes("="))
        .map((line) => {
          const eqIndex = line.indexOf("=");
          return {
            id: `paste-${Date.now()}-${Math.random()}`,
            key: line.slice(0, eqIndex).trim(),
            value: line.slice(eqIndex + 1).trim(),
            target: "production",
            projectId: "",
          };
        });
      onChange([...value, ...vars]);
    }
  };

  const toggleShowValue = (id: string) => {
    setShowValues((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <div className="text-center py-8 text-sm text-slate-500 border border-dashed border-white/10 rounded-lg">
          No environment variables yet. Click "Add Variable" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((v) => (
            <div key={v.id} className="flex items-center gap-2">
              <Input
                placeholder="KEY"
                value={v.key}
                onChange={(e) => updateVar(v.id, "key", e.target.value)}
                onPaste={handlePaste}
                className="flex-1 font-mono text-xs"
              />
              <div className="relative flex-1">
                <Input
                  placeholder="value"
                  type={showValues[v.id] ? "text" : "password"}
                  value={v.value}
                  onChange={(e) => updateVar(v.id, "value", e.target.value)}
                  className="font-mono text-xs pr-8"
                />
                <button
                  type="button"
                  onClick={() => toggleShowValue(v.id)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showValues[v.id] ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeVar(v.id)}
                className="h-9 w-9 shrink-0 text-slate-500 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" size="sm" onClick={addVar}>
        + Add Variable
      </Button>
    </div>
  );
}
