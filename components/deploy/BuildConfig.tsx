"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BuildConfigProps {
  framework: string;
  buildCommand: string;
  outputDir: string;
  branch: string;
  onFrameworkChange: (v: string) => void;
  onBuildCommandChange: (v: string) => void;
  onOutputDirChange: (v: string) => void;
  onBranchChange: (v: string) => void;
}

const FRAMEWORK_DEFAULTS: Record<string, { build: string; output: string }> = {
  nextjs: { build: "npm run build", output: ".next" },
  vite: { build: "npm run build", output: "dist" },
  react: { build: "npm run build", output: "build" },
  static: { build: "", output: "public" },
};

export function BuildConfig({
  framework,
  buildCommand,
  outputDir,
  branch,
  onFrameworkChange,
  onBuildCommandChange,
  onOutputDirChange,
  onBranchChange,
}: BuildConfigProps) {
  const handleFrameworkChange = (value: string) => {
    onFrameworkChange(value);
    const defaults = FRAMEWORK_DEFAULTS[value];
    if (defaults) {
      onBuildCommandChange(defaults.build);
      onOutputDirChange(defaults.output);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Framework
        </label>
        <Select value={framework} onValueChange={handleFrameworkChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="nextjs">Next.js</SelectItem>
            <SelectItem value="vite">Vite</SelectItem>
            <SelectItem value="react">Create React App</SelectItem>
            <SelectItem value="static">Static HTML</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Build Command
        </label>
        <Input
          value={buildCommand}
          onChange={(e) => onBuildCommandChange(e.target.value)}
          placeholder="npm run build"
          className="font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Output Directory
        </label>
        <Input
          value={outputDir}
          onChange={(e) => onOutputDirChange(e.target.value)}
          placeholder="dist"
          className="font-mono text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          Branch
        </label>
        <Input
          value={branch}
          onChange={(e) => onBranchChange(e.target.value)}
          placeholder="main"
          className="font-mono text-sm"
        />
      </div>
    </div>
  );
}
