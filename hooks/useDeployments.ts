"use client";

import useSWR from "swr";
import type { Deployment } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDeployments(projectId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Deployment[]>(
    projectId ? `/api/projects/${projectId}/deployments` : null,
    fetcher,
    {
      refreshInterval: (latestData) => {
        if (!latestData) return 5000;
        const hasActive = latestData.some(
          (d: Deployment) =>
            d.status === "BUILDING" || d.status === "QUEUED"
        );
        return hasActive ? 3000 : 30000;
      },
      revalidateOnFocus: true,
    }
  );

  return {
    deployments: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
