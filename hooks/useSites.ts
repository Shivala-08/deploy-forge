"use client";

import useSWR from "swr";
import type { Site } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useSites() {
  const { data, error, isLoading, mutate } = useSWR<Site[]>(
    "/api/projects",
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 10000,
    }
  );

  return {
    sites: data ?? [],
    isLoading,
    isError: error,
    mutate,
  };
}
