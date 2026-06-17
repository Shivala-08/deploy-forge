"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";

export function TopNav() {
  const { data: session } = useSession();

  return (
    <header className="h-16 border-b border-white/6 bg-surface/50 backdrop-blur-xl flex items-center justify-between px-6">
      <div className="text-sm text-slate-500">
        Mission Control
      </div>

      <div className="flex items-center gap-4">
        <Link href="/projects/new">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Deploy New
          </Button>
        </Link>

        {session?.user && (
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-slate-400">{session.user.name}</span>
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="h-8 w-8 rounded-full border border-white/10"
              />
            )}
          </div>
        )}
      </div>
    </header>
  );
}
