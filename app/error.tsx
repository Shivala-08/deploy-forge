"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, Rocket } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-danger/10 mb-6">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-400 mb-6">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex justify-center gap-3">
          <Button onClick={reset} variant="outline">
            Try again
          </Button>
          <a href="/">
            <Button>
              <Rocket className="h-4 w-4 mr-1.5" />
              Go Home
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
