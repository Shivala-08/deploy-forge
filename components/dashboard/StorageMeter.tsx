"use client";

import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface StorageMeterProps {
  usedMb: number;
  limitMb?: number;
}

export function StorageMeter({ usedMb, limitMb = 230 }: StorageMeterProps) {
  const percent = Math.min((usedMb / limitMb) * 100, 100);
  const isWarning = percent > 70;
  const isDanger = percent > 90;

  const color = isDanger
    ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
    : isWarning
    ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
    : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Mesh Storage</span>
        <span className={isDanger ? "text-red-400" : isWarning ? "text-amber-400" : "text-slate-400"}>
          {usedMb}MB / {limitMb}MB
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isDanger && (
        <p className="text-[10px] text-red-400">
          Storage almost full. Delete unused sites to free space.
        </p>
      )}
    </div>
  );
}

export function StorageMeterWrapper() {
  const { data } = useSWR("/api/storage", fetcher, { refreshInterval: 10000 });
  return <StorageMeter usedMb={data?.usedMb ?? 0} />;
}
