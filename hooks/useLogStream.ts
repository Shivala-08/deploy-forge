"use client";

import { useState, useEffect } from "react";
import type { LogEntry } from "@/types";

export function useLogStream(deploymentId: string | null) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!deploymentId) return;

    const evtSource = new EventSource(`/api/logs/${deploymentId}`);
    setIsConnected(true);

    evtSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setLogs((prev) => [
          ...prev,
          {
            timestamp: data.payload?.createdAt || new Date().toISOString(),
            level:
              data.type === "stdout"
                ? "stdout"
                : data.type === "stderr"
                  ? "stderr"
                  : "system",
            message: data.payload?.text || data.message || JSON.stringify(data),
          },
        ]);
      } catch {
        setLogs((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            level: "system",
            message: e.data,
          },
        ]);
      }
    };

    evtSource.onerror = () => {
      setIsConnected(false);
      evtSource.close();
    };

    return () => {
      evtSource.close();
      setIsConnected(false);
    };
  }, [deploymentId, setLogs]);

  return { logs, isConnected };
}
