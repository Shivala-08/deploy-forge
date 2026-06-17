"use client";

import useSWR from "swr";
import type { Project } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>(
    "/api/projects",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 10000,
    }
  );

  return {
    projects: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
