"use client";

import { useEffect, useRef } from "react";
import { useLogStream } from "@/hooks/useLogStream";
import { Copy } from "lucide-react";

interface LogStreamProps {
  deploymentId: string;
}

export function LogStream({ deploymentId }: LogStreamProps) {
  const { logs, isConnected } = useLogStream(deploymentId);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const copyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="rounded-xl border border-white/6 bg-black overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/6 bg-surface/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
          </div>
          <span className="text-xs text-slate-500 font-mono ml-2">
            Build Logs
          </span>
          {isConnected && (
            <span className="text-[10px] text-success flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live
            </span>
          )}
        </div>
        <button
          onClick={copyLogs}
          className="text-slate-500 hover:text-slate-300 transition-colors"
          title="Copy logs"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        className="h-80 overflow-y-auto p-4 font-mono text-xs leading-relaxed"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600">Waiting for build output...</div>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-slate-600 shrink-0 select-none">
                {String(i + 1).padStart(4, "0")}
              </span>
              <span
                className={
                  log.level === "stdout"
                    ? "text-success"
                    : log.level === "stderr"
                      ? "text-danger"
                      : "text-slate-500"
                }
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
