"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="w-full h-80 rounded-xl flex flex-col items-center justify-center border border-white/5 bg-[#080810]/80 p-4 text-center">
            <span className="text-2xl mb-2">🛸</span>
            <h4 className="text-sm font-semibold text-slate-300">Visualizer Unavailable</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {this.state.error?.message || "WebGL initialization or rendering failed."}
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
